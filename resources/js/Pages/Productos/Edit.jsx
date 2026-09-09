import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ProductosEdit({ producto, categorias, marcas, stocks }) {
    const { data, setData, put, processing, errors } = useForm({
        categoria_id: producto.categoria_id ?? '',
        marca_id: producto.marca_id ?? '',
        nombre: producto.nombre ?? '',
        descripcion: producto.descripcion ?? '',
        sku: producto.sku ?? '',
        codigo_barra: producto.codigo_barra ?? '',
        qr: producto.qr ?? '',
        modelo: producto.modelo ?? '',
        serial: producto.serial ?? '',
        costo: producto.costo ?? 0,
        precio_contado: producto.precio_contado ?? 0,
        precio_financiado: producto.precio_financiado ?? 0,
        precio_mayor: producto.precio_mayor ?? '',
        garantia_meses: producto.garantia_meses ?? 0,
        activo: !!producto.activo,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('productos.update', producto.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">
                            Editar producto
                        </h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            {producto.nombre}
                        </p>
                    </div>
                    <Link
                        href={route('productos.index')}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Editar producto" />

            <form
                onSubmit={submit}
                className="max-w-4xl rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-5"
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
                        <InputLabel htmlFor="categoria_id" value="Categoría" />
                        <select
                            id="categoria_id"
                            value={data.categoria_id}
                            onChange={(e) =>
                                setData('categoria_id', e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="">—</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <InputLabel htmlFor="marca_id" value="Marca" />
                        <select
                            id="marca_id"
                            value={data.marca_id}
                            onChange={(e) => setData('marca_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="">—</option>
                            {marcas.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <InputLabel htmlFor="sku" value="SKU" />
                        <TextInput
                            id="sku"
                            value={data.sku}
                            onChange={(e) => setData('sku', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        {errors.sku ? (
                            <div className="mt-1 text-sm text-error">
                                {errors.sku}
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="codigo_barra"
                            value="Código de barra"
                        />
                        <TextInput
                            id="codigo_barra"
                            value={data.codigo_barra}
                            onChange={(e) =>
                                setData('codigo_barra', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="qr" value="QR" />
                        <TextInput
                            id="qr"
                            value={data.qr}
                            onChange={(e) => setData('qr', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="modelo" value="Modelo" />
                        <TextInput
                            id="modelo"
                            value={data.modelo}
                            onChange={(e) => setData('modelo', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="serial" value="Serial" />
                        <TextInput
                            id="serial"
                            value={data.serial}
                            onChange={(e) => setData('serial', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="descripcion" value="Descripción" />
                    <textarea
                        id="descripcion"
                        value={data.descripcion}
                        onChange={(e) => setData('descripcion', e.target.value)}
                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <InputLabel htmlFor="costo" value="Costo" />
                        <TextInput
                            id="costo"
                            type="number"
                            value={data.costo}
                            onChange={(e) => setData('costo', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="precio_contado"
                            value="Precio contado"
                        />
                        <TextInput
                            id="precio_contado"
                            type="number"
                            value={data.precio_contado}
                            onChange={(e) =>
                                setData('precio_contado', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="precio_financiado"
                            value="Precio financiado"
                        />
                        <TextInput
                            id="precio_financiado"
                            type="number"
                            value={data.precio_financiado}
                            onChange={(e) =>
                                setData('precio_financiado', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="precio_mayor" value="Precio al por mayor (opcional)" />
                        <TextInput
                            id="precio_mayor"
                            type="number"
                            value={data.precio_mayor}
                            onChange={(e) => setData('precio_mayor', e.target.value)}
                            placeholder="Vacío = precio contado en mayor"
                            className="mt-1 block w-full"
                        />
                        {errors.precio_mayor ? (
                            <div className="mt-1 text-sm text-error">{errors.precio_mayor}</div>
                        ) : null}
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="garantia_meses"
                            value="Garantía (meses)"
                        />
                        <TextInput
                            id="garantia_meses"
                            type="number"
                            value={data.garantia_meses}
                            onChange={(e) =>
                                setData('garantia_meses', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                    </div>
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
                    <PrimaryButton disabled={processing}>
                        Guardar cambios
                    </PrimaryButton>
                </div>
            </form>

            <div className="max-w-4xl mt-6 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
                <div className="px-6 py-4 border-b border-outline-variant">
                    <div className="font-bold text-on-surface">Stock por almacén</div>
                    <div className="text-sm text-on-surface-variant">
                        Aquí ves en qué almacenes existe este producto y su cantidad.
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low">
                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                <th className="px-6 py-3">Almacén</th>
                                <th className="px-6 py-3">Stock</th>
                                <th className="px-6 py-3">Mínimo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {(stocks ?? []).length === 0 ? (
                                <tr>
                                    <td className="px-6 py-6 text-body-md text-on-surface-variant" colSpan={3}>
                                        Este producto todavía no tiene stock registrado en ningún almacén.
                                    </td>
                                </tr>
                            ) : (
                                (stocks ?? []).map((s) => (
                                    <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-6 py-4 font-semibold text-on-surface">{s.almacen_nombre}</td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                            {Number(s.stock ?? 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                            {Number(s.stock_minimo ?? 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

