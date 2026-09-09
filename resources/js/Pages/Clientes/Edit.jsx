import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import MapaPicker from '@/Components/MapaPicker';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ClientesEdit({ cliente, direccionPrincipal }) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: cliente.nombre ?? '',
        apellido: cliente.apellido ?? '',
        cedula_rnc: cliente.cedula_rnc ?? '',
        telefono: cliente.telefono ?? '',
        whatsapp: cliente.whatsapp ?? '',
        direccion: cliente.direccion ?? '',
        referencias: cliente.referencias ?? '',
        lat: direccionPrincipal?.lat ?? '',
        lng: direccionPrincipal?.lng ?? '',
        estado: cliente.estado ?? 'activo',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('clientes.update', cliente.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">
                            Editar cliente
                        </h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            {cliente.nombre} {cliente.apellido ?? ''}
                        </p>
                    </div>
                    <Link
                        href={route('clientes.index')}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Editar cliente" />

            <form
                onSubmit={submit}
                className="max-w-3xl rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-5"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <InputLabel htmlFor="apellido" value="Apellido" />
                        <TextInput
                            id="apellido"
                            value={data.apellido}
                            onChange={(e) => setData('apellido', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="cedula_rnc" value="Cédula / RNC" />
                        <TextInput
                            id="cedula_rnc"
                            value={data.cedula_rnc}
                            onChange={(e) =>
                                setData('cedula_rnc', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="telefono" value="Teléfono" />
                        <TextInput
                            id="telefono"
                            value={data.telefono}
                            onChange={(e) => setData('telefono', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="whatsapp" value="WhatsApp" />
                        <TextInput
                            id="whatsapp"
                            value={data.whatsapp}
                            onChange={(e) =>
                                setData('whatsapp', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="estado" value="Estado" />
                        <select
                            id="estado"
                            value={data.estado}
                            onChange={(e) => setData('estado', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="direccion" value="Dirección" />
                    <textarea
                        id="direccion"
                        value={data.direccion}
                        onChange={(e) => setData('direccion', e.target.value)}
                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        rows={3}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="referencias" value="Referencias" />
                    <textarea
                        id="referencias"
                        value={data.referencias}
                        onChange={(e) => setData('referencias', e.target.value)}
                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        rows={3}
                    />
                </div>

                <div>
                    <div className="text-sm font-semibold text-on-surface">Ubicación (para rutas de cobro)</div>
                    <p className="mt-1 text-xs text-on-surface-variant">
                        Fija el punto de la dirección. Se usará para trazar y compartir rutas en el mapa.
                    </p>
                    <div className="mt-3">
                        <MapaPicker
                            lat={data.lat === '' ? null : Number(data.lat)}
                            lng={data.lng === '' ? null : Number(data.lng)}
                            onChange={({ lat, lng }) => {
                                setData('lat', String(lat));
                                setData('lng', String(lng));
                            }}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>
                        Guardar cambios
                    </PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

