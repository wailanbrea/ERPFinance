import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableShell from '@/Pages/_Shared/TableShell';
import { Puede, usePuede } from '@/lib/permisos';
import { Head, Link, router } from '@inertiajs/react';

export default function RutasCobroIndex({ rutas, filtros }) {
    const puedeCrear = usePuede('rutas_cobro.crear');

    const q = filtros?.q ?? '';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Rutas de cobro</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                        Agrupación de clientes por día, cobrador, sector y frecuencia.
                    </p>
                </div>
            }
        >
            <Head title="Rutas de cobro" />
            <TableShell
                title=""
                description=""
                actions={
                    <Puede permiso="rutas_cobro.crear">
                        <Link
                            href={route('rutas-cobro.create')}
                            className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                        >
                            Nueva ruta
                        </Link>
                    </Puede>
                }
                filters={
                    <div className="flex items-center gap-3">
                        <input
                            value={q}
                            onChange={(e) =>
                                router.get(route('rutas-cobro.index'), { q: e.target.value }, { preserveState: true, replace: true })
                            }
                            placeholder="Buscar ruta..."
                            className="w-64 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                        />
                        {!puedeCrear ? null : (
                            <div className="text-xs text-on-surface-variant">Tip: edita una ruta para asignar clientes.</div>
                        )}
                    </div>
                }
            >
                <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low">
                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">Día</th>
                                <th className="px-6 py-3">Sector</th>
                                <th className="px-6 py-3">Frecuencia</th>
                                <th className="px-6 py-3">Activa</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {rutas.data.map((r) => (
                                <tr key={r.id} className="hover:bg-surface-container-low/60">
                                    <td className="px-6 py-4 font-semibold text-on-surface">{r.nombre}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{r.dia ?? '—'}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{r.sector ?? '—'}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{r.frecuencia ?? '—'}</td>
                                    <td className="px-6 py-4 text-on-surface-variant">{r.activa ? 'Sí' : 'No'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Puede permiso="rutas_cobro.editar">
                                            <Link
                                                href={route('rutas-cobro.edit', r.id)}
                                                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                            >
                                                Editar
                                            </Link>
                                        </Puede>
                                    </td>
                                </tr>
                            ))}
                            {rutas.data.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan={6}>
                                        No hay rutas creadas.
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

