import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

export default function CobrosIndex({ rutas, cuotas, filtros }) {
    const { auth } = usePage().props;
    const permisos = new Set(auth?.permisos ?? []);
    const rutaId = filtros?.ruta_id ?? '';
    const estado = filtros?.estado ?? 'pendiente';

    const { data, setData, post, processing, errors, reset } = useForm({
        cuota_id: '',
        fecha: new Date().toISOString().slice(0, 10),
        monto: '',
        mora: 0,
        descuento: 0,
        metodo_pago: 'efectivo',
        estado_visita: 'pagado',
        nota: '',
        monto_promesa: '',
        fecha_promesa: '',
    });

    const setFiltro = (next) => {
        router.get(route('cobros.index'), { ruta_id: rutaId || undefined, estado, ...next }, { preserveState: true, replace: true });
    };

    const abrirCobro = (cuota) => {
        setData({
            ...data,
            cuota_id: cuota.id,
            monto: Math.max(0, Number(cuota.monto) - Number(cuota.pagado || 0)).toFixed(2),
            estado_visita: 'pagado',
            nota: '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('cobros.store'), {
            onSuccess: () => {
                reset('cuota_id', 'monto', 'mora', 'descuento', 'nota', 'monto_promesa', 'fecha_promesa');
            },
        });
    };

    const gruposPorCliente = useMemo(() => {
        const list = cuotas?.data ?? [];
        const orden = [];
        const map = new Map();
        for (const c of list) {
            const id = c.cliente_id;
            if (!map.has(id)) {
                const grupo = {
                    cliente_id: id,
                    nombre: c.nombre,
                    apellido: c.apellido,
                    telefono: c.telefono,
                    cuotas: [],
                };
                map.set(id, grupo);
                orden.push(grupo);
            }
            map.get(id).cuotas.push(c);
        }
        return orden;
    }, [cuotas?.data]);

    /** IDs de cliente con el bloque plegado (retraído). Vacío = todos desplegados. */
    const [colapsadosIds, setColapsadosIds] = useState(() => new Set());

    const toggleCliente = useCallback((clienteId) => {
        const id = Number(clienteId);
        setColapsadosIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandirTodosClientes = useCallback(() => {
        setColapsadosIds(new Set());
    }, []);

    const contraerTodosClientes = useCallback(() => {
        const all = new Set(gruposPorCliente.map((g) => Number(g.cliente_id)));
        setColapsadosIds(all);
    }, [gruposPorCliente]);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Cobros</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                        Cuotas agrupadas por cliente: usa la cabecera de cada uno para plegar o desplegar. Así compactas la ruta mientras
                        caminas el cobro.
                    </p>
                </div>
            }
        >
            <Head title="Cobros" />

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <form onSubmit={submit} className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
                        <div className="font-bold text-on-surface">Registrar gestión</div>

                        <div>
                            <InputLabel htmlFor="cuota_id" value="Cuota seleccionada" />
                            <TextInput id="cuota_id" value={data.cuota_id || ''} disabled className="mt-1 block w-full" />
                            <InputError message={errors.cuota_id} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <InputLabel htmlFor="fecha" value="Fecha" />
                                <TextInput
                                    id="fecha"
                                    type="date"
                                    value={data.fecha}
                                    onChange={(e) => setData('fecha', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.fecha} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="metodo_pago" value="Método" />
                                <select
                                    id="metodo_pago"
                                    value={data.metodo_pago}
                                    onChange={(e) => setData('metodo_pago', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="deposito">Depósito</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="estado_visita" value="Estado visita" />
                            <select
                                id="estado_visita"
                                value={data.estado_visita}
                                onChange={(e) => setData('estado_visita', e.target.value)}
                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            >
                                <option value="pagado">Pagó</option>
                                <option value="promesa">Promesa</option>
                                <option value="no_pago">No pagó</option>
                                <option value="no_localizado">No localizado</option>
                            </select>
                            <InputError message={errors.estado_visita} className="mt-2" />
                        </div>

                        {data.estado_visita === 'pagado' ? (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-3">
                                    <InputLabel htmlFor="monto" value="Monto" />
                                    <TextInput
                                        id="monto"
                                        type="number"
                                        value={data.monto}
                                        onChange={(e) => setData('monto', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.monto} className="mt-2" />
                                </div>
                                <div className="col-span-1">
                                    <InputLabel htmlFor="mora" value="Mora" />
                                    <TextInput
                                        id="mora"
                                        type="number"
                                        value={data.mora}
                                        onChange={(e) => setData('mora', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <InputLabel htmlFor="descuento" value="Descuento" />
                                    <TextInput
                                        id="descuento"
                                        type="number"
                                        value={data.descuento}
                                        onChange={(e) => setData('descuento', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                            </div>
                        ) : null}

                        {data.estado_visita === 'promesa' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <InputLabel htmlFor="fecha_promesa" value="Fecha promesa" />
                                    <TextInput
                                        id="fecha_promesa"
                                        type="date"
                                        value={data.fecha_promesa}
                                        onChange={(e) => setData('fecha_promesa', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="monto_promesa" value="Monto promesa" />
                                    <TextInput
                                        id="monto_promesa"
                                        type="number"
                                        value={data.monto_promesa}
                                        onChange={(e) => setData('monto_promesa', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <InputLabel htmlFor="nota" value="Nota" />
                            <textarea
                                id="nota"
                                value={data.nota}
                                onChange={(e) => setData('nota', e.target.value)}
                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                rows={2}
                            />
                            <InputError message={errors.nota} className="mt-2" />
                        </div>

                        <PrimaryButton disabled={processing || !data.cuota_id} className="w-full justify-center">
                            Guardar
                        </PrimaryButton>
                    </form>
                </div>

                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm flex flex-wrap gap-3 items-end">
                        <div>
                            <InputLabel htmlFor="ruta_id" value="Ruta" />
                            <select
                                id="ruta_id"
                                value={rutaId ?? ''}
                                onChange={(e) => setFiltro({ ruta_id: e.target.value || undefined })}
                                className="mt-1 block w-64 rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            >
                                <option value="">Todas</option>
                                {rutas.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="estado" value="Estado" />
                            <select
                                id="estado"
                                value={estado}
                                onChange={(e) => setFiltro({ estado: e.target.value })}
                                className="mt-1 block w-52 rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="vencida">Vencida</option>
                                <option value="pagada">Pagada</option>
                            </select>
                        </div>
                        <div className="text-sm text-on-surface-variant">
                            Mostrando: <span className="font-semibold text-on-surface">{cuotas.total}</span> cuotas
                        </div>
                        {gruposPorCliente.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={expandirTodosClientes}
                                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                >
                                    Desplegar todos
                                </button>
                                <button
                                    type="button"
                                    onClick={contraerTodosClientes}
                                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                >
                                    Retraer todos
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        {gruposPorCliente.length === 0 ? (
                            <div className="rounded-xl border border-outline-variant bg-white px-6 py-10 text-center text-sm text-on-surface-variant shadow-sm">
                                No hay cuotas para los filtros seleccionados.
                            </div>
                        ) : (
                            gruposPorCliente.map((grupo) => {
                                const cid = Number(grupo.cliente_id);
                                const desplegado = !colapsadosIds.has(cid);
                                return (
                                    <div
                                        key={grupo.cliente_id}
                                        className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleCliente(grupo.cliente_id)}
                                            className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-3 text-left transition hover:bg-surface-container-low/80"
                                            aria-expanded={desplegado}
                                        >
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <span
                                                    className={
                                                        'mt-1 inline-flex shrink-0 text-on-surface-variant transition-transform duration-200 ' +
                                                        (desplegado ? 'rotate-0' : '-rotate-90')
                                                    }
                                                    aria-hidden
                                                >
                                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="text-base font-bold text-on-surface">
                                                        {grupo.nombre} {grupo.apellido ?? ''}
                                                    </div>
                                                    <div className="text-sm text-on-surface-variant">{grupo.telefono ?? 'Sin teléfono'}</div>
                                                    <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-outline">
                                                        {desplegado ? 'Clic para retraer' : 'Clic para desplegar cuotas'}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-primary-container/15 px-3 py-1 text-xs font-semibold text-primary-container">
                                                {grupo.cuotas.length} {grupo.cuotas.length === 1 ? 'cuota' : 'cuotas'}
                                            </span>
                                        </button>
                                        {desplegado ? (
                                            <table className="w-full text-left">
                                                <thead className="bg-white">
                                                    <tr className="text-label-sm text-outline uppercase tracking-wider">
                                                        <th className="px-6 py-2">Vence</th>
                                                        <th className="px-6 py-2">Cuota</th>
                                                        <th className="px-6 py-2">Pagado</th>
                                                        <th className="px-6 py-2">Estado</th>
                                                        <th className="px-6 py-2">Financiamiento</th>
                                                        <th className="px-6 py-2 text-right">Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-outline-variant">
                                                    {grupo.cuotas.map((c) => (
                                                        <tr key={c.id} className="hover:bg-surface-container-low/60">
                                                            <td className="px-6 py-3 text-sm text-on-surface-variant">{c.vencimiento}</td>
                                                            <td className="px-6 py-3 text-sm text-on-surface-variant">
                                                                #{c.numero} — RD$ {Number(c.monto).toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-on-surface-variant">
                                                                RD$ {Number(c.pagado || 0).toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface">
                                                                    {c.estado}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                {permisos.has('financiamientos.ver') && c.financiamiento_id ? (
                                                                    <Link
                                                                        href={route('financiamientos.show', c.financiamiento_id)}
                                                                        className="text-sm font-semibold text-primary-container hover:underline"
                                                                    >
                                                                        Ver plan #{c.financiamiento_id}
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-sm text-on-surface-variant">
                                                                        {c.financiamiento_id ? `#${c.financiamiento_id}` : '—'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => abrirCobro(c)}
                                                                    className="rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                                                                >
                                                                    Cobrar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : null}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <InputError message={errors.general} className="mt-2" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

