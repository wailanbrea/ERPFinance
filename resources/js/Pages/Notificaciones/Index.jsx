import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const tipos = {
    todos: 'Todos los tipos',
    venta: 'Ventas',
    cobro: 'Cobros',
    inventario: 'Inventario',
    gasto: 'Gastos',
    garantia: 'Garantías',
    servicio: 'Servicio técnico',
    sistema: 'Sistema',
};

const estilosTipo = {
    venta: 'bg-emerald-100 text-emerald-800',
    cobro: 'bg-blue-100 text-blue-800',
    inventario: 'bg-amber-100 text-amber-800',
    gasto: 'bg-rose-100 text-rose-800',
    garantia: 'bg-violet-100 text-violet-800',
    servicio: 'bg-cyan-100 text-cyan-800',
    sistema: 'bg-slate-100 text-slate-700',
};

function fmtFecha(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-DO', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Santo_Domingo',
    }).format(new Date(iso));
}

export default function NotificacionesIndex({ notificaciones, filtros, resumen }) {
    const { auth, flash } = usePage().props;
    const permisos = new Set(auth?.permisos ?? []);
    const puedeEditar = permisos.has('notificaciones.editar');
    const puedeEliminar = permisos.has('notificaciones.eliminar');
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');
    const [tipo, setTipo] = useState(filtros?.tipo ?? 'todos');
    const rows = notificaciones?.data ?? [];

    const filtrar = (estado = filtros?.estado ?? 'todas', nextTipo = tipo) => {
        router.get(
            route('notificaciones.index'),
            { estado, tipo: nextTipo, buscar: buscar || undefined },
            { preserveState: true, replace: true },
        );
    };

    const abrir = (notificacion, url) => {
        if (!url) return;
        if (!notificacion.read_at && puedeEditar) {
            router.post(route('notificaciones.marcar_leida', notificacion.id), {}, {
                preserveScroll: true,
                onSuccess: () => router.visit(url),
            });
            return;
        }
        router.visit(url);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notificaciones" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-container">Centro de actividad</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-on-surface">Notificaciones</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">Ventas, cobros, inventario y alertas operativas de tu empresa.</p>
                </div>
                {puedeEditar ? (
                    <button
                        type="button"
                        disabled={!resumen?.sin_leer}
                        onClick={() => router.post(route('notificaciones.marcar_todas'), {}, { preserveScroll: true })}
                        className="rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-sm font-semibold text-primary-container shadow-sm hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Marcar todas como leídas
                    </button>
                ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                    ['Total', resumen?.total ?? 0, 'todas'],
                    ['Sin leer', resumen?.sin_leer ?? 0, 'sin_leer'],
                    ['Leídas', resumen?.leidas ?? 0, 'leidas'],
                ].map(([label, value, estado]) => (
                    <button
                        key={estado}
                        type="button"
                        onClick={() => filtrar(estado)}
                        className={`rounded-xl border p-4 text-left shadow-sm transition ${
                            filtros?.estado === estado
                                ? 'border-primary-container bg-primary-container text-white'
                                : 'border-outline-variant bg-white text-on-surface hover:border-primary-container/50'
                        }`}
                    >
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</div>
                        <div className="mt-1 text-2xl font-black">{value}</div>
                    </button>
                ))}
            </div>

            {flash?.success ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{flash.success}</div>
            ) : null}

            <form
                onSubmit={(event) => { event.preventDefault(); filtrar(); }}
                className="mt-5 grid gap-3 rounded-xl border border-outline-variant bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]"
            >
                <input
                    type="search"
                    value={buscar}
                    onChange={(event) => setBuscar(event.target.value)}
                    placeholder="Buscar por título o detalle..."
                    className="rounded-lg border-outline-variant bg-surface-container-low text-sm focus:border-primary-container focus:ring-primary-container/20"
                />
                <select
                    value={tipo}
                    onChange={(event) => { setTipo(event.target.value); filtrar(filtros?.estado, event.target.value); }}
                    className="rounded-lg border-outline-variant bg-white text-sm focus:border-primary-container focus:ring-primary-container/20"
                >
                    {Object.entries(tipos).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="submit" className="rounded-lg bg-primary-container px-5 py-2 text-sm font-bold text-white hover:opacity-95">Buscar</button>
            </form>

            <div className="mt-5 space-y-3">
                {rows.map((notificacion) => {
                    const data = notificacion.data ?? {};
                    const meta = data.meta ?? {};
                    const titulo = data.titulo ?? data.title ?? 'Notificación';
                    const cuerpo = data.mensaje ?? data.message ?? '';
                    const tipoActual = meta.tipo ?? 'sistema';
                    const url = meta.url ?? meta.action_url ?? null;
                    const leida = Boolean(notificacion.read_at);

                    return (
                        <article
                            key={notificacion.id}
                            className={`rounded-xl border bg-white p-5 shadow-sm transition ${leida ? 'border-outline-variant' : 'border-blue-300 ring-1 ring-blue-100'}`}
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex min-w-0 gap-4">
                                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${leida ? 'bg-slate-300' : 'bg-blue-500'}`} aria-label={leida ? 'Leída' : 'Sin leer'} />
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${estilosTipo[tipoActual] ?? estilosTipo.sistema}`}>
                                                {tipos[tipoActual] ?? 'Sistema'}
                                            </span>
                                            {!leida ? <span className="text-xs font-bold text-blue-700">Nueva</span> : null}
                                        </div>
                                        <h2 className="mt-2 text-base font-bold text-on-surface">{titulo}</h2>
                                        <p className="mt-1 text-sm leading-6 text-on-surface-variant">{cuerpo || 'Sin detalle adicional.'}</p>
                                        <time className="mt-2 block text-xs text-outline">{fmtFecha(notificacion.created_at)}</time>
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                                    {url ? (
                                        <button type="button" onClick={() => abrir(notificacion, url)} className="rounded-lg bg-primary-container px-3 py-2 text-xs font-bold text-white hover:opacity-95">
                                            {meta.label ?? meta.action_label ?? 'Ver detalle'}
                                        </button>
                                    ) : null}
                                    {puedeEditar ? (
                                        <button
                                            type="button"
                                            onClick={() => router.post(route(leida ? 'notificaciones.marcar_no_leida' : 'notificaciones.marcar_leida', notificacion.id), {}, { preserveScroll: true })}
                                            className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                        >
                                            {leida ? 'Marcar pendiente' : 'Marcar leída'}
                                        </button>
                                    ) : null}
                                    {puedeEliminar ? (
                                        <button
                                            type="button"
                                            onClick={() => window.confirm('¿Eliminar esta notificación?') && router.delete(route('notificaciones.destroy', notificacion.id), { preserveScroll: true })}
                                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                        >
                                            Eliminar
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </article>
                    );
                })}

                {rows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
                        <div className="text-lg font-bold text-on-surface">No hay notificaciones</div>
                        <p className="mt-1 text-sm text-on-surface-variant">Los avisos de ventas, cobros y operación aparecerán aquí.</p>
                    </div>
                ) : null}
            </div>

            {notificaciones?.links?.length > 3 ? (
                <nav className="mt-6 flex flex-wrap justify-center gap-1">
                    {notificaciones.links.map((link, index) => (
                        <Link
                            key={`${index}-${link.label}`}
                            href={link.url ?? '#'}
                            preserveState
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${link.active ? 'border-primary-container bg-primary-container text-white' : 'border-outline-variant bg-white text-on-surface'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label === '&laquo; Previous' ? 'Atrás' : link.label === 'Next &raquo;' ? 'Adelante' : link.label }}
                        />
                    ))}
                </nav>
            ) : null}
        </AuthenticatedLayout>
    );
}
