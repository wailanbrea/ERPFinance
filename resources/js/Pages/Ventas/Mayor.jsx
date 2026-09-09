import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function VentasMayor({ clientes, productos, almacenes }) {
    const { config, flash, auth } = usePage().props;
    const permisos = new Set(auth?.permisos ?? []);
    const puedeFinanciar = permisos.has('financiamientos.ver');
    const puedeVerFacturas = permisos.has('facturas.ver');
    const lectorCfg = config?.lector ?? {};
    const [scan, setScan] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        tipo: 'contado',
        cliente_id: '',
        almacen_id: almacenes?.[0]?.id ?? '',
        fecha: new Date().toISOString().slice(0, 10),
        descuento: 0,
        impuesto: 0,
        inicial: 0,
        interes: 0,
        cuotas: 12,
        frecuencia: 'mensual',
        metodo_pago: 'efectivo',
        monto_pagado: 0,
        nota: '',
        modalidad: 'mayor',
        items: [{ producto_id: '', cantidad: 6, precio_unitario: 0 }],
    });

    const total = useMemo(() => {
        const subtotal = data.items.reduce((acc, it) => acc + Number(it.cantidad || 0) * Number(it.precio_unitario || 0), 0);
        return Math.max(0, subtotal - Number(data.descuento || 0) + Number(data.impuesto || 0));
    }, [data.items, data.descuento, data.impuesto]);

    const addItem = () => {
        setData('items', [...data.items, { producto_id: '', cantidad: 6, precio_unitario: 0 }]);
    };

    const precioPara = (prod) => {
        if (!prod) return 0;
        if (data.tipo === 'financiada') return Number(prod.precio_financiado ?? 0);
        const pm = Number(prod.precio_mayor);
        if (pm > 0) return pm;
        return Number(prod.precio_contado ?? 0);
    };

    const productosByCode = useMemo(() => {
        const map = new Map();
        (productos ?? []).forEach((p) => {
            if (p.codigo_barra) map.set(String(p.codigo_barra).trim(), p);
            if (p.qr) map.set(String(p.qr).trim(), p);
            if (lectorCfg?.usar_sku !== false && p.sku) map.set(String(p.sku).trim(), p);
        });
        return map;
    }, [productos, lectorCfg?.usar_sku]);

    const addProductToCart = (prod, cantidad = 6) => {
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
                cantidad: Number(cantidad ?? 1),
                precio_unitario: Number(precioPara(prod)),
            },
        ]);
    };

    const updateItem = (idx, keyOrUpdates, value) => {
        const updates = typeof keyOrUpdates === 'object' ? keyOrUpdates : { [keyOrUpdates]: value };
        const next = data.items.map((it, i) => (i === idx ? { ...it, ...updates } : it));
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
            addProductToCart(prod, 6);
        }
        if (lectorCfg?.limpiar_al_agregar !== false) setScan('');
    };

    const submit = (e) => {
        e.preventDefault();
        const payload = {
            ...data,
            monto_pagado: data.tipo === 'contado' ? (Number(data.monto_pagado) || total) : 0,
        };
        post(route('ventas.store'), payload);
    };

    useEffect(() => {
        if (flash?.warning) {
            alert(String(flash.warning));
        }
    }, [flash?.warning]);

    const tiposVenta = useMemo(() => {
        const all = [
            { id: 'contado', label: 'Contado' },
            { id: 'financiada', label: 'Financiada' },
            { id: 'apartado', label: 'Apartado' },
        ];
        return puedeFinanciar ? all : all.filter((t) => t.id !== 'financiada');
    }, [puedeFinanciar]);

    useEffect(() => {
        if (!puedeFinanciar && data.tipo === 'financiada') {
            setData('tipo', 'contado');
        }
    }, [puedeFinanciar, data.tipo, setData]);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Ventas al por mayor</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                        Pedidos en volumen: precio unitario por defecto según <strong>precio al por mayor</strong> del producto (si no
                        está definido, se usa precio al contado). Ajusta cantidades y precios según acuerdo con el cliente.
                    </p>
                    <p className="mt-2 flex flex-wrap gap-4 text-sm">
                        <Link
                            href={route('ventas.pos')}
                            className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
                        >
                            Ir a ventas al detalle (POS)
                        </Link>
                        {puedeVerFacturas ? (
                            <Link
                                href={route('facturas.index')}
                                className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
                            >
                                Historial e impresión de facturas
                            </Link>
                        ) : null}
                    </p>
                </div>
            }
        >
            <Head title="Ventas al por mayor" />

            {flash?.success ? (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {flash.success}
                </div>
            ) : null}

            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
                Las ventas quedan marcadas como <strong>al por mayor</strong> en facturas y PDF. Configure <strong>Precio al por mayor</strong>{' '}
                en cada producto para sugerir mejor el margen B2B; si queda en 0, se usa el precio al contado como referencia.
            </div>

            <form onSubmit={submit} className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <InputLabel htmlFor="cliente_id" value="Cliente" />
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
                        </div>

                        <div className="md:col-span-3">
                            <InputLabel htmlFor="tipo" value="Tipo de venta" />
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                {tiposVenta.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setData('tipo', t.id)}
                                        className={
                                            (data.tipo === t.id
                                                ? 'border-primary-container bg-surface-container-low text-primary'
                                                : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low') +
                                            ' rounded-lg border px-4 py-2 text-sm font-semibold transition'
                                        }
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                            <div className="font-bold text-on-surface">Carrito</div>
                            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2">
                                    <TextInput
                                        value={scan}
                                        onChange={(e) => setScan(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleScanSubmit(e);
                                            }
                                        }}
                                        className="w-64"
                                        placeholder="Escanear código de barra / QR"
                                        disabled={lectorCfg?.activo === false}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleScanSubmit}
                                        className="rounded-lg bg-primary-container px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary"
                                    >
                                        Agregar
                                    </button>
                                </div>
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
                                        <th className="px-6 py-3">Precio unitario</th>
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
                                                        updateItem(idx, {
                                                            producto_id: pid,
                                                            precio_unitario: prod ? (precioPara(prod) ?? 0) : 0,
                                                        });
                                                    }}
                                                    className="w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                                >
                                                    <option value="">—</option>
                                                    {productos.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.nombre}
                                                            {p.sku ? ` (${p.sku})` : ''}
                                                            {p.codigo_barra ? ` · ${p.codigo_barra}` : ''}
                                                            {p.qr ? ` · QR:${p.qr}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
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
                                                    value={it.precio_unitario}
                                                    onChange={(e) => updateItem(idx, 'precio_unitario', e.target.value)}
                                                    className="block w-full"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {errors.items ? <div className="px-6 py-3 text-sm text-error">{errors.items}</div> : null}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
                        <div className="flex justify-between text-sm text-on-surface-variant">
                            <span>Descuento</span>
                            <TextInput
                                type="number"
                                value={data.descuento}
                                onChange={(e) => setData('descuento', e.target.value)}
                                className="w-32 text-right"
                            />
                        </div>
                        <div className="flex justify-between text-sm text-on-surface-variant">
                            <span>Impuesto</span>
                            <TextInput
                                type="number"
                                value={data.impuesto}
                                onChange={(e) => setData('impuesto', e.target.value)}
                                className="w-32 text-right"
                            />
                        </div>
                        <div className="pt-3 border-t border-outline-variant flex items-end justify-between">
                            <div className="text-sm font-bold text-on-surface">TOTAL</div>
                            <div className="text-2xl font-extrabold text-primary">
                                RD$ {Number(total).toFixed(2)}
                            </div>
                        </div>

                        {data.tipo === 'contado' ? (
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <InputLabel htmlFor="metodo_pago" value="Método de pago" />
                                    <select
                                        id="metodo_pago"
                                        value={data.metodo_pago}
                                        onChange={(e) => setData('metodo_pago', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="deposito">Depósito</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel htmlFor="monto_pagado" value="Monto pagado" />
                                    <TextInput
                                        id="monto_pagado"
                                        type="number"
                                        value={data.monto_pagado}
                                        onChange={(e) => setData('monto_pagado', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                            </div>
                        ) : null}

                        {data.tipo === 'financiada' ? (
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <InputLabel htmlFor="inicial" value="Inicial" />
                                    <TextInput
                                        id="inicial"
                                        type="number"
                                        value={data.inicial}
                                        onChange={(e) => setData('inicial', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel htmlFor="interes" value="Interés (%)" />
                                        <TextInput
                                            id="interes"
                                            type="number"
                                            value={data.interes}
                                            onChange={(e) => setData('interes', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="cuotas" value="Cuotas" />
                                        <TextInput
                                            id="cuotas"
                                            type="number"
                                            value={data.cuotas}
                                            onChange={(e) => setData('cuotas', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel htmlFor="frecuencia" value="Frecuencia" />
                                    <select
                                        id="frecuencia"
                                        value={data.frecuencia}
                                        onChange={(e) => setData('frecuencia', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                    >
                                        <option value="semanal">Semanal</option>
                                        <option value="quincenal">Quincenal</option>
                                        <option value="mensual">Mensual</option>
                                    </select>
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <InputLabel htmlFor="nota" value="Nota" />
                            <textarea
                                id="nota"
                                value={data.nota}
                                onChange={(e) => setData('nota', e.target.value)}
                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                rows={2}
                            />
                        </div>

                        <PrimaryButton disabled={processing} className="w-full justify-center">
                            Registrar venta al por mayor
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

