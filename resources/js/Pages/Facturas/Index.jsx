import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableShell from '@/Pages/_Shared/TableShell';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import PrintWindowsTicket from '@/Components/PrintWindowsTicket';

function money(n) {
    const v = Number(n ?? 0);
    return v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
}

export default function FacturasIndex({ ventas, filtros }) {
    const rows = useMemo(() => ventas?.data ?? [], [ventas]);
    const [openId, setOpenId] = useState(null);
    const q = filtros?.q ?? '';

    return (
        <AuthenticatedLayout header={null}>
            <Head title="Facturas" />

            <TableShell
                title="Facturas"
                description="Facturas emitidas (ventas) con descarga en PDF."
                filters={
                    <input
                        value={q}
                        onChange={(e) =>
                            router.get(route('facturas.index'), { q: e.target.value }, { preserveState: true, replace: true })
                        }
                        placeholder="Buscar por ID, No. factura o cliente..."
                        className="w-80 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                    />
                }
            >
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                        <tr className="text-label-sm text-outline uppercase tracking-wider">
                            <th className="px-6 py-3">Factura</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Tipo pago</th>
                            <th className="px-6 py-3">Canal</th>
                            <th className="px-6 py-3 text-right">Total</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {!rows.length ? (
                            <tr>
                                <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan={7}>
                                    No hay facturas (ventas) registradas.
                                </td>
                            </tr>
                        ) : (
                            rows.flatMap((v) => {
                                const isOpen = Number(openId) === Number(v.id);
                                const det = v.detalles ?? [];
                                return [
                                    <tr
                                        key={v.id}
                                        className="hover:bg-surface-container-low transition-colors cursor-pointer"
                                        onClick={() => setOpenId(isOpen ? null : v.id)}
                                        title="Clic para ver detalle"
                                    >
                                        <td className="px-6 py-4 font-semibold text-on-surface">
                                            <div className="flex items-center gap-2">
                                                <span className="text-outline">{isOpen ? '▾' : '▸'}</span>
                                                <span>{v.numero_factura ?? `#${v.id}`}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{v.fecha}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {v.cliente?.nombre ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{v.tipo}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {v.modalidad === 'mayor' ? (
                                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-100">
                                                    Por mayor
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                    Detalle
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-semibold text-on-surface">{money(v.total)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={route('facturas.pdf', v.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                            >
                                                Ver PDF
                                            </a>
                                            <PrintWindowsTicket ventaId={v.id} />
                                        </td>
                                    </tr>,
                                    isOpen ? (
                                        <tr key={`${v.id}-detalle`} className="bg-surface-container-low/40">
                                            <td colSpan={7} className="px-6 py-4">
                                                <div className="rounded-xl border border-outline-variant bg-white overflow-hidden">
                                                    <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                                                        <div className="text-sm font-semibold text-on-surface">Detalle</div>
                                                        <div className="text-xs text-outline">{det.length ? `${det.length} item(s)` : '—'}</div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left">
                                                            <thead className="bg-surface-container-low">
                                                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                                                    <th className="px-4 py-2">Producto</th>
                                                                    <th className="px-4 py-2 text-right">Cant.</th>
                                                                    <th className="px-4 py-2 text-right">Precio</th>
                                                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-outline-variant">
                                                                {det.length ? (
                                                                    det.map((d) => (
                                                                        <tr key={d.id} className="hover:bg-surface-container-low/60">
                                                                            <td className="px-4 py-2 text-sm font-semibold text-on-surface">
                                                                                {d.producto?.nombre ?? '—'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                                {Number(d.cantidad ?? 0).toFixed(2)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                                {money(d.precio_unitario)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right text-sm font-semibold text-on-surface">
                                                                                {money(d.subtotal)}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={4} className="px-4 py-6 text-sm text-outline">
                                                                            Esta factura no tiene detalle.
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

