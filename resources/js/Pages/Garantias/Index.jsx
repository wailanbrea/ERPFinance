import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableShell from '@/Pages/_Shared/TableShell';
import { Puede } from '@/lib/permisos';
import { Head, Link, router } from '@inertiajs/react';

export default function GarantiasIndex({ garantias, filtros }) {
    const q = filtros?.q ?? '';
    const rows = garantias?.data ?? [];

    const pill = (cls, label) => (
        <span className={'inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ' + cls}>{label}</span>
    );

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Garantías</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">Registro de reclamos y seguimiento.</p>
                </div>
            }
        >
            <Head title="Garantías" />
            <TableShell
                title=""
                description=""
                actions={
                    <Puede permiso="garantias.crear">
                        <Link
                            href={route('garantias.create')}
                            className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                        >
                            Nueva garantía
                        </Link>
                    </Puede>
                }
                filters={
                    <input
                        value={q}
                        onChange={(e) =>
                            router.get(route('garantias.index'), { q: e.target.value }, { preserveState: true, replace: true })
                        }
                        placeholder="Buscar por ID..."
                        className="w-64 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                    />
                }
            >
                <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low">
                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Producto</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3">Servicio</th>
                                <th className="px-6 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {rows.map((g) => {
                                const enG = g?.garantia_calc?.en_garantia;
                                const st = g?.servicio_tecnico ?? null;
                                return (
                                <tr key={g.id} className="hover:bg-surface-container-low/60">
                                    <td className="px-6 py-4 font-semibold text-on-surface">#{g.id}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{g.fecha_reclamo}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{g.cliente ?? '—'}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{g.producto ?? '—'}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{g.tipo}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {pill('bg-surface-container-low text-on-surface ring-outline-variant', g.estado)}
                                            {enG === true
                                                ? pill('bg-emerald-50 text-emerald-700 ring-emerald-200', 'EN GARANTÍA')
                                                : enG === false
                                                  ? pill('bg-red-50 text-red-700 ring-red-200', 'FUERA')
                                                  : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-on-surface-variant">
                                        {st ? (
                                            <div className="text-xs">
                                                <div className="font-semibold text-on-surface">#{st.id} {st.numero ?? ''}</div>
                                                <div className="text-outline">{st.estado}</div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-outline">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Puede permiso="garantias.editar">
                                            <Link
                                                href={route('garantias.edit', g.id)}
                                                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                            >
                                                Abrir
                                            </Link>
                                        </Puede>
                                    </td>
                                </tr>
                                );
                            })}
                            {rows.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-10 text-sm text-on-surface-variant" colSpan={8}>
                                        No hay garantías.
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

