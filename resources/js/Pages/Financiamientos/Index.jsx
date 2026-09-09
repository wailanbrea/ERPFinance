import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function money(n) {
    const v = Number(n ?? 0);
    return v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
}

function badgeResumenPago(codigo) {
    switch (codigo) {
        case 'en_mora':
            return { label: 'En mora', className: 'bg-red-100 text-red-800' };
        case 'al_dia':
            return { label: 'Al día', className: 'bg-emerald-100 text-emerald-800' };
        case 'liquidado':
            return { label: 'Liquidado', className: 'bg-slate-200 text-slate-800' };
        case 'cancelado':
            return { label: 'Cancelado', className: 'bg-slate-100 text-slate-600' };
        default:
            return { label: '—', className: 'bg-slate-100 text-slate-600' };
    }
}

export default function FinanciamientosIndex({ financiamientos, filtros }) {
    const { auth } = usePage().props;
    const [q, setQ] = useState(filtros?.q ?? '');

    const rows = useMemo(() => financiamientos?.data ?? [], [financiamientos]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Financiamientos" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">Financiamientos</h1>
                        <p className="text-sm text-slate-600">
                            Contratos y balances por sucursal.
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get(route('financiamientos.index'), { q }, { preserveState: true });
                        }}
                        className="flex gap-2"
                    >
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="ID, nombre, apellido o teléfono"
                        />
                        <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                            Buscar
                        </button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Monto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Inicial</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Balance</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Frecuencia</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Pago</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Plan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((f) => (
                                <tr key={f.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-slate-900">#{f.id}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        <div className="font-medium">
                                            {f.cliente ? `${f.cliente.nombre} ${f.cliente.apellido ?? ''}` : '—'}
                                        </div>
                                        <div className="text-xs text-slate-500">{f.cliente?.telefono ?? ''}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{money(f.monto)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{money(f.inicial)}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{money(f.balance)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{f.frecuencia}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                            {f.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {(() => {
                                            const b = badgeResumenPago(f.resumen_pago);
                                            return (
                                                <span className={'rounded-full px-2 py-1 text-xs font-semibold ' + b.className}>
                                                    {b.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm">
                                        <Link
                                            href={route('financiamientos.show', f.id)}
                                            className="font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
                                        >
                                            Ver plan
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                                        No hay financiamientos con esos filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {financiamientos?.links?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {financiamientos.links.map((l, idx) => (
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

