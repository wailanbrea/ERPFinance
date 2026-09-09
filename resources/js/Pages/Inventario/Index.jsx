import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function money(n) {
    const v = Number(n ?? 0);
    return v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
}

function estadoStock(stock, minimo) {
    const st = Number(stock ?? 0);
    const min = Number(minimo ?? 0);
    if (st <= 0) return { label: 'Agotado', cls: 'bg-red-100 text-red-700' };
    if (st <= min) return { label: 'Bajo mínimo', cls: 'bg-amber-100 text-amber-800' };
    return { label: 'OK', cls: 'bg-emerald-100 text-emerald-700' };
}

export default function InventarioIndex({ almacenes, almacen_id, stock, kardex, filtros }) {
    const [tab, setTab] = useState(filtros?.tab ?? 'stock');
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');
    const [estado, setEstado] = useState(filtros?.estado ?? '');

    const totalValor = useMemo(() => {
        const rows = stock?.data ?? [];
        return rows.reduce((acc, r) => acc + Number(r.stock ?? 0) * Number(r.producto_costo ?? 0), 0);
    }, [stock]);

    const apply = (next = {}) => {
        router.get(
            route('inventario.index'),
            {
                almacen_id,
                tab,
                buscar,
                estado,
                ...next,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Inventario</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                        Stock profesional por almacén y kardex (movimientos).
                    </p>
                </div>
            }
        >
            <Head title="Inventario" />

            <div className="mb-4 rounded-xl border border-outline-variant bg-white p-4 shadow-sm space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="text-sm font-semibold text-on-surface">Almacén</div>
                        <select
                            value={almacen_id ?? ''}
                            onChange={(e) => apply({ almacen_id: e.target.value })}
                            className="w-full md:max-w-md rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        >
                            {almacenes.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setTab('stock');
                                apply({ tab: 'stock' });
                            }}
                            className={[
                                'rounded-lg border px-3 py-2 text-sm font-semibold',
                                tab === 'stock' ? 'border-primary bg-primary-container text-white' : 'border-outline-variant bg-white text-on-surface',
                            ].join(' ')}
                        >
                            Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTab('kardex');
                                apply({ tab: 'kardex' });
                            }}
                            className={[
                                'rounded-lg border px-3 py-2 text-sm font-semibold',
                                tab === 'kardex' ? 'border-primary bg-primary-container text-white' : 'border-outline-variant bg-white text-on-surface',
                            ].join(' ')}
                        >
                            Kardex
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-outline">Buscar</div>
                        <input
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && apply()}
                            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-sm focus:border-primary-container focus:ring-primary-container/20"
                            placeholder="Nombre, SKU, código barra o QR"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-outline">Estado</div>
                        <select
                            value={estado}
                            onChange={(e) => {
                                setEstado(e.target.value);
                                apply({ estado: e.target.value });
                            }}
                            className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                        >
                            <option value="">Todos</option>
                            <option value="con_stock">Con stock</option>
                            <option value="agotado">Agotado</option>
                            <option value="bajo_minimo">Bajo mínimo</option>
                        </select>
                    </div>
                    <div className="rounded-lg border border-outline-variant bg-white p-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-outline">Valor inventario (esta página)</div>
                        <div className="mt-1 text-lg font-extrabold text-on-surface">{money(totalValor)}</div>
                    </div>
                </div>
            </div>

            {tab === 'stock' ? (
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low">
                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                    <th className="px-6 py-3">Producto</th>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Código/QR</th>
                                    <th className="px-6 py-3">Almacén</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Stock</th>
                                    <th className="px-6 py-3 text-right">Mínimo</th>
                                    <th className="px-6 py-3 text-right">Costo</th>
                                    <th className="px-6 py-3 text-right">Precio contado</th>
                                    <th className="px-6 py-3 text-right">Precio por mayor</th>
                                    <th className="px-6 py-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {(stock?.data ?? []).length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-6 text-body-md text-on-surface-variant" colSpan={11}>
                                            No hay stock registrado para este almacén con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : (
                                    stock.data.map((s) => {
                                        const st = estadoStock(s.stock, s.stock_minimo);
                                        const valor = Number(s.stock ?? 0) * Number(s.producto_costo ?? 0);
                                        return (
                                            <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-6 py-4 font-semibold text-on-surface">{s.producto_nombre ?? '—'}</td>
                                                <td className="px-6 py-4 text-body-md text-on-surface-variant">{s.producto_sku ?? '—'}</td>
                                                <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                                    {s.producto_codigo_barra ?? '—'}
                                                    {s.producto_qr ? <span className="ml-2">QR:{s.producto_qr}</span> : null}
                                                </td>
                                                <td className="px-6 py-4 text-body-md text-on-surface-variant">{s.almacen_nombre ?? '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-body-md text-on-surface-variant">{Number(s.stock ?? 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-body-md text-on-surface-variant">{Number(s.stock_minimo ?? 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-body-md text-on-surface-variant">{money(s.producto_costo)}</td>
                                                <td className="px-6 py-4 text-right text-body-md text-on-surface">{money(s.producto_precio_contado)}</td>
                                                <td className="px-6 py-4 text-right text-body-md text-on-surface-variant">
                                                    {s.producto_precio_mayor != null && Number(s.producto_precio_mayor) > 0
                                                        ? money(s.producto_precio_mayor)
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right text-body-md font-semibold text-on-surface">{money(valor)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low">
                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Producto</th>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Almacén</th>
                                    <th className="px-6 py-3">Tipo</th>
                                    <th className="px-6 py-3">Referencia</th>
                                    <th className="px-6 py-3 text-right">Cantidad</th>
                                    <th className="px-6 py-3 text-right">Saldo</th>
                                    <th className="px-6 py-3">Nota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {(kardex?.data ?? []).length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-6 text-body-md text-on-surface-variant" colSpan={9}>
                                            No hay movimientos (kardex) para este almacén con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : (
                                    kardex.data.map((m) => (
                                        <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                                {String(m.created_at ?? '').replace('T', ' ').slice(0, 16)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-on-surface">{m.producto_nombre}</td>
                                            <td className="px-6 py-4 text-body-md text-on-surface-variant">{m.producto_sku ?? '—'}</td>
                                            <td className="px-6 py-4 text-body-md text-on-surface-variant">{m.almacen_nombre ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-primary">
                                                    {m.tipo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                                {m.referencia_tipo ? `${m.referencia_tipo} #${m.referencia_id ?? ''}` : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-body-md text-on-surface-variant">
                                                {Number(m.cantidad ?? 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-body-md text-on-surface-variant">
                                                {Number(m.saldo ?? 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-body-md text-on-surface-variant">{m.nota ?? '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

