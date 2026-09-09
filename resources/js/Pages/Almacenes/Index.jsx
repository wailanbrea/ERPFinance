import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Puede } from '@/lib/permisos';
import TableShell from '@/Pages/_Shared/TableShell';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function AlmacenesIndex({ almacenes, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');
    const rows = useMemo(() => almacenes?.data ?? [], [almacenes]);

    const onBuscar = (e) => {
        e.preventDefault();
        router.get(route('almacenes.index'), { buscar }, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout header={null}>
            <Head title="Almacenes" />

            <TableShell
                title="Almacenes"
                description="Administración de almacenes por sucursal (principal, sucursal, taller, tránsito)."
                actions={
                    <Puede permiso="almacenes.crear">
                        <Link
                            href={route('almacenes.create')}
                            className="inline-flex items-center rounded-lg bg-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary"
                        >
                            Nuevo almacén
                        </Link>
                    </Puede>
                }
                filters={
                    <form onSubmit={onBuscar} className="flex flex-col gap-3 md:flex-row md:items-center">
                        <input
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-sm focus:border-primary-container focus:ring-primary-container/20"
                        />
                        <button
                            type="submit"
                            className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                        >
                            Buscar
                        </button>
                    </form>
                }
            >
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                        <tr className="text-label-sm text-outline uppercase tracking-wider">
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Productos</th>
                            <th className="px-6 py-3">Stock total</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-6 py-6 text-body-md text-on-surface-variant" colSpan={6}>
                                    No hay almacenes para mostrar.
                                </td>
                            </tr>
                        ) : (
                            rows.map((a) => (
                                <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-6 py-4 font-semibold text-on-surface">
                                        <Link href={route('almacenes.show', a.id)} className="hover:underline">
                                            {a.nombre}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{a.tipo}</td>
                                    <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                        {Number(a.productos_count ?? 0)}
                                    </td>
                                    <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                        {Number(a.stock_total ?? 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-primary">
                                            {a.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <Puede permiso="almacenes.editar">
                                                <Link
                                                    href={route('almacenes.edit', a.id)}
                                                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                                >
                                                    Editar
                                                </Link>
                                            </Puede>
                                            <Puede permiso="almacenes.eliminar">
                                                <Link
                                                    href={route('almacenes.destroy', a.id)}
                                                    method="delete"
                                                    as="button"
                                                    className="rounded-lg border border-error-container bg-error-container px-3 py-1.5 text-xs font-semibold text-on-error-container hover:bg-error-container/70"
                                                >
                                                    Eliminar
                                                </Link>
                                            </Puede>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableShell>
        </AuthenticatedLayout>
    );
}

