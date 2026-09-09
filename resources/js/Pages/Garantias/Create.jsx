import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function GarantiasCreate({ clientes, productos, ventas }) {
    const { data, setData, post, processing, errors } = useForm({
        fecha_reclamo: new Date().toISOString().slice(0, 10),
        tipo: 'fabricante',
        estado: 'abierta',
        venta_id: '',
        detalle_venta_id: '',
        cliente_id: '',
        producto_id: '',
        motivo: '',
        descripcion: '',
    });

    const [detalles, setDetalles] = useState([]);
    const [loadingDetalles, setLoadingDetalles] = useState(false);

    const productoBloqueado = useMemo(() => !!data.detalle_venta_id, [data.detalle_venta_id]);

    useEffect(() => {
        const vid = String(data.venta_id || '').trim();
        if (!vid) {
            setDetalles([]);
            setData('detalle_venta_id', '');
            return;
        }

        let cancelled = false;
        setLoadingDetalles(true);

        fetch(route('garantias.venta_detalles', { venta: vid }), { headers: { Accept: 'application/json' } })
            .then(async (r) => {
                if (!r.ok) {
                    throw new Error(`HTTP ${r.status}`);
                }
                return await r.json();
            })
            .then((json) => {
                if (cancelled) return;
                const rows = json?.detalles ?? [];
                setDetalles(rows);

                // Si no seleccionó cliente y la venta tiene cliente_id, lo preseleccionamos (opcional).
                const ventaClienteId = json?.venta?.cliente_id ?? null;
                if (!data.cliente_id && ventaClienteId) {
                    setData('cliente_id', String(ventaClienteId));
                }
            })
            .catch(() => {
                if (cancelled) return;
                setDetalles([]);
            })
            .finally(() => {
                if (cancelled) return;
                setLoadingDetalles(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.venta_id]);

    const submit = (e) => {
        e.preventDefault();
        post(route('garantias.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Nueva garantía</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">Registra el reclamo vinculado a un producto/venta.</p>
                    </div>
                    <Link
                        href={route('garantias.index')}
                        className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Nueva garantía" />

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="fecha_reclamo" value="Fecha reclamo" />
                        <TextInput
                            id="fecha_reclamo"
                            type="date"
                            value={data.fecha_reclamo}
                            onChange={(e) => setData('fecha_reclamo', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.fecha_reclamo} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="tipo" value="Tipo" />
                        <select
                            id="tipo"
                            value={data.tipo}
                            onChange={(e) => setData('tipo', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="fabricante">Fabricante</option>
                            <option value="tienda">Tienda</option>
                        </select>
                        <InputError message={errors.tipo} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="cliente_id" value="Cliente (opcional)" />
                        <select
                            id="cliente_id"
                            value={data.cliente_id}
                            onChange={(e) => setData('cliente_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="">—</option>
                            {clientes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre} {c.apellido ?? ''} ({c.cedula_rnc ?? 's/d'})
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.cliente_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="venta_id" value="Venta (opcional)" />
                        <select
                            id="venta_id"
                            value={data.venta_id}
                            onChange={(e) => setData('venta_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="">—</option>
                            {ventas.map((v) => (
                                <option key={v.id} value={v.id}>
                                    #{v.id} — {v.fecha} — RD$ {Number(v.total).toFixed(2)}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.venta_id} className="mt-2" />
                        {data.venta_id ? (
                            <div className="mt-2 text-xs text-outline">
                                {loadingDetalles ? 'Cargando productos de la venta…' : `${detalles.length} item(s) en la venta.`}
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <InputLabel htmlFor="detalle_venta_id" value="Producto vendido (detalle de venta)" />
                        <select
                            id="detalle_venta_id"
                            value={data.detalle_venta_id}
                            onChange={(e) => {
                                const id = e.target.value;
                                setData('detalle_venta_id', id);
                                const row = (detalles ?? []).find((r) => String(r.id) === String(id));
                                if (row?.producto_id) {
                                    setData('producto_id', String(row.producto_id));
                                }
                            }}
                            disabled={!data.venta_id || loadingDetalles}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                        >
                            <option value="">{data.venta_id ? '— (opcional)' : 'Selecciona una venta primero'}</option>
                            {(detalles ?? []).map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.producto} · Cant: {Number(d.cantidad)} · Sub: RD$ {Number(d.subtotal).toFixed(2)}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.detalle_venta_id} className="mt-2" />
                        <div className="mt-2 text-xs text-outline">
                            Si eliges un detalle, el sistema fijará el producto correcto automáticamente.
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel htmlFor="producto_id" value="Producto" />
                        <select
                            id="producto_id"
                            value={data.producto_id}
                            onChange={(e) => setData('producto_id', e.target.value)}
                            disabled={productoBloqueado}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="">—</option>
                            {productos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre} {p.sku ? `(${p.sku})` : ''}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.producto_id} className="mt-2" />
                        {productoBloqueado ? (
                            <div className="mt-2 text-xs text-outline">
                                Producto bloqueado porque seleccionaste un detalle de venta.
                            </div>
                        ) : null}
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel htmlFor="motivo" value="Motivo (opcional)" />
                        <TextInput
                            id="motivo"
                            value={data.motivo}
                            onChange={(e) => setData('motivo', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.motivo} className="mt-2" />
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel htmlFor="descripcion" value="Descripción (opcional)" />
                        <textarea
                            id="descripcion"
                            value={data.descripcion}
                            onChange={(e) => setData('descripcion', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={3}
                        />
                        <InputError message={errors.descripcion} className="mt-2" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

