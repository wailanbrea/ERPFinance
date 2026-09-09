import Dropdown from '@/Components/Dropdown';
import SidebarNavIcon from '@/Components/SidebarNavIcon';
import { Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, licencia, demo } = usePage().props;
    const user = auth.user;
    const permisos = new Set(auth?.permisos ?? []);
    const notificaciones = usePage().props?.notificaciones ?? { unreadCount: 0, latest: [] };
    const isSuperAdmin = Boolean(auth?.es_superadmin_panel);
    const [busquedaQ, setBusquedaQ] = useState('');

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    const navigation = useMemo(
        () => [
            { label: 'Dashboard', icon: 'dashboard', routeName: 'dashboard', href: route('dashboard'), permiso: 'dashboard.ver' },
            { label: 'Notificaciones', icon: 'notificaciones', routeName: 'notificaciones.index', href: route('notificaciones.index'), permiso: 'notificaciones.ver' },
            { label: 'Empresas (SuperAdmin)', icon: 'config', routeName: 'superadmin.empresas.index', href: route('superadmin.empresas.index'), permiso: null, soloSuperAdmin: true },
            { label: 'Clientes', icon: 'clientes', routeName: 'clientes.index', href: route('clientes.index'), permiso: 'clientes.ver' },
            { label: 'Productos', icon: 'productos', routeName: 'productos.index', href: route('productos.index'), permiso: 'productos.ver' },
            { label: 'Categorías', icon: 'productos', routeName: 'categorias.index', href: route('categorias.index'), permiso: 'productos.ver' },
            { label: 'Inventario', icon: 'inventario', routeName: 'inventario.index', href: route('inventario.index'), permiso: 'inventario.ver' },
            { label: 'Almacenes', icon: 'almacenes', routeName: 'almacenes.index', href: route('almacenes.index'), permiso: 'almacenes.ver' },
            { label: 'Compras', icon: 'compras', routeName: 'compras.index', href: route('compras.index'), permiso: 'compras.ver' },
            { label: 'Ventas (detalle)', icon: 'ventas', routeName: 'ventas.pos', href: route('ventas.pos'), permiso: 'ventas.ver' },
            { label: 'Ventas al por mayor', icon: 'ventas_mayor', routeName: 'ventas.mayor', href: route('ventas.mayor'), permiso: 'ventas.ver' },
            { label: 'Facturas', icon: 'facturas', routeName: 'facturas.index', href: route('facturas.index'), permiso: 'facturas.ver' },
            { label: 'Financiamientos', icon: 'financiamientos', routeName: 'financiamientos.index', href: route('financiamientos.index'), permiso: 'financiamientos.ver' },
            { label: 'Cobros', icon: 'cobros', routeName: 'cobros.index', href: route('cobros.index'), permiso: 'cobros.ver' },
            { label: 'Rutas de cobro', icon: 'rutas', routeName: 'rutas-cobro.index', href: route('rutas-cobro.index'), permiso: 'rutas_cobro.ver' },
            { label: 'Garantías', icon: 'garantias', routeName: 'garantias.index', href: route('garantias.index'), permiso: 'garantias.ver' },
            { label: 'Servicio técnico', icon: 'servicio', routeName: 'servicio-tecnico.index', href: route('servicio-tecnico.index'), permiso: 'servicio_tecnico.ver' },
            { label: 'Caja', icon: 'caja', routeName: 'caja.index', href: route('caja.index'), permiso: 'caja.ver' },
            { label: 'Gastos', icon: 'gastos', routeName: 'gastos.index', href: route('gastos.index'), permiso: 'gastos.ver' },
            { label: 'Reportes', icon: 'reportes', routeName: 'reportes.index', href: route('reportes.index'), permiso: 'reportes.ver' },
            { label: 'Usuarios', icon: 'usuarios', routeName: 'usuarios.index', href: route('usuarios.index'), permiso: 'usuarios.ver' },
            { label: 'Roles y permisos', icon: 'roles', routeName: 'roles_permisos.index', href: route('roles_permisos.index'), permiso: 'roles_permisos.ver' },
            { label: 'Configuración', icon: 'config', routeName: 'configuracion.index', href: route('configuracion.index'), permiso: 'configuracion.ver' },
        ],
        [],
    );

    return (
        <div className="min-h-screen bg-background text-on-background">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-blue-800 bg-primary-container py-6 text-white shadow-xl">
                <div className="px-6 mb-8">
                    <Link href={route('dashboard')}>
                        <div className="text-xl font-extrabold tracking-tight leading-none">ERP Bsolutions</div>
                        <div className="text-xs tracking-[0.24em] uppercase text-blue-100/70 font-medium mt-1">Finanzas</div>
                        {licencia?.planNombre ? (
                            <div
                                className="mt-2 inline-block rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-100"
                                title="Capacidad contratada de esta instalación (ERP_PLAN)"
                            >
                                {licencia.planNombre}
                            </div>
                        ) : null}
                    </Link>
                </div>
                <nav className="flex-1 overflow-y-auto px-2 space-y-1">
                    {navigation
                        .filter((item) => (item.soloSuperAdmin ? isSuperAdmin : true))
                        .filter((item) => (item.permiso ? permisos.has(item.permiso) : true))
                        .map((item) => {
                        const active =
                            route().current(item.routeName) ||
                            (item.routeName === 'financiamientos.index' && route().current('financiamientos.show'));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={
                                    (active ? 'bg-white/10 text-white border-l-4 border-blue-400 font-semibold' : 'text-blue-100/70 hover:bg-white/5 hover:text-white') +
                                    ' flex items-center gap-3 py-3 px-4 transition-all rounded-r-lg'
                                }
                            >
                                <SidebarNavIcon name={item.icon} className="h-5 w-5 shrink-0 opacity-90" />
                                <span className="text-sm tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="px-4 mt-auto">
                    <div className="bg-blue-800/40 rounded-xl p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                            {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{user?.name}</div>
                            <div className="text-xs text-blue-200/60 truncate">Usuario</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="ml-[260px] min-h-screen flex flex-col">
                {demo?.isDemoUser ? (
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-900">
                        <strong>DEMO</strong>: navegación habilitada. Acciones (crear/editar/cobrar/vender) están bloqueadas.
                    </div>
                ) : null}
                {/* Topbar */}
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-white px-6 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <form
                            className="relative w-full max-w-md"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const q = String(busquedaQ ?? '').trim();
                                if (q.length < 2) return;
                                router.get(route('busqueda.index'), { q });
                            }}
                        >
                            <input
                                type="search"
                                value={busquedaQ}
                                onChange={(e) => setBusquedaQ(e.target.value)}
                                placeholder="Buscar (Enter): clientes, productos, financiamientos…"
                                className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 pl-4 pr-4 text-sm focus:border-primary-container focus:ring-primary-container/20"
                            />
                        </form>
                    </div>
                    <div className="hidden items-center gap-1 sm:flex">
                        {permisos.has('notificaciones.ver') ? (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        title="Notificaciones"
                                        className="relative rounded-lg p-2 text-on-surface hover:bg-surface-container-low"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.5 1.4L4 17h5m6 0a3 3 0 11-6 0h6z"
                                            />
                                        </svg>
                                        {notificaciones.unreadCount > 0 ? (
                                            <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                                                {notificaciones.unreadCount > 99 ? '99+' : notificaciones.unreadCount}
                                            </span>
                                        ) : null}
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content contentClasses="py-1 bg-white w-[380px]">
                                    <div className="px-4 py-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notificaciones</div>
                                            {permisos.has('notificaciones.editar') ? (
                                                <button
                                                    type="button"
                                                    onClick={() => router.post(route('notificaciones.marcar_todas'), {}, { preserveScroll: true })}
                                                    className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                                                >
                                                    Marcar todas
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="max-h-[360px] overflow-y-auto">
                                        {(notificaciones.latest ?? []).length ? (
                                            (notificaciones.latest ?? []).map((n) => {
                                                const data = n.data ?? {};
                                                const titulo = data.titulo ?? data.title ?? 'Notificación';
                                                const mensaje = data.mensaje ?? data.message ?? '';
                                                const meta = data.meta ?? {};
                                                const actionUrl = meta?.url ?? meta?.action_url ?? null;
                                                const actionLabel = meta?.label ?? meta?.action_label ?? 'Ver acción';
                                                const nueva = !n.read_at;
                                                return (
                                                    <div key={n.id} className={'px-4 py-3 border-t border-slate-100 ' + (nueva ? 'bg-amber-50/40' : '')}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-slate-900 truncate">{titulo}</div>
                                                                <div className="mt-0.5 text-xs text-slate-600 line-clamp-2">{mensaje || '—'}</div>
                                                                {actionUrl ? (
                                                                    <a
                                                                        href={actionUrl}
                                                                        className="mt-1 inline-block text-xs font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-800"
                                                                    >
                                                                        {actionLabel}
                                                                    </a>
                                                                ) : null}
                                                            </div>
                                                            {nueva && permisos.has('notificaciones.editar') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => router.post(route('notificaciones.marcar_leida', n.id), {}, { preserveScroll: true })}
                                                                    className="shrink-0 text-xs font-semibold text-slate-700 hover:text-slate-900"
                                                                >
                                                                    Leída
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="px-4 py-8 text-center text-sm text-slate-500">No hay notificaciones.</div>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100 px-4 py-2">
                                        <Link href={route('notificaciones.index')} className="text-sm font-semibold text-slate-900 hover:underline">
                                            Ver todas
                                        </Link>
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>
                        ) : null}
                        {permisos.has('reportes.ver') && (
                            <Link
                                href={route('reportes.index')}
                                title="Reportes"
                                className="rounded-lg p-2 text-on-surface hover:bg-surface-container-low"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.540-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </Link>
                        )}
                        {permisos.has('configuracion.ver') && (
                            <Link
                                href={route('configuracion.index')}
                                title="Configuración"
                                className="rounded-lg p-2 text-on-surface hover:bg-surface-container-low"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition"
                                    >
                                        {user.name}
                                        <svg className="ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Mi perfil</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Cerrar sesión
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        <button
                            onClick={() => setShowingNavigationDropdown((s) => !s)}
                            className="sm:hidden inline-flex items-center justify-center rounded-lg border border-outline-variant bg-white p-2 text-on-surface hover:bg-surface-container-low"
                        >
                            <span className="sr-only">Abrir menú</span>
                            <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path
                                    className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                                <path
                                    className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </header>

                {header && <div className="px-6 pt-6">{header}</div>}

                <main className="flex-1 p-container-padding">{children}</main>
            </div>
        </div>
    );
}
