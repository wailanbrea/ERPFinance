import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function RolesPermisosIndex({ roles, permisos }) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Roles y permisos" />

            <div className="space-y-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Roles y permisos</h1>
                    <p className="text-sm text-slate-600">
                        Control de acceso por menú y por acción.
                    </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h2 className="text-sm font-semibold text-slate-900">Roles</h2>
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Rol</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Permisos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(roles ?? []).map((r) => (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2 text-sm font-medium text-slate-900">{r.name}</td>
                                            <td className="px-3 py-2 text-sm text-slate-700">{r.permissions_count}</td>
                                        </tr>
                                    ))}
                                    {(roles ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="px-3 py-8 text-center text-sm text-slate-500">
                                                No hay roles.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h2 className="text-sm font-semibold text-slate-900">Permisos</h2>
                        <div className="mt-3 max-h-[520px] overflow-auto rounded-lg border border-slate-200">
                            <ul className="divide-y divide-slate-100">
                                {(permisos ?? []).map((p) => (
                                    <li key={p.id} className="px-3 py-2 text-sm text-slate-700">
                                        {p.name}
                                    </li>
                                ))}
                                {(permisos ?? []).length === 0 && (
                                    <li className="px-3 py-8 text-center text-sm text-slate-500">
                                        No hay permisos.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

