import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';

function centerFromParadas(paradas) {
    const first = (paradas ?? []).find((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    return first ? [first.lat, first.lng] : [18.4861, -69.9312];
}

function distance2(a, b) {
    const dx = a.lat - b.lat;
    const dy = a.lng - b.lng;
    return dx * dx + dy * dy;
}

function orderNearestNeighbor(points) {
    if (!points || points.length <= 2) return points ?? [];
    const remaining = points.slice(1);
    const out = [points[0]];
    while (remaining.length) {
        const last = out[out.length - 1];
        let bestIdx = 0;
        let best = distance2(last, remaining[0]);
        for (let i = 1; i < remaining.length; i++) {
            const d = distance2(last, remaining[i]);
            if (d < best) {
                best = d;
                bestIdx = i;
            }
        }
        out.push(remaining.splice(bestIdx, 1)[0]);
    }
    return out;
}

async function fetchOsrmPolyline(points) {
    if (!points || points.length < 2) return null;
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const coordsOut = json?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coordsOut) || coordsOut.length === 0) return null;
    // OSRM devuelve [lng,lat]; Leaflet necesita [lat,lng]
    return coordsOut.map((c) => [c[1], c[0]]);
}

function googleMapsDirectionsUrl(points) {
    if (!points || points.length < 2) return null;
    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    const waypoints = points
        .slice(1, -1)
        .map((p) => `${p.lat},${p.lng}`)
        .join('|');
    const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' });
    if (waypoints) params.set('waypoints', waypoints);
    return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function RutasCobroEdit({ ruta, cobradores, clientes, clientesAsignados, paradas = [] }) {
    const asignadosSet = useMemo(() => new Set((clientesAsignados ?? []).map(String)), [clientesAsignados]);

    const { data, setData, put, processing, errors } = useForm({
        nombre: ruta.nombre ?? '',
        dia: ruta.dia ?? '',
        sector: ruta.sector ?? '',
        frecuencia: ruta.frecuencia ?? '',
        cobrador_id: ruta.cobrador_id ?? '',
        activa: !!ruta.activa,
        clientes: (clientesAsignados ?? []).map((x) => String(x)),
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('rutas-cobro.update', ruta.id));
    };

    const toggleCliente = (id) => {
        const sid = String(id);
        const next = new Set(data.clientes);
        if (next.has(sid)) next.delete(sid);
        else next.add(sid);
        setData('clientes', Array.from(next));
    };

    const conUbicacion = (paradas ?? []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    const sinUbicacion = (paradas ?? []).filter((p) => !Number.isFinite(p.lat) || !Number.isFinite(p.lng));

    const [ordenLocal, setOrdenLocal] = useState(() => {
        // Prioridad: orden DB; si no hay, nearest-neighbor sobre los que tienen ubicación
        const hasOrden = (paradas ?? []).some((p) => p.orden !== null && p.orden !== undefined);
        const base = (paradas ?? []).slice();
        if (hasOrden) {
            base.sort((a, b) => {
                const ao = a.orden ?? 999999;
                const bo = b.orden ?? 999999;
                if (ao !== bo) return ao - bo;
                return String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''));
            });
            return base.map((p) => p.cliente_id);
        }
        const withPos = orderNearestNeighbor(conUbicacion);
        const withPosIds = new Set(withPos.map((p) => p.cliente_id));
        const rest = base.filter((p) => !withPosIds.has(p.cliente_id)).sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? '')));
        return [...withPos.map((p) => p.cliente_id), ...rest.map((p) => p.cliente_id)];
    });

    const paradasPorId = useMemo(() => {
        const m = new Map();
        (paradas ?? []).forEach((p) => m.set(p.cliente_id, p));
        return m;
    }, [paradas]);

    const paradasOrdenadas = useMemo(() => {
        const out = [];
        const seen = new Set();
        (ordenLocal ?? []).forEach((id) => {
            const p = paradasPorId.get(id);
            if (p) {
                out.push(p);
                seen.add(id);
            }
        });
        // si llegan nuevas paradas y no están en ordenLocal, agregarlas al final
        (paradas ?? []).forEach((p) => {
            if (!seen.has(p.cliente_id)) out.push(p);
        });
        return out;
    }, [ordenLocal, paradasPorId, paradas]);

    const puntosRuta = useMemo(
        () => paradasOrdenadas.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
        [paradasOrdenadas],
    );

    const [polyline, setPolyline] = useState(null);
    const polyAbortRef = useRef(null);

    useEffect(() => {
        setPolyline(null);
        if (polyAbortRef.current) {
            polyAbortRef.current.aborted = true;
        }
        const abort = { aborted: false };
        polyAbortRef.current = abort;

        (async () => {
            if (puntosRuta.length < 2) return;
            try {
                const pl = await fetchOsrmPolyline(puntosRuta);
                if (!abort.aborted) {
                    setPolyline(pl ?? puntosRuta.map((p) => [p.lat, p.lng]));
                }
            } catch {
                if (!abort.aborted) {
                    setPolyline(puntosRuta.map((p) => [p.lat, p.lng]));
                }
            }
        })();

        return () => {
            abort.aborted = true;
        };
    }, [puntosRuta]);

    const onDragStart = (id) => (e) => {
        e.dataTransfer.setData('text/plain', String(id));
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDropOn = (toId) => (e) => {
        e.preventDefault();
        const fromId = Number(e.dataTransfer.getData('text/plain'));
        if (!fromId || fromId === toId) return;
        setOrdenLocal((prev) => {
            const arr = (prev ?? []).slice();
            const fromIdx = arr.indexOf(fromId);
            const toIdx = arr.indexOf(toId);
            if (fromIdx === -1 || toIdx === -1) return arr;
            arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, fromId);
            return arr;
        });
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const guardarOrden = () => {
        router.post(
            route('rutas_cobro.orden', { rutaCobro: ruta.id }),
            { cliente_ids: paradasOrdenadas.map((p) => p.cliente_id) },
            { preserveScroll: true },
        );
    };

    const mapsUrl = useMemo(() => googleMapsDirectionsUrl(puntosRuta), [puntosRuta]);

    const whatsappUrl = useMemo(() => {
        if (!mapsUrl) return null;
        const txt = `Ruta de cobro: ${ruta?.nombre ?? ''}\n${mapsUrl}`;
        return `https://wa.me/?text=${encodeURIComponent(txt)}`;
    }, [mapsUrl, ruta?.nombre]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Editar ruta</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">Configura la ruta y asigna clientes.</p>
                    </div>
                    <Link
                        href={route('rutas-cobro.index')}
                        className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Editar ruta" />

            <form onSubmit={submit} className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm grid grid-cols-1 gap-4">
                        <div>
                            <InputLabel htmlFor="nombre" value="Nombre" />
                            <TextInput
                                id="nombre"
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.nombre} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="dia" value="Día" />
                                <TextInput
                                    id="dia"
                                    value={data.dia}
                                    onChange={(e) => setData('dia', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.dia} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="sector" value="Sector" />
                                <TextInput
                                    id="sector"
                                    value={data.sector}
                                    onChange={(e) => setData('sector', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.sector} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="frecuencia" value="Frecuencia" />
                                <select
                                    id="frecuencia"
                                    value={data.frecuencia}
                                    onChange={(e) => setData('frecuencia', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                >
                                    <option value="">—</option>
                                    <option value="semanal">Semanal</option>
                                    <option value="quincenal">Quincenal</option>
                                    <option value="mensual">Mensual</option>
                                </select>
                                <InputError message={errors.frecuencia} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="cobrador_id" value="Cobrador" />
                                <select
                                    id="cobrador_id"
                                    value={data.cobrador_id ?? ''}
                                    onChange={(e) => setData('cobrador_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                >
                                    <option value="">—</option>
                                    {cobradores.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.email})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.cobrador_id} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                id="activa"
                                type="checkbox"
                                checked={!!data.activa}
                                onChange={(e) => setData('activa', e.target.checked)}
                                className="rounded border-outline-variant"
                            />
                            <label htmlFor="activa" className="text-sm text-on-surface">
                                Ruta activa
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>Guardar cambios</PrimaryButton>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-outline-variant">
                            <div className="font-bold text-on-surface">Clientes asignados</div>
                            <div className="text-sm text-on-surface-variant">Marca los clientes que pertenecen a esta ruta.</div>
                        </div>
                        <div className="max-h-[520px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface-container-low sticky top-0">
                                    <tr className="text-label-sm text-outline uppercase tracking-wider">
                                        <th className="px-6 py-3">Asignar</th>
                                        <th className="px-6 py-3">Cliente</th>
                                        <th className="px-6 py-3">Teléfono</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {clientes.map((c) => {
                                        const checked = data.clientes.includes(String(c.id)) || asignadosSet.has(String(c.id));
                                        return (
                                            <tr key={c.id} className="hover:bg-surface-container-low/60">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.clientes.includes(String(c.id))}
                                                        onChange={() => toggleCliente(c.id)}
                                                        className="rounded border-outline-variant"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-on-surface">
                                                        {c.nombre} {c.apellido ?? ''}
                                                    </div>
                                                    <div className="text-xs text-on-surface-variant">{c.cedula_rnc ?? 's/d'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-on-surface-variant">{c.telefono ?? '—'}</td>
                                            </tr>
                                        );
                                    })}
                                    {clientes.length === 0 ? (
                                        <tr>
                                            <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan={3}>
                                                No hay clientes.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-outline-variant text-xs text-on-surface-variant">
                            Seleccionados: {data.clientes.length}
                        </div>
                    </div>
                    <InputError message={errors.clientes} className="mt-2" />

                    <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-outline-variant">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="font-bold text-on-surface">Mapa del día</div>
                                    <div className="text-sm text-on-surface-variant">
                                        Marcadores de clientes con ubicación guardada. Para que aparezcan aquí, edita el cliente y fija su punto en el mapa.
                                    </div>
                                    <div className="mt-2 text-xs text-on-surface-variant">
                                        Con ubicación: <span className="font-semibold text-on-surface">{conUbicacion.length}</span> · Pendientes:{' '}
                                        <span className="font-semibold text-on-surface">{sinUbicacion.length}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {mapsUrl ? (
                                        <a
                                            href={mapsUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                        >
                                            Abrir en Maps
                                        </a>
                                    ) : (
                                        <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                                            Falta ubicación
                                        </span>
                                    )}
                                    {whatsappUrl ? (
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                        >
                                            WhatsApp
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12">
                            <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-outline-variant">
                                <div className="h-[420px]">
                                    <MapContainer center={centerFromParadas(conUbicacion)} zoom={13} scrollWheelZoom className="h-full w-full">
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        {(puntosRuta ?? []).map((p) => (
                                            <Marker key={p.cliente_id} position={[p.lat, p.lng]} />
                                        ))}
                                        {polyline && polyline.length >= 2 ? (
                                            <Polyline positions={polyline} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.85 }} />
                                        ) : null}
                                    </MapContainer>
                                </div>
                            </div>
                            <div className="lg:col-span-5">
                                <div className="flex items-center justify-between gap-2 px-6 py-3 border-b border-outline-variant">
                                    <div className="text-sm font-semibold text-on-surface">Orden de paradas</div>
                                    <button
                                        type="button"
                                        onClick={guardarOrden}
                                        className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                        disabled={(paradasOrdenadas ?? []).length === 0}
                                    >
                                        Guardar orden
                                    </button>
                                </div>

                                <div className="max-h-[420px] overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-surface-container-low sticky top-0">
                                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                                <th className="px-6 py-3">#</th>
                                                <th className="px-6 py-3">Cliente</th>
                                                <th className="px-6 py-3">Ubicación</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant">
                                            {(paradasOrdenadas ?? []).map((p, idx) => {
                                                const ok = Number.isFinite(p.lat) && Number.isFinite(p.lng);
                                                return (
                                                    <tr key={p.cliente_id} className="hover:bg-surface-container-low/60">
                                                        <td
                                                            className="px-6 py-4 text-sm text-on-surface-variant"
                                                            draggable
                                                            onDragStart={onDragStart(p.cliente_id)}
                                                            onDragOver={onDragOver}
                                                            onDrop={onDropOn(p.cliente_id)}
                                                            title="Arrastra para reordenar"
                                                        >
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-on-surface">
                                                                {p.nombre} {p.apellido ?? ''}
                                                            </div>
                                                            <div className="text-xs text-on-surface-variant truncate" title={p.direccion ?? ''}>
                                                                {p.direccion ?? '—'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {ok ? (
                                                                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                                                    OK
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {(paradasOrdenadas ?? []).length === 0 ? (
                                                <tr>
                                                    <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan={3}>
                                                        No hay clientes asignados a esta ruta.
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

