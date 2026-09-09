import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Puede } from '@/lib/permisos';
import TableShell from '@/Pages/_Shared/TableShell';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function ComprasIndex({ compras }) {
    const rows = useMemo(() => compras?.data ?? [], [compras]);
    const [openId, setOpenId] = useState(null);

    const money = (n) => {
        const v = Number(n ?? 0);
        return v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
    };

    return (
        <AuthenticatedLayout header={null}>
            <Head title="Compras" />

            <TableShell
                title="Compras"
                description="Registro de entrada de mercancía e impacto en inventario."
                actions={
                    <Puede permiso="compras.crear">
                        <Link
                            href={route('compras.create')}
                            className="inline-flex items-center rounded-lg bg-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary"
                        >
                            Nueva compra
                        </Link>
                    </Puede>
                }
            >
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                        <tr className="text-label-sm text-outline uppercase tracking-wider">
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Proveedor</th>
                            <th className="px-6 py-3">Almacén</th>
                            <th className="px-6 py-3 text-right">Ítems</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-6 py-6 text-body-md text-on-surface-variant" colSpan={7}>
                                    No hay compras registradas.
                                </td>
                            </tr>
                        ) : (
                            rows.flatMap((c) => {
                                const isOpen = Number(openId) === Number(c.id);
                                const detalle = c.detalles ?? [];
                                return [
                                    <tr
                                        key={c.id}
                                        className="hover:bg-surface-container-low transition-colors cursor-pointer"
                                        onClick={() => setOpenId(isOpen ? null : c.id)}
                                        title="Clic para ver detalle"
                                    >
                                        <td className="px-6 py-4 font-semibold text-on-surface">
                                            <div className="flex items-center gap-2">
                                                <span className="text-outline">{isOpen ? '▾' : '▸'}</span>
                                                <span>#{c.id}</span>
                                                <Link
                                                    href={route('compras.show', c.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-xs font-semibold text-primary hover:underline"
                                                >
                                                    Ver
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">{c.fecha}</td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">{c.proveedor?.nombre ?? '—'}</td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">{c.almacen?.nombre ?? '—'}</td>
                                        <td className="px-6 py-4 text-right text-body-md text-on-surface-variant">{Number(c.detalles_count ?? 0)}</td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">{money(c.total)}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-primary">
                                                {c.estado}
                                            </span>
                                        </td>
                                    </tr>,
                                    isOpen ? (
                                        <tr key={`${c.id}-detalle`} className="bg-surface-container-low/40">
                                            <td colSpan={7} className="px-6 py-4">
                                                <div className="rounded-xl border border-outline-variant bg-white overflow-hidden">
                                                    <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                                                        <div className="text-sm font-semibold text-on-surface">Detalle de compra</div>
                                                        <div className="text-xs text-outline">
                                                            {detalle.length ? `${detalle.length} producto(s)` : 'Sin detalle'}
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left">
                                                            <thead className="bg-surface-container-low">
                                                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                                                    <th className="px-4 py-2">Producto</th>
                                                                    <th className="px-4 py-2 text-right">Cantidad</th>
                                                                    <th className="px-4 py-2 text-right">Costo</th>
                                                                    <th className="px-4 py-2 text-right">ITBIS</th>
                                                                    <th className="px-4 py-2 text-right">Costo + ITBIS</th>
                                                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-outline-variant">
                                                                {detalle.length ? (
                                                                    detalle.map((d) => (
                                                                        <tr key={d.id} className="hover:bg-surface-container-low/60">
                                                                            <td className="px-4 py-2 text-sm font-semibold text-on-surface">
                                                                                {d.producto?.nombre ?? '—'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                                {Number(d.cantidad ?? 0).toFixed(2)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                                {money(d.costo_unitario)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                                {d.itbis_aplica ? `${Number(d.itbis_tasa ?? 18).toFixed(2)}%` : 'No'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                                {money(d.costo_unitario_con_itbis)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm font-semibold text-on-surface">
                                                                                {money(d.subtotal)}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={6} className="px-4 py-6 text-sm text-outline">
                                                                            Esta compra no tiene detalle.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null,
                                ].filter(Boolean);
                            })
                        )}
                    </tbody>
                </table>
            </TableShell>
        </AuthenticatedLayout>
    );
}

