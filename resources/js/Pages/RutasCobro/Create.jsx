import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function RutasCobroCreate({ cobradores }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        dia: '',
        sector: '',
        frecuencia: '',
        cobrador_id: '',
        activa: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('rutas-cobro.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Nueva ruta de cobro</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">Crea la ruta; luego podrás asignar clientes.</p>
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
            <Head title="Nueva ruta de cobro" />

            <form onSubmit={submit} className="max-w-3xl space-y-6">
                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <InputLabel htmlFor="nombre" value="Nombre" />
                        <TextInput
                            id="nombre"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.nombre} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="dia" value="Día (opcional)" />
                        <TextInput
                            id="dia"
                            value={data.dia}
                            onChange={(e) => setData('dia', e.target.value)}
                            className="mt-1 block w-full"
                            placeholder="lunes / martes / ..."
                        />
                        <InputError message={errors.dia} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="sector" value="Sector (opcional)" />
                        <TextInput
                            id="sector"
                            value={data.sector}
                            onChange={(e) => setData('sector', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.sector} className="mt-2" />
                    </div>

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
                        <InputLabel htmlFor="cobrador_id" value="Cobrador (opcional)" />
                        <select
                            id="cobrador_id"
                            value={data.cobrador_id}
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

                    <div className="md:col-span-2 flex items-center gap-3">
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
                    <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

