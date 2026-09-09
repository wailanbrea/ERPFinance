import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ServicioTecnicoEdit({ orden }) {
    const { data, setData, put, processing, errors } = useForm({
        estado: orden.estado ?? 'recibido',
        diagnostico: orden.diagnostico ?? '',
        trabajo_realizado: orden.trabajo_realizado ?? '',
        costo: orden.costo ?? 0,
        adelanto: orden.adelanto ?? 0,
        fecha_entrega: orden.fecha_entrega ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('servicio-tecnico.update', orden.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Orden #{orden.id}</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">Seguimiento: diagnóstico, reparación y entrega.</p>
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
            <Head title={`Orden #${orden.id}`} />

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <InputLabel value="Número" />
                            <TextInput value={orden.numero ?? '—'} disabled className="mt-1 block w-full" />
                        </div>
                        <div>
                            <InputLabel value="Fecha ingreso" />
                            <TextInput value={orden.fecha_ingreso} disabled className="mt-1 block w-full" />
                        </div>
                        <div>
                            <InputLabel htmlFor="estado" value="Estado" />
                            <select
                                id="estado"
                                value={data.estado}
                                onChange={(e) => setData('estado', e.target.value)}
                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            >
                                <option value="recibido">Recibido</option>
                                <option value="diagnostico">Diagnóstico</option>
                                <option value="reparacion">Reparación</option>
                                <option value="listo">Listo</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                            <InputError message={errors.estado} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="diagnostico" value="Diagnóstico (opcional)" />
                        <textarea
                            id="diagnostico"
                            value={data.diagnostico}
                            onChange={(e) => setData('diagnostico', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={3}
                        />
                        <InputError message={errors.diagnostico} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="trabajo_realizado" value="Trabajo realizado (opcional)" />
                        <textarea
                            id="trabajo_realizado"
                            value={data.trabajo_realizado}
                            onChange={(e) => setData('trabajo_realizado', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={3}
                        />
                        <InputError message={errors.trabajo_realizado} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="costo" value="Costo" />
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

                    <div className="max-w-xs">
                        <InputLabel htmlFor="fecha_entrega" value="Fecha entrega (opcional)" />
                        <TextInput
                            id="fecha_entrega"
                            type="date"
                            value={data.fecha_entrega || ''}
                            onChange={(e) => setData('fecha_entrega', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.fecha_entrega} className="mt-2" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar cambios</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

