import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableShell from '@/Pages/_Shared/TableShell';
import { Puede } from '@/lib/permisos';
import { Head, Link, router } from '@inertiajs/react';

export default function GastosIndex({ gastos, cajaAbierta, filtros }) {
    const q = filtros?.q ?? '';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Gastos</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">Registro de gastos por sucursal.</p>
                </div>
            }
        >
            <Head title="Gastos" />
            <TableShell
                title=""
                description=""
                actions={
                    <Puede permiso="gastos.crear">
                        <Link
                            href={route('gastos.create')}
                            className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                        >
                            Nuevo gasto
                        </Link>
                    </Puede>
                }
                filters={
                    <div className="flex items-center gap-3">
                        <input
                            value={q}
                            onChange={(e) =>
                                router.get(route('gastos.index'), { q: e.target.value }, { preserveState: true, replace: true })
                            }
                            placeholder="Buscar concepto..."
                            className="w-64 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                        />
                        <div className="text-xs text-on-surface-variant">
                            Caja: <span className="font-semibold text-on-surface">{cajaAbierta ? 'abierta' : 'cerrada'}</span>
                        </div>
                    </div>
                }
            >
                <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low">
                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3">Concepto</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {gastos.data.map((g) => (
                                <tr key={g.id} className="hover:bg-surface-container-low/60">
                                    <td className="px-6 py-4 text-on-surface-variant">{g.fecha}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{g.categoria ?? '—'}</td>
                                    <td className="px-6 py-4 font-semibold text-on-surface">{g.concepto}</td>
                                    <td className="px-6 py-4 text-right text-on-surface-variant">
                                        RD$ {Number(g.monto).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {gastos.data.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-10 text-sm text-on-surface-variant" colSpan={4}>
                                        No hay gastos.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </TableShell>
        </AuthenticatedLayout>
    );
}

