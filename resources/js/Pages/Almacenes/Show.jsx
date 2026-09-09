import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function AlmacenShow({ almacen, stock }) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Almacén: ${almacen?.nombre ?? ''}`} />

            <div className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">{almacen.nombre}</h1>
                        <p className="text-sm text-slate-600">
                            Tipo: {almacen.tipo} · {almacen.activo ? 'Activo' : 'Inactivo'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('almacenes.index')}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Volver
                        </Link>
                        <Link
                            href={route('almacenes.edit', almacen.id)}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                        >
                            Editar
                        </Link>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Productos en este almacén</h2>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Producto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">SKU</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Stock</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Mínimo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(stock?.data ?? []).map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.producto?.nombre ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{s.producto?.sku ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                        {Number(s.stock ?? 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                                        {Number(s.stock_minimo ?? 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {(stock?.data ?? []).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                                        Este almacén todavía no tiene stock registrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {stock?.links?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {stock.links.map((l, idx) => (
                            <button
                                key={idx}
                                disabled={!l.url}
                                onClick={() => l.url && router.visit(l.url, { preserveState: true })}
                                className={[
                                    'rounded-lg border px-3 py-2 text-sm',
                                    l.active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700',
                                    !l.url ? 'opacity-50' : 'hover:bg-slate-50',
                                ].join(' ')}
                                dangerouslySetInnerHTML={{ __html: l.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

