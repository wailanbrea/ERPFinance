import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableShell from '@/Pages/_Shared/TableShell';
import { Puede } from '@/lib/permisos';
import { Head, Link, router } from '@inertiajs/react';

export default function ServicioTecnicoIndex({ ordenes, filtros }) {
    const q = filtros?.q ?? '';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Servicio técnico</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                        Órdenes de servicio: recepción, diagnóstico, reparación y entrega.
                    </p>
                </div>
            }
        >
            <Head title="Servicio técnico" />
            <TableShell
                title=""
                description=""
                actions={
                    <Puede permiso="servicio_tecnico.crear">
                        <Link
                            href={route('servicio-tecnico.create')}
                            className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                        >
                            Nueva orden
                        </Link>
                    </Puede>
                }
                filters={
                    <input
                        value={q}
                        onChange={(e) =>
                            router.get(route('servicio-tecnico.index'), { q: e.target.value }, { preserveState: true, replace: true })
                        }
                        placeholder="Buscar por número/ID..."
                        className="w-72 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                    />
                }
            >
                <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low">
                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Número</th>
                                <th className="px-6 py-3">Ingreso</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {ordenes.data.map((o) => (
                                <tr key={o.id} className="hover:bg-surface-container-low/60">
                                    <td className="px-6 py-4 font-semibold text-on-surface">#{o.id}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{o.numero ?? '—'}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{o.fecha_ingreso}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface">
                                            {o.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Puede permiso="servicio_tecnico.editar">
                                            <Link
                                                href={route('servicio-tecnico.edit', o.id)}
                                                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                            >
                                                Abrir
                                            </Link>
                                        </Puede>
                                    </td>
                                </tr>
                            ))}
                            {ordenes.data.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-10 text-sm text-on-surface-variant" colSpan={5}>
                                        No hay órdenes.
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

