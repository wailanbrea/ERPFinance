import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import TableShell from '@/Pages/_Shared/TableShell';
import { useEffect, useMemo, useState } from 'react';

function todayIsoLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export default function SuperAdminEmpresasIndex({ empresas, filtros }) {
    const { auth, empresa: empresaActual, flash } = usePage().props;
    const q = filtros?.q ?? '';
    const rows = empresas?.data ?? [];
    const [openId, setOpenId] = useState(empresaActual?.id != null ? Number(empresaActual.id) : null);

    const cred = flash?.credenciales_nueva_empresa ?? null;

    const selected = useMemo(() => rows.find((r) => Number(r.id) === Number(openId)) ?? null, [rows, openId]);
    const selectedIsOwner = String(selected?.slug ?? '') === 'owner';

    const { data, setData, patch, processing, errors, reset } = useForm({
        plan: selected?.plan ?? 'full',
        licencia_activa: selected?.licencia_activa ?? true,
        max_usuarios_empleados: selected?.max_usuarios_empleados ?? 5,
        inicio: selected?.inicio ?? '',
        proximo_pago: selected?.proximo_pago ?? '',
        ultimo_pago: selected?.ultimo_pago ?? '',
        estado_pago: selected?.estado_pago ?? 'al_dia',
        nota: selected?.nota ?? '',
        rnc: selected?.rnc ?? '',
        telefono_fiscal: selected?.telefono_fiscal ?? '',
        direccion_fiscal: selected?.direccion_fiscal ?? '',
        ncf_ejemplo: selected?.ncf_ejemplo ?? '',
        nota_fiscal_pdf: selected?.nota_fiscal_pdf ?? '',
    });

    // Sincronizar form cuando cambie la empresa seleccionada
    useEffect(() => {
        if (!selected) return;
        reset();
        setData({
            plan: selected.plan ?? 'full',
            licencia_activa: !!selected.licencia_activa,
            max_usuarios_empleados: selected.max_usuarios_empleados ?? 5,
            inicio: selected.inicio ?? '',
            proximo_pago: selected.proximo_pago ?? '',
            ultimo_pago: selected.ultimo_pago ?? '',
            estado_pago: selected.estado_pago ?? 'al_dia',
            nota: selected.nota ?? '',
            rnc: selected.rnc ?? '',
            telefono_fiscal: selected.telefono_fiscal ?? '',
            direccion_fiscal: selected.direccion_fiscal ?? '',
            ncf_ejemplo: selected.ncf_ejemplo ?? '',
            nota_fiscal_pdf: selected.nota_fiscal_pdf ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id]);

    // Si llega el listado después y no hay empresa seleccionada, seleccionar la empresa actual
    useEffect(() => {
        if (!openId && empresaActual?.id) {
            setOpenId(Number(empresaActual.id));
        }
    }, [openId, empresaActual?.id]);

    const createForm = useForm({
        nombre: '',
        slug: '',
        plan: 'full',
        licencia_activa: true,
        max_usuarios_empleados: 5,
        inicio: todayIsoLocal(),
        proximo_pago: '',
        ultimo_pago: '',
        estado_pago: 'al_dia',
        nota: '',
        rnc: '',
        telefono_fiscal: '',
        direccion_fiscal: '',
        ncf_ejemplo: '',
        nota_fiscal_pdf: '',
        admin_name: 'Admin Empresa',
        admin_email: '',
    });

    const crearEmpresa = (e) => {
        e.preventDefault();
        createForm.post(route('superadmin.empresas.store'), { preserveScroll: true });
    };

    const submit = (e) => {
        e.preventDefault();
        if (!selected) return;
        patch(route('superadmin.empresas.update', selected.id), { preserveScroll: true });
    };

    const eliminarEmpresa = () => {
        if (!selected) return;
        if (selectedIsOwner) return;
        const ok = window.confirm(`¿Eliminar la empresa "${selected.nombre}"? Esta acción no se puede deshacer.`);
        if (!ok) return;
        router.delete(route('superadmin.empresas.destroy', selected.id), { preserveScroll: true });
    };

    const rowIsOwner = (r) => String(r?.slug ?? '') === 'owner';
    const rowIsFree = (r) => rowIsOwner(r) || !r?.proximo_pago;

    const bloquearEmpresaRow = (r) => {
        if (!r) return;
        if (rowIsOwner(r)) return;
        const to = !r.licencia_activa;
        const ok = window.confirm(`${to ? '¿Activar' : '¿Bloquear'} la licencia de "${r.nombre}"?`);
        if (!ok) return;
        router.patch(
            route('superadmin.empresas.update', r.id),
            {
                plan: r.plan ?? 'full',
                licencia_activa: to,
                max_usuarios_empleados: r.max_usuarios_empleados ?? 5,
                inicio: r.inicio ?? null,
                proximo_pago: r.proximo_pago ?? null,
                ultimo_pago: r.ultimo_pago ?? null,
                estado_pago: r.estado_pago ?? 'al_dia',
                nota: r.nota ?? null,
            },
            { preserveScroll: true },
        );
    };

    const eliminarEmpresaRow = (r) => {
        if (!r) return;
        if (rowIsOwner(r)) return;
        const ok = window.confirm(`¿Eliminar la empresa "${r.nombre}"? Esta acción no se puede deshacer.`);
        if (!ok) return;
        router.delete(route('superadmin.empresas.destroy', r.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">SuperAdmin · Empresas</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                        Control de licencias y datos fiscales por empresa (RNC, NCF de referencia, nota en PDF).
                    </p>
                </div>
            }
        >
            <Head title="SuperAdmin · Empresas" />

            <TableShell
                title=""
                description=""
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            const s = String(createForm.data.nombre || '')
                                .trim()
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '')
                                .slice(0, 30);
                            createForm.setData('slug', createForm.data.slug || s);
                        }}
                        className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                        title="Completa el formulario de abajo y guarda"
                    >
                        Nueva licencia
                    </button>
                }
                filters={
                    <input
                        value={q}
                        onChange={(e) =>
                            router.get(route('superadmin.empresas.index'), { q: e.target.value }, { preserveState: true, replace: true })
                        }
                        placeholder="Buscar empresa por nombre/slug/ID..."
                        className="w-80 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                    />
                }
            >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-7 rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low">
                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                    <th className="px-6 py-3">Empresa</th>
                                    <th className="px-6 py-3">Plan</th>
                                    <th className="px-6 py-3">Licencia</th>
                                    <th className="px-6 py-3">Próximo pago</th>
                                    <th className="px-6 py-3">Admin</th>
                                    <th className="px-6 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        className={(openId === r.id ? 'bg-surface-container-low/60' : 'bg-white') + ' hover:bg-surface-container-low/60'}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-on-surface">{r.nombre}</div>
                                            <div className="text-xs text-outline">#{r.id} · {r.slug}</div>
                                            {r.rnc ? (
                                                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                                    RNC · {r.rnc}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 text-on-surface-variant">{r.plan}</td>
                                        <td className="px-6 py-4">
                                            <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (r.licencia_activa ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                                                {r.licencia_activa ? 'Activa' : 'Desactivada'}
                                            </span>
                                            <div className="mt-1 text-xs text-outline">{r.estado_pago ?? '—'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-on-surface-variant">
                                            {rowIsFree(r) ? (
                                                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface ring-1 ring-outline-variant">
                                                    Free
                                                </span>
                                            ) : (
                                                (r.proximo_pago ?? '—')
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-on-surface-variant">
                                            <div className="text-xs">
                                                <div className="font-semibold text-on-surface">{r.admin_user?.email ?? '—'}</div>
                                                <div className="text-outline">{r.admin_user?.name ?? ''}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenId(Number(r.id))}
                                                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                                >
                                                    Administrar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => bloquearEmpresaRow(r)}
                                                    disabled={rowIsOwner(r)}
                                                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60"
                                                    title={rowIsOwner(r) ? 'OWNER no se puede bloquear' : (r.licencia_activa ? 'Bloquear' : 'Activar')}
                                                >
                                                    {r.licencia_activa ? 'Bloquear' : 'Activar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarEmpresaRow(r)}
                                                    disabled={rowIsOwner(r)}
                                                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                                    title={rowIsOwner(r) ? 'OWNER no se puede eliminar' : 'Eliminar'}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-10 text-sm text-on-surface-variant" colSpan={6}>
                                            No hay empresas.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-on-surface">Licencia</div>
                                    <div className="mt-1 text-xs text-outline">
                                        {selected ? `Editando: ${selected.nombre}` : 'Selecciona una empresa para administrar.'}
                                    </div>
                                </div>
                            </div>

                            {cred ? (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-900">
                                        Credenciales (mostrar una sola vez)
                                    </div>
                                    <div className="mt-2 text-sm text-emerald-950">
                                        <div><span className="font-semibold">Empresa:</span> {cred.empresa} ({cred.slug})</div>
                                        <div className="mt-1"><span className="font-semibold">Correo admin:</span> {cred.admin_email}</div>
                                        <div className="mt-1"><span className="font-semibold">Clave temporal:</span> {cred.admin_password}</div>
                                        <div className="mt-2 text-xs text-emerald-900/80">
                                            Guarda esta clave ahora. Por seguridad no se puede volver a ver luego.
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-outline">Nueva licencia (empresa)</div>
                                <form onSubmit={crearEmpresa} className="mt-3 space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Nombre empresa</label>
                                        <input
                                            value={createForm.data.nombre}
                                            onChange={(e) => createForm.setData('nombre', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                        />
                                        {createForm.errors.nombre ? <div className="mt-1 text-xs text-red-700">{createForm.errors.nombre}</div> : null}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Slug (URL/identificador)</label>
                                        <input
                                            value={createForm.data.slug}
                                            onChange={(e) => createForm.setData('slug', e.target.value)}
                                            placeholder="ej: tienda-rodriguez"
                                            className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                        />
                                        {createForm.errors.slug ? <div className="mt-1 text-xs text-red-700">{createForm.errors.slug}</div> : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Plan</label>
                                            <select
                                                value={createForm.data.plan}
                                                onChange={(e) => createForm.setData('plan', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                            >
                                                <option value="basico">Básico</option>
                                                <option value="full">Full</option>
                                                <option value="personalizado">Personalizado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Máx. empleados</label>
                                            <input
                                                type="number"
                                                value={createForm.data.max_usuarios_empleados}
                                                onChange={(e) => createForm.setData('max_usuarios_empleados', Number(e.target.value))}
                                                className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Correo admin empresa</label>
                                            <input
                                                value={createForm.data.admin_email}
                                                onChange={(e) => createForm.setData('admin_email', e.target.value)}
                                                placeholder="admin@cliente.com"
                                                className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                            />
                                            {createForm.errors.admin_email ? <div className="mt-1 text-xs text-red-700">{createForm.errors.admin_email}</div> : null}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Nombre admin</label>
                                            <input
                                                value={createForm.data.admin_name}
                                                onChange={(e) => createForm.setData('admin_name', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Inicio</label>
                                            <input
                                                type="date"
                                                value={createForm.data.inicio}
                                                onChange={(e) => createForm.setData('inicio', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Próximo pago</label>
                                            <input
                                                type="date"
                                                value={createForm.data.proximo_pago}
                                                onChange={(e) => createForm.setData('proximo_pago', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-outline-variant bg-white shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-xs font-semibold text-outline">Licencia activa</label>
                                        <select
                                            value={createForm.data.licencia_activa ? '1' : '0'}
                                            onChange={(e) => createForm.setData('licencia_activa', e.target.value === '1')}
                                            className="rounded-md border-outline-variant bg-white shadow-sm"
                                        >
                                            <option value="1">Sí</option>
                                            <option value="0">No</option>
                                        </select>
                                    </div>
                                    <div className="rounded-lg border border-dashed border-outline-variant bg-white/80 p-3">
                                        <div className="text-[10px] font-bold uppercase tracking-wide text-outline">Datos fiscales (opcional)</div>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-semibold text-outline">RNC</label>
                                                <input
                                                    value={createForm.data.rnc}
                                                    onChange={(e) => createForm.setData('rnc', e.target.value)}
                                                    className="mt-0.5 block w-full rounded-md border-outline-variant bg-white text-sm shadow-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-semibold text-outline">Dirección fiscal</label>
                                                <textarea
                                                    value={createForm.data.direccion_fiscal}
                                                    onChange={(e) => createForm.setData('direccion_fiscal', e.target.value)}
                                                    rows={2}
                                                    className="mt-0.5 block w-full rounded-md border-outline-variant bg-white text-sm shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-outline">Tel. fiscal</label>
                                                <input
                                                    value={createForm.data.telefono_fiscal}
                                                    onChange={(e) => createForm.setData('telefono_fiscal', e.target.value)}
                                                    className="mt-0.5 block w-full rounded-md border-outline-variant bg-white text-sm shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-outline">NCF ejemplo</label>
                                                <input
                                                    value={createForm.data.ncf_ejemplo}
                                                    onChange={(e) => createForm.setData('ncf_ejemplo', e.target.value)}
                                                    placeholder="B0100000001"
                                                    className="mt-0.5 block w-full rounded-md border-outline-variant bg-white text-sm shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={createForm.processing}
                                            className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
                                        >
                                            Crear licencia
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <form onSubmit={submit} className="mt-4 space-y-4">
                                {selected?.admin_user ? (
                                    <div className="rounded-xl border border-outline-variant bg-white px-4 py-3">
                                        <div className="text-xs font-bold uppercase tracking-wide text-outline">Admin de empresa</div>
                                        <div className="mt-2 text-sm text-on-surface">
                                            <div className="font-semibold">{selected.admin_user.email}</div>
                                            <div className="text-xs text-outline">{selected.admin_user.name}</div>
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        route('superadmin.empresas.reset_clave_admin', selected.id),
                                                        {},
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                            >
                                                Reset clave (muestra una sola vez)
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        Esta empresa aún no tiene admin asignado.
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-semibold text-outline">Plan</label>
                                    <select
                                        value={data.plan}
                                        onChange={(e) => setData('plan', e.target.value)}
                                        disabled={!selected}
                                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                    >
                                        <option value="basico">Básico</option>
                                        <option value="full">Full</option>
                                        <option value="personalizado">Personalizado</option>
                                    </select>
                                    {errors.plan ? <div className="mt-1 text-xs text-red-700">{errors.plan}</div> : null}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Licencia</label>
                                        <select
                                            value={data.licencia_activa ? '1' : '0'}
                                            onChange={(e) => setData('licencia_activa', e.target.value === '1')}
                                            disabled={!selected || selectedIsOwner}
                                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                        >
                                            <option value="1">Activa</option>
                                            <option value="0">Desactivada</option>
                                        </select>
                                        {selectedIsOwner ? (
                                            <div className="mt-1 text-xs text-outline">OWNER: no se puede desactivar.</div>
                                        ) : null}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Máx. empleados</label>
                                        <input
                                            type="number"
                                            value={data.max_usuarios_empleados}
                                            onChange={(e) => setData('max_usuarios_empleados', Number(e.target.value))}
                                            disabled={!selected}
                                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Inicio</label>
                                        <input
                                            type="date"
                                            max={todayIsoLocal()}
                                            value={data.inicio || ''}
                                            onChange={(e) => setData('inicio', e.target.value)}
                                            disabled={!selected}
                                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Próximo pago</label>
                                        <input
                                            type="date"
                                            value={data.proximo_pago || ''}
                                            onChange={(e) => setData('proximo_pago', e.target.value)}
                                            disabled={!selected}
                                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Último pago</label>
                                        <input
                                            type="date"
                                            value={data.ultimo_pago || ''}
                                            onChange={(e) => setData('ultimo_pago', e.target.value)}
                                            disabled={!selected}
                                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-outline">Estado de pago</label>
                                        <select
                                            value={data.estado_pago}
                                            onChange={(e) => setData('estado_pago', e.target.value)}
                                            disabled={!selected}
                                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                        >
                                            <option value="al_dia">Al día</option>
                                            <option value="atrasado">Atrasado</option>
                                            <option value="suspendido">Suspendido</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-4">
                                    <div className="text-xs font-bold uppercase tracking-wide text-outline">Datos fiscales (PDF / referencia DGII)</div>
                                    <p className="mt-1 text-[11px] text-on-surface-variant">
                                        Aparecen en el PDF de factura. El NCF de cada venta oficial requiere secuencias DGII; aquí va texto de referencia o ejemplo.
                                    </p>
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-outline">RNC emisor</label>
                                            <input
                                                value={data.rnc}
                                                onChange={(e) => setData('rnc', e.target.value)}
                                                disabled={!selected}
                                                placeholder="131123456"
                                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                            />
                                            {errors.rnc ? <div className="mt-1 text-xs text-red-700">{errors.rnc}</div> : null}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Teléfono fiscal</label>
                                            <input
                                                value={data.telefono_fiscal}
                                                onChange={(e) => setData('telefono_fiscal', e.target.value)}
                                                disabled={!selected}
                                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                            />
                                            {errors.telefono_fiscal ? <div className="mt-1 text-xs text-red-700">{errors.telefono_fiscal}</div> : null}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Dirección fiscal</label>
                                            <textarea
                                                value={data.direccion_fiscal}
                                                onChange={(e) => setData('direccion_fiscal', e.target.value)}
                                                disabled={!selected}
                                                rows={2}
                                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                            />
                                            {errors.direccion_fiscal ? <div className="mt-1 text-xs text-red-700">{errors.direccion_fiscal}</div> : null}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-outline">NCF / e-CF (ejemplo o referencia)</label>
                                            <input
                                                value={data.ncf_ejemplo}
                                                onChange={(e) => setData('ncf_ejemplo', e.target.value)}
                                                disabled={!selected}
                                                placeholder="B0100000001"
                                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                            />
                                            {errors.ncf_ejemplo ? <div className="mt-1 text-xs text-red-700">{errors.ncf_ejemplo}</div> : null}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-outline">Nota al pie del PDF (legal / DGII)</label>
                                            <textarea
                                                value={data.nota_fiscal_pdf}
                                                onChange={(e) => setData('nota_fiscal_pdf', e.target.value)}
                                                disabled={!selected}
                                                rows={3}
                                                placeholder="Texto fijo al final del PDF (responsabilidad tributaria, etc.)"
                                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                            />
                                            {errors.nota_fiscal_pdf ? <div className="mt-1 text-xs text-red-700">{errors.nota_fiscal_pdf}</div> : null}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-outline">Nota interna (licencia)</label>
                                    <textarea
                                        value={data.nota}
                                        onChange={(e) => setData('nota', e.target.value)}
                                        disabled={!selected}
                                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20 disabled:opacity-60"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={eliminarEmpresa}
                                        disabled={!selected || selectedIsOwner}
                                        className="mr-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                        title={selectedIsOwner ? 'La empresa OWNER no se puede eliminar' : 'Eliminar empresa'}
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selected || processing}
                                        className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </TableShell>
        </AuthenticatedLayout>
    );
}

