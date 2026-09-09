import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function money(n) {
    const v = Number(n ?? 0);
    return v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
}

export default function ComprasShow({ compra }) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Compra #${compra?.id ?? ''}`} />

            <div className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">Compra #{compra.id}</h1>
                        <p className="text-sm text-slate-600">
                            {compra.fecha} · {compra.estado}
                        </p>
                    </div>
                    <Link
                        href={route('compras.index')}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Volver
                    </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-1">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Proveedor</span>
                                <span className="font-medium text-slate-900">{compra.proveedor?.nombre ?? '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Almacén</span>
                                <span className="font-medium text-slate-900">{compra.almacen?.nombre ?? '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Número</span>
                                <span className="font-medium text-slate-900">{compra.numero ?? '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Total</span>
                                <span className="font-semibold text-slate-900">{money(compra.total)}</span>
                            </div>
                        </div>

                        {compra.nota ? (
                            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nota</div>
                                <div className="mt-1 whitespace-pre-wrap">{compra.nota}</div>
                            </div>
                        ) : null}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
                        <div className="border-b border-slate-200 px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Detalle</h2>
                        </div>
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Producto</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cantidad</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Costo</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">ITBIS</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Costo + ITBIS</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(compra.detalles ?? []).map((d) => (
                                    <tr key={d.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                            {d.producto?.nombre ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-slate-700">{Number(d.cantidad ?? 0)}</td>
                                        <td className="px-4 py-3 text-right text-sm text-slate-700">{money(d.costo_unitario)}</td>
                                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                                            {d.itbis_aplica ? `${Number(d.itbis_tasa ?? 18).toFixed(2)}%` : 'No'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-slate-700">{money(d.costo_unitario_con_itbis)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{money(d.subtotal)}</td>
                                    </tr>
                                ))}
                                {(compra.detalles ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                            Esta compra no tiene detalle.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

