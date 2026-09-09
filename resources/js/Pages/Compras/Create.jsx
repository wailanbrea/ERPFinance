import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function ComprasCreate({ proveedores, almacenes, productos }) {
    const { config } = usePage().props;
    const lectorCfg = config?.lector ?? {};
    const [scan, setScan] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        proveedor_id: '',
        almacen_id: almacenes[0]?.id ?? '',
        fecha: new Date().toISOString().slice(0, 10),
        nota: '',
        items: [
            {
                producto_id: '',
                cantidad: 1,
                costo_unitario: 0,
                itbis_aplica: true,
                itbis_tasa: 18,
                precio_contado: '',
                precio_financiado: '',
                actualizar_producto: true,
            },
        ],
    });

    const productosByCode = useMemo(() => {
        const map = new Map();
        (productos ?? []).forEach((p) => {
            if (p.codigo_barra) map.set(String(p.codigo_barra).trim(), p);
            if (p.qr) map.set(String(p.qr).trim(), p);
            if (lectorCfg?.usar_sku !== false && p.sku) map.set(String(p.sku).trim(), p);
        });
        return map;
    }, [productos, lectorCfg?.usar_sku]);

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                producto_id: '',
                cantidad: 1,
                costo_unitario: 0,
                itbis_aplica: true,
                itbis_tasa: 18,
                precio_contado: '',
                precio_financiado: '',
                actualizar_producto: true,
            },
        ]);
    };

    const addProductToItems = (prod, cantidad = 1) => {
        if (!prod?.id) return;
        const pid = String(prod.id);
        const idx = data.items.findIndex((it) => String(it.producto_id) === pid);
        if (idx >= 0 && lectorCfg?.auto_sumar !== false) {
            const next = data.items.map((it, i) => {
                if (i !== idx) return it;
                const actual = Number(it.cantidad ?? 0);
                return { ...it, cantidad: actual + Number(cantidad ?? 0) };
            });
            setData('items', next);
            return;
        }

        setData('items', [
            ...data.items,
            {
                producto_id: pid,
                cantidad,
                costo_unitario: Number(prod.costo ?? 0),
                itbis_aplica: true,
                itbis_tasa: 18,
                precio_contado: prod.precio_contado ?? '',
                precio_financiado: prod.precio_financiado ?? '',
                actualizar_producto: true,
            },
        ]);
    };

    const updateItem = (idx, key, value) => {
        const next = data.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it));
        setData('items', next);
    };

    const handleScanSubmit = (e) => {
        e.preventDefault();
        if (lectorCfg?.activo === false) return;
        const code = String(scan ?? '').trim();
        if (!code) return;
        const prod = productosByCode.get(code);
        if (!prod) {
            alert('No se encontró ningún producto con ese código de barra / QR / SKU.');
            return;
        }
        if (lectorCfg?.auto_agregar !== false) {
            addProductToItems(prod, 1);
        }
        if (lectorCfg?.limpiar_al_agregar !== false) setScan('');
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('compras.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Nueva compra</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            Registra una entrada de mercancía y actualiza el stock.
                        </p>
                    </div>
                    <Link href={route('compras.index')} className="text-sm font-semibold text-primary hover:underline">
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Nueva compra" />

            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <InputLabel htmlFor="proveedor_id" value="Proveedor" />
                        <select
                            id="proveedor_id"
                            value={data.proveedor_id}
                            onChange={(e) => setData('proveedor_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            <option value="">—</option>
                            {proveedores.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="almacen_id" value="Almacén" />
                        <select
                            id="almacen_id"
                            value={data.almacen_id}
                            onChange={(e) => setData('almacen_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            {almacenes.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.nombre}
                                </option>
                            ))}
                        </select>
                        {errors.almacen_id ? <div className="mt-1 text-sm text-error">{errors.almacen_id}</div> : null}
                    </div>
                    <div>
                        <InputLabel htmlFor="fecha" value="Fecha" />
                        <TextInput
                            id="fecha"
                            type="date"
                            value={data.fecha}
                            onChange={(e) => setData('fecha', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        {errors.fecha ? <div className="mt-1 text-sm text-error">{errors.fecha}</div> : null}
                    </div>
                    <div className="md:col-span-3">
                        <InputLabel htmlFor="nota" value="Nota" />
                        <textarea
                            id="nota"
                            value={data.nota}
                            onChange={(e) => setData('nota', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={2}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                        <div className="font-bold text-on-surface">Detalle de compra</div>
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                            <form onSubmit={handleScanSubmit} className="flex items-center gap-2">
                                <TextInput
                                    value={scan}
                                    onChange={(e) => setScan(e.target.value)}
                                    className="w-64"
                                    placeholder="Escanear código de barra / QR"
                                    disabled={lectorCfg?.activo === false}
                                />
                                <button
                                    type="submit"
                                    className="rounded-lg bg-primary-container px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary"
                                >
                                    Agregar
                                </button>
                            </form>
                            <button
                                type="button"
                                onClick={addItem}
                                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                            >
                                Agregar ítem
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low">
                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                    <th className="px-6 py-3">Producto</th>
                                    <th className="px-6 py-3">Cantidad</th>
                                    <th className="px-6 py-3">Costo unitario</th>
                                    <th className="px-6 py-3">ITBIS</th>
                                    <th className="px-6 py-3">Costo + ITBIS</th>
                                    <th className="px-6 py-3">Precio contado (tienda)</th>
                                    <th className="px-6 py-3">Precio financiado</th>
                                    <th className="px-6 py-3">Actualizar producto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {data.items.map((it, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4">
                                            <select
                                                value={it.producto_id}
                                                onChange={(e) => {
                                                    const pid = e.target.value;
                                                    const prod = productos.find((p) => String(p.id) === String(pid));
                                                    updateItem(idx, 'producto_id', pid);
                                                    if (prod) {
                                                        updateItem(idx, 'costo_unitario', prod.costo ?? 0);
                                                        updateItem(idx, 'itbis_aplica', true);
                                                        updateItem(idx, 'itbis_tasa', 18);
                                                        updateItem(idx, 'precio_contado', prod.precio_contado ?? '');
                                                        updateItem(idx, 'precio_financiado', prod.precio_financiado ?? '');
                                                    }
                                                }}
                                                className="w-full rounded-md border-outline-variant bg-white text-on-surface shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                            >
                                                <option value="">—</option>
                                                {productos.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombre}
                                                        {p.codigo_barra ? ` · ${p.codigo_barra}` : ''}
                                                        {p.qr ? ` · QR:${p.qr}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {it.producto_id ? (
                                                <div className="mt-2 text-xs text-on-surface">
                                                    {(() => {
                                                        const p = productos.find((x) => String(x.id) === String(it.producto_id));
                                                        if (!p) return null;
                                                        return (
                                                            <div className="space-y-1">
                                                                <div className="text-sm font-semibold">
                                                                    Seleccionado: <span className="font-bold">{p.nombre}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold">Descripción:</span>{' '}
                                                                    <span className="text-on-surface-variant">{p.descripcion || '—'}</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                                    <span>
                                                                        <span className="font-semibold">SKU:</span> {p.sku || '—'}
                                                                    </span>
                                                                    <span>
                                                                        <span className="font-semibold">Código:</span> {p.codigo_barra || '—'}
                                                                    </span>
                                                                    <span>
                                                                        <span className="font-semibold">QR:</span> {p.qr || '—'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4">
                                            <TextInput
                                                type="number"
                                                value={it.cantidad}
                                                onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                                                className="block w-full"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <TextInput
                                                type="number"
                                                value={it.costo_unitario}
                                                onChange={(e) => updateItem(idx, 'costo_unitario', e.target.value)}
                                                className="block w-full"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={it.itbis_aplica ? '1' : '0'}
                                                    onChange={(e) => updateItem(idx, 'itbis_aplica', e.target.value === '1')}
                                                    className="w-full rounded-md border-outline-variant bg-white shadow-sm"
                                                >
                                                    <option value="1">Sí (18%)</option>
                                                    <option value="0">No</option>
                                                </select>
                                                {it.itbis_aplica ? (
                                                    <TextInput
                                                        type="number"
                                                        value={it.itbis_tasa}
                                                        onChange={(e) => updateItem(idx, 'itbis_tasa', e.target.value)}
                                                        className="block w-full"
                                                        placeholder="Tasa %"
                                                    />
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                            {(() => {
                                                const costo = Number(it.costo_unitario ?? 0);
                                                const tasa = Number(it.itbis_tasa ?? 18);
                                                const con = it.itbis_aplica ? costo * (1 + tasa / 100) : costo;
                                                return `RD$ ${Number(con || 0).toFixed(2)}`;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <TextInput
                                                type="number"
                                                value={it.precio_contado}
                                                onChange={(e) => updateItem(idx, 'precio_contado', e.target.value)}
                                                className="block w-full"
                                                placeholder="Opcional"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <TextInput
                                                type="number"
                                                value={it.precio_financiado}
                                                onChange={(e) => updateItem(idx, 'precio_financiado', e.target.value)}
                                                className="block w-full"
                                                placeholder="Opcional"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={it.actualizar_producto ? '1' : '0'}
                                                onChange={(e) => updateItem(idx, 'actualizar_producto', e.target.value === '1')}
                                                className="w-full rounded-md border-outline-variant bg-white shadow-sm"
                                            >
                                                <option value="1">Sí</option>
                                                <option value="0">No</option>
                                            </select>
                                            <div className="mt-1 text-xs text-outline">
                                                Si “Sí”, se actualizará costo/precios del producto en la tienda.
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {errors.items ? <div className="px-6 py-3 text-sm text-error">{errors.items}</div> : null}
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar compra</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

