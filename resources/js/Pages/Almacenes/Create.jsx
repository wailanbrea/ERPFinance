import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function AlmacenesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        tipo: 'principal',
        activo: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('almacenes.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">
                            Nuevo almacén
                        </h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            Crea un almacén dentro de tu sucursal.
                        </p>
                    </div>
                    <Link
                        href={route('almacenes.index')}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Nuevo almacén" />

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

                <div>
                    <InputLabel htmlFor="tipo" value="Tipo" />
                    <select
                        id="tipo"
                        value={data.tipo}
                        onChange={(e) => setData('tipo', e.target.value)}
                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                    >
                        <option value="principal">Principal</option>
                        <option value="sucursal">Sucursal</option>
                        <option value="taller">Taller</option>
                        <option value="transito">Mercancía en tránsito</option>
                    </select>
                    {errors.tipo ? (
                        <div className="mt-1 text-sm text-error">
                            {errors.tipo}
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="activo"
                        type="checkbox"
                        checked={!!data.activo}
                        onChange={(e) => setData('activo', e.target.checked)}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <label htmlFor="activo" className="text-sm text-on-surface">
                        Activo
                    </label>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

