import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ServicioTecnicoCreate({ clientes, productos, ventas }) {
    const { data, setData, post, processing, errors } = useForm({
        numero: '',
        fecha_ingreso: new Date().toISOString().slice(0, 10),
        estado: 'recibido',
        venta_id: '',
        detalle_venta_id: '',
        cliente_id: '',
        producto_id: '',
        falla_reportada: '',
        costo: 0,
        adelanto: 0,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('servicio-tecnico.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Nueva orden de servicio</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">Recepción de equipo y falla reportada.</p>
                    </div>
                    <Link
                        href={route('servicio-tecnico.index')}
                        className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Nueva orden" />

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="numero" value="Número (opcional)" />
                        <TextInput
                            id="numero"
                            value={data.numero}
                            onChange={(e) => setData('numero', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.numero} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="fecha_ingreso" value="Fecha ingreso" />
                        <TextInput
                            id="fecha_ingreso"
                            type="date"
                            value={data.fecha_ingreso}
                            onChange={(e) => setData('fecha_ingreso', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.fecha_ingreso} className="mt-2" />
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
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel htmlFor="producto_id" value="Producto" />
                        <select
                            id="producto_id"
                            value={data.producto_id}
                            onChange={(e) => setData('producto_id', e.target.value)}
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
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel htmlFor="falla_reportada" value="Falla reportada (opcional)" />
                        <textarea
                            id="falla_reportada"
                            value={data.falla_reportada}
                            onChange={(e) => setData('falla_reportada', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={3}
                        />
                        <InputError message={errors.falla_reportada} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="costo" value="Costo estimado" />
                        <TextInput
                            id="costo"
                            type="number"
                            value={data.costo}
                            onChange={(e) => setData('costo', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.costo} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="adelanto" value="Adelanto" />
                        <TextInput
                            id="adelanto"
                            type="number"
                            value={data.adelanto}
                            onChange={(e) => setData('adelanto', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.adelanto} className="mt-2" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

