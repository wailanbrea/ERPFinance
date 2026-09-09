import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function MarcasCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        activa: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('marcas.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">
                            Nueva marca
                        </h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            Crea una marca para el catálogo de productos.
                        </p>
                    </div>
                    <Link
                        href={route('marcas.index')}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Nueva marca" />

            <form
                onSubmit={submit}
                className="max-w-2xl rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-5"
            >
                <div>
                    <InputLabel htmlFor="nombre" value="Nombre" />
                    <TextInput
                        id="nombre"
                        value={data.nombre}
                        onChange={(e) => setData('nombre', e.target.value)}
                        className="mt-1 block w-full"
                    />
                    {errors.nombre ? (
                        <div className="mt-1 text-sm text-error">
                            {errors.nombre}
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="activa"
                        type="checkbox"
                        checked={!!data.activa}
                        onChange={(e) => setData('activa', e.target.checked)}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <label htmlFor="activa" className="text-sm text-on-surface">
                        Activa
                    </label>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

