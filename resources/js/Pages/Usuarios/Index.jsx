import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

function etiquetaPlan(rol, panelUsuarios) {
    const p = (panelUsuarios?.roles_plan ?? []).find((x) => x.rol === rol);
    return p?.etiqueta ?? rol ?? '—';
}

function desglosarRoles(userRoles, panelUsuarios) {
    const planNombres = (panelUsuarios?.roles_plan ?? []).map((x) => x.rol);
    const opNombres = (panelUsuarios?.roles_operativos ?? []).map((x) => x.rol);
    const names = (userRoles ?? []).map((r) => r.name);
    const plan = names.find((n) => planNombres.includes(n)) ?? null;
    const operativos = names.filter((n) => opNombres.includes(n));
    return { plan, operativos, names };
}

/** Cupo de plan con límite: ¿se puede asignar este rol a un usuario nuevo o al cambiar de plan? */
function puedeAsignarPlanRol(rol, cuposPorPlan, usuarioEnEdicion, panelUsuarios) {
    if (rol === 'Administrador') {
        return true;
    }
    const c = cuposPorPlan?.[rol];
    if (!c || c.max == null) {
        return true;
    }
    if (usuarioEnEdicion) {
        const { plan } = desglosarRoles(usuarioEnEdicion.roles, panelUsuarios);
        if (plan === rol) {
            return true;
        }
    }
    return c.usados < c.max;
}

