import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Puede } from '@/lib/permisos';
import TableShell from '@/Pages/_Shared/TableShell';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function MarcasIndex({ marcas, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');
    const rows = useMemo(() => marcas?.data ?? [], [marcas]);

    const onBuscar = (e) => {
        e.preventDefault();
        router.get(route('marcas.index'), { buscar }, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout header={null}>
            <Head title="Marcas" />

            <TableShell
                title="Marcas"
                description="Marcas para el catálogo de productos."
                actions={
                    <Puede permiso="productos.crear">
                        <Link
                            href={route('marcas.create')}
                            className="inline-flex items-center rounded-lg bg-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary"
                        >
                            Nueva marca
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
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-6 py-6 text-body-md text-on-surface-variant" colSpan={3}>
                                    No hay marcas para mostrar.
                                </td>
                            </tr>
                        ) : (
                            rows.map((m) => (
                                <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-6 py-4 font-semibold text-on-surface">{m.nombre}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-primary">
                                            {m.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <Puede permiso="productos.editar">
                                                <Link
                                                    href={route('marcas.edit', m.id)}
                                                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                                >
                                                    Editar
                                                </Link>
                                            </Puede>
                                            <Puede permiso="productos.eliminar">
                                                <Link
                                                    href={route('marcas.destroy', m.id)}
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

