import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function GastosCreate({ cajaAbierta }) {
    const { data, setData, post, processing, errors } = useForm({
        fecha: new Date().toISOString().slice(0, 10),
        categoria: '',
        concepto: '',
        monto: 0,
        usar_caja: !!cajaAbierta,
        nota: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('gastos.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Nuevo gasto</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">Registra un gasto para la sucursal.</p>
                    </div>
                    <Link
                        href={route('gastos.index')}
                        className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Nuevo gasto" />

            <form onSubmit={submit} className="max-w-3xl space-y-6">
                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <InputLabel htmlFor="categoria" value="Categoría (opcional)" />
                        <TextInput
                            id="categoria"
                            value={data.categoria}
                            onChange={(e) => setData('categoria', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.categoria} className="mt-2" />
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel htmlFor="concepto" value="Concepto" />
                        <TextInput
                            id="concepto"
                            value={data.concepto}
                            onChange={(e) => setData('concepto', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.concepto} className="mt-2" />
                    </div>

                    <div>
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

                    <div className="flex items-center gap-3 mt-6">
                        <input
                            id="usar_caja"
                            type="checkbox"
                            checked={!!data.usar_caja}
                            onChange={(e) => setData('usar_caja', e.target.checked)}
                            className="rounded border-outline-variant"
                        />
                        <label htmlFor="usar_caja" className="text-sm text-on-surface">
                            Registrar contra caja (requiere caja abierta)
                        </label>
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel htmlFor="nota" value="Nota (opcional)" />
                        <textarea
                            id="nota"
                            value={data.nota}
                            onChange={(e) => setData('nota', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={2}
                        />
                        <InputError message={errors.nota} className="mt-2" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