export default function UsuariosIndex({ usuarios, panelUsuarios, cuposPorPlan = {}, sucursales, filtros }) {
    const { auth, flash, errors } = usePage().props;
    const permisos = new Set(auth?.permisos ?? []);
    const puedeCrear = permisos.has('usuarios.crear');
    const puedeEditar = permisos.has('usuarios.editar');

    const primerPlan = panelUsuarios?.roles_plan?.[0]?.rol ?? 'Plan Basico';

    const formInicial = useMemo(
        () => ({
            name: '',
            email: '',
            password: '',
            sucursal_id: sucursales?.[0]?.id ?? '',
            plan_rol: primerPlan,
            roles_operativos: [],
        }),
        [primerPlan, sucursales],
    );

    const [q, setQ] = useState(filtros?.q ?? '');
    const [form, setForm] = useState(formInicial);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState(null);

    useEffect(() => {
        setForm((prev) => {
            if (puedeAsignarPlanRol(prev.plan_rol, cuposPorPlan, null, panelUsuarios)) {
                return prev;
            }
            const firstOk = (panelUsuarios?.roles_plan ?? [])
                .map((x) => x.rol)
                .find((rol) => puedeAsignarPlanRol(rol, cuposPorPlan, null, panelUsuarios));
            if (firstOk && firstOk !== prev.plan_rol) {
                return { ...prev, plan_rol: firstOk };
            }
            return prev;
        });
    }, [cuposPorPlan, panelUsuarios]);

    const abrirEditar = useCallback(
        (u) => {
            const { plan, operativos } = desglosarRoles(u.roles, panelUsuarios);
            const candidato = plan ?? primerPlan;
            const planInicial = puedeAsignarPlanRol(candidato, cuposPorPlan, u, panelUsuarios)
                ? candidato
                : (panelUsuarios?.roles_plan ?? [])
                      .map((x) => x.rol)
                      .find((rol) => puedeAsignarPlanRol(rol, cuposPorPlan, u, panelUsuarios)) ?? candidato;
            setEditUser(u);
            setEditForm({
                name: u.name,
                email: u.email,
                password: '',
                sucursal_id: u.sucursal_id ?? '',
                plan_rol: planInicial,
                roles_operativos: operativos,
            });
        },
        [cuposPorPlan, panelUsuarios, primerPlan],
    );

    const rows = useMemo(() => usuarios?.data ?? [], [usuarios]);

    const cupoBloqueaCrear =
        form.plan_rol &&
        !puedeAsignarPlanRol(form.plan_rol, cuposPorPlan, null, panelUsuarios);

    const editCupoBloqueaGuardar =
        editUser &&
        editForm &&
        !puedeAsignarPlanRol(editForm.plan_rol, cuposPorPlan, editUser, panelUsuarios);

    return (
        <AuthenticatedLayout>
            <Head title="Usuarios" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">Usuarios y planes</h1>
                            <p className="text-sm text-slate-600">
                                Crea cuentas y asigna el <strong>plan comercial</strong> (Básico, Full o Administrador). Opcionalmente
                                añade perfiles operativos (vendedor, cobrador, técnico). Los planes Básico y Full tienen{' '}
                                <strong>cupo de asientos</strong> configurable en <code className="text-xs">.env</code>.
                            </p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(route('usuarios.index'), { q }, { preserveState: true });
                            }}
                            className="flex gap-2"
                        >
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Buscar por nombre o email"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                            >
                                Buscar
                            </button>
                        </form>
                    </div>

                    {flash?.success ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
                            {flash.success}
                        </div>
                    ) : null}

                    {errors?.plan_rol ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">{errors.plan_rol}</div>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2">
                        {['Plan Basico', 'Plan Full'].map((rol) => {
                            const c = cuposPorPlan?.[rol];
                            if (!c) {
                                return null;
                            }
                            const label = etiquetaPlan(rol, panelUsuarios);
                            const limiteTxt = c.max == null ? 'sin límite' : `${c.usados} / ${c.max}`;
                            return (
                                <div
                                    key={rol}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                                >
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cupo {label}</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-900">{limiteTxt}</div>
                                    {c.max != null && c.disponibles != null ? (
                                        <div className="mt-0.5 text-xs text-slate-600">
                                            {c.disponibles === 0
                                                ? 'Sin asientos libres para nuevos usuarios con este plan.'
                                                : `${c.disponibles} asiento(s) libre(s).`}
                                        </div>
                                    ) : (
                                        <div className="mt-0.5 text-xs text-slate-600">Variable PLAN_*_MAX_USUARIOS=0 desactiva el tope.</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Sucursal
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Plan
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Extra
                                    </th>
                                    {puedeEditar ? (
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Acciones
                                        </th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((u) => {
                                    const { plan, operativos, names } = desglosarRoles(u.roles, panelUsuarios);
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{u.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{u.email}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {u.sucursal ? `${u.sucursal.nombre} (${u.sucursal.codigo})` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-800">
                                                {plan ? (
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                                                        {etiquetaPlan(plan, panelUsuarios)}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-700" title={names.join(', ')}>
                                                        Sin plan estándar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {operativos.length ? operativos.join(', ') : '—'}
                                            </td>
                                            {puedeEditar ? (
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirEditar(u)}
                                                        className="text-sm font-medium text-slate-900 underline decoration-slate-400 underline-offset-2 hover:decoration-slate-900"
                                                    >
                                                        Editar plan
                                                    </button>
                                                </td>
                                            ) : null}
                                        </tr>
                                    );
                                })}
                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={puedeEditar ? 6 : 5}
                                            className="px-4 py-10 text-center text-sm text-slate-500"
                                        >
                                            No hay usuarios con esos filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {puedeCrear ? (
                    <div className="space-y-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-slate-900">Crear usuario</h2>
                            <p className="mt-1 text-xs text-slate-500">Elige un plan principal; los roles operativos son opcionales.</p>
                            <div className="mt-3 space-y-3">
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Nombre"
                                />
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Email"
                                />
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Contraseña (mín 6)"
                                />
                                <select
                                    value={form.sucursal_id}
                                    onChange={(e) => setForm({ ...form, sucursal_id: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value="">— Sin sucursal —</option>
                                    {(sucursales ?? []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre} ({s.codigo})
                                        </option>
                                    ))}
                                </select>

                                <fieldset className="rounded-lg border border-slate-200 p-3">
                                    <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Plan comercial
                                    </legend>
                                    <div className="mt-2 space-y-3">
                                        {(panelUsuarios?.roles_plan ?? []).map((p) => {
                                            const ok = puedeAsignarPlanRol(p.rol, cuposPorPlan, null, panelUsuarios);
                                            return (
                                                <label
                                                    key={p.rol}
                                                    className={`flex gap-2 text-sm ${ok ? 'cursor-pointer text-slate-800' : 'cursor-not-allowed text-slate-400'}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="plan_rol"
                                                        checked={form.plan_rol === p.rol}
                                                        disabled={!ok}
                                                        onChange={() => setForm({ ...form, plan_rol: p.rol })}
                                                        className="mt-0.5"
                                                    />
                                                    <span>
                                                        <span className="font-medium">{p.etiqueta}</span>
                                                        <span className="block text-xs font-normal text-slate-500">{p.detalle}</span>
                                                        {!ok && p.rol !== 'Administrador' ? (
                                                            <span className="mt-0.5 block text-xs font-medium text-amber-700">Cupo completo</span>
                                                        ) : null}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>

                                <fieldset className="rounded-lg border border-slate-200 p-3">
                                    <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Roles operativos (opcional)
                                    </legend>
                                    <div className="mt-2 space-y-2">
                                        {(panelUsuarios?.roles_operativos ?? []).map((p) => {
                                            const checked = form.roles_operativos.includes(p.rol);
                                            return (
                                                <label key={p.rol} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const next = e.target.checked
                                                                ? [...form.roles_operativos, p.rol]
                                                                : form.roles_operativos.filter((x) => x !== p.rol);
                                                            setForm({ ...form, roles_operativos: next });
                                                        }}
                                                        className="mt-1"
                                                    />
                                                    <span>
                                                        <span className="font-medium">{p.etiqueta}</span>
                                                        <span className="block text-xs text-slate-500">{p.detalle}</span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>

                                {cupoBloqueaCrear ? (
                                    <p className="text-xs text-amber-800">
                                        El plan seleccionado no tiene asientos libres. Elige otro plan o libera cupo editando a otro usuario.
                                    </p>
                                ) : null}
                                <button
                                    type="button"
                                    disabled={cupoBloqueaCrear}
                                    onClick={() =>
                                        router.post(route('usuarios.store'), form, {
                                            preserveScroll: true,
                                            onSuccess: () => setForm({ ...formInicial, sucursal_id: form.sucursal_id }),
                                        })
                                    }
                                    className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-white ${
                                        cupoBloqueaCrear ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-900'
                                    }`}
                                >
                                    Crear usuario
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {editUser && editForm ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-lg font-semibold text-slate-900">Editar usuario y plan</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditUser(null);
                                    setEditForm(null);
                                }}
                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{editForm.email}</p>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Nombre</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Nueva contraseña (opcional)</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Dejar vacío para no cambiar"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Sucursal</label>
                                <select
                                    value={editForm.sucursal_id}
                                    onChange={(e) => setEditForm({ ...editForm, sucursal_id: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value="">— Sin sucursal —</option>
                                    {(sucursales ?? []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre} ({s.codigo})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <fieldset className="rounded-lg border border-slate-200 p-3">
                                <legend className="px-1 text-xs font-semibold uppercase text-slate-500">Plan comercial</legend>
                                <div className="mt-2 space-y-3">
                                    {(panelUsuarios?.roles_plan ?? []).map((p) => {
                                        const ok = puedeAsignarPlanRol(p.rol, cuposPorPlan, editUser, panelUsuarios);
                                        return (
                                            <label
                                                key={p.rol}
                                                className={`flex gap-2 text-sm ${ok ? 'cursor-pointer text-slate-800' : 'cursor-not-allowed text-slate-400'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="edit_plan_rol"
                                                    checked={editForm.plan_rol === p.rol}
                                                    disabled={!ok}
                                                    onChange={() => setEditForm({ ...editForm, plan_rol: p.rol })}
                                                    className="mt-0.5"
                                                />
                                                <span>
                                                    <span className="font-medium">{p.etiqueta}</span>
                                                    <span className="block text-xs font-normal text-slate-500">{p.detalle}</span>
                                                    {!ok && p.rol !== 'Administrador' ? (
                                                        <span className="mt-0.5 block text-xs font-medium text-amber-700">Cupo completo</span>
                                                    ) : null}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            <fieldset className="rounded-lg border border-slate-200 p-3">
                                <legend className="px-1 text-xs font-semibold uppercase text-slate-500">Roles operativos</legend>
                                <div className="mt-2 space-y-2">
                                    {(panelUsuarios?.roles_operativos ?? []).map((p) => {
                                        const checked = editForm.roles_operativos.includes(p.rol);
                                        return (
                                            <label key={p.rol} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        const next = e.target.checked
                                                            ? [...editForm.roles_operativos, p.rol]
                                                            : editForm.roles_operativos.filter((x) => x !== p.rol);
                                                        setEditForm({ ...editForm, roles_operativos: next });
                                                    }}
                                                    className="mt-1"
                                                />
                                                <span className="font-medium">{p.etiqueta}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            {editCupoBloqueaGuardar ? (
                                <p className="text-xs text-amber-800">
                                    No hay cupo para el plan seleccionado. Elige otro plan o libera un asiento en otro usuario.
                                </p>
                            ) : null}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={editCupoBloqueaGuardar}
                                    onClick={() => {
                                        const payload = { ...editForm };
                                        if (!payload.password) {
                                            delete payload.password;
                                        }
                                        router.patch(route('usuarios.update', editUser.id), payload, {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setEditUser(null);
                                                setEditForm(null);
                                            },
                                        });
                                    }}
                                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white ${
                                        editCupoBloqueaGuardar ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-900'
                                    }`}
                                >
                                    Guardar cambios
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditUser(null);
                                        setEditForm(null);
                                    }}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}
