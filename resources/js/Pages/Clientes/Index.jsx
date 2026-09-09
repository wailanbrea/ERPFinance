import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Puede } from '@/lib/permisos';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function ClientesIndex({ clientes, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');

    const rows = useMemo(() => clientes?.data ?? [], [clientes]);

    const onBuscar = (e) => {
        e.preventDefault();
        router.get(
            route('clientes.index'),
            { buscar },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">
                            Clientes
                        </h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            Gestiona la cartera de clientes y sus datos principales.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Puede permiso="clientes.crear">
                            <Link
                                href={route('clientes.create')}
                                className="inline-flex items-center rounded-lg bg-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary"
                            >
                                Nuevo cliente
                            </Link>
                        </Puede>
                    </div>
                </div>
            }
        >
            <Head title="Clientes" />

            <div className="mb-6 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
                <form
                    onSubmit={onBuscar}
                    className="flex flex-col gap-3 md:flex-row md:items-center"
                >
                    <input
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder="Buscar por nombre, cédula/RNC o teléfono..."
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-sm focus:border-primary-container focus:ring-primary-container/20"
                    />
                    <button
                        type="submit"
                        className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                        Buscar
                    </button>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low">
                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Cédula/RNC</th>
                                <th className="px-6 py-3">Teléfono</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-6 py-6 text-body-md text-on-surface-variant"
                                        colSpan={5}
                                    >
                                        No hay clientes para mostrar.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="hover:bg-surface-container-low transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-on-surface">
                                                {c.nombre} {c.apellido ?? ''}
                                            </div>
                                            <div className="text-xs text-outline">
                                                ID: {c.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                            {c.cedula_rnc ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                            {c.telefono ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-secondary-container px-2.5 py-1 text-xs font-bold text-on-secondary-fixed-variant">
                                                {c.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <Puede permiso="clientes.editar">
                                                    <Link
                                                        href={route('clientes.edit', c.id)}
                                                        className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                                    >
                                                        Editar
                                                    </Link>
                                                </Puede>
                                                <Puede permiso="clientes.eliminar">
                                                    <Link
                                                        href={route('clientes.destroy', c.id)}
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

