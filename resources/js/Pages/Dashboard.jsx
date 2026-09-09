import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DonutVentasCategoria from '@/Components/DonutVentasCategoria';
import { useState } from 'react';

function todayIsoLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatMoney(n) {
    const v = Number(n ?? 0);
    return `RD$ ${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompactMoney(n) {
    const v = Math.abs(Number(n ?? 0));
    if (v >= 1_000_000) {
        return `RD$ ${(v / 1_000_000).toFixed(2)}M`;
    }
    if (v >= 1_000) {
        return `RD$ ${(v / 1_000).toFixed(2)}K`;
    }
    return formatMoney(n);
}

function initialsFromName(name) {
    const parts = String(name ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    const a = parts[0]?.[0] ?? '?';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (a + b).toUpperCase();
}

function KpiIcon({ children, className = '' }) {
    return (
        <div
            className={
                'flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ' + className
            }
        >
            {children}
        </div>
    );
}

export default function Dashboard({
    fecha_iso,
    fecha_label,
    es_fecha_hoy = true,
    kpis,
    ganancias,
    filtro_ganancias,
    serie_semanal = [],
    ventas_por_categoria = [],
    productos_agotados_lista = [],
    ultimos_financiamientos = [],
}) {
    const { auth } = usePage().props;
    const permisos = new Set(auth?.permisos ?? []);
    const maxFecha = todayIsoLocal();
    const [periodoFinanciero, setPeriodoFinanciero] = useState('dia');

    const onFechaChange = (e) => {
        const v = e.target.value;
        if (!v) {
            return;
        }
        router.get(route('dashboard'), { fecha: v }, { preserveScroll: true, replace: true });
    };

    const irHoy = () => {
        router.get(route('dashboard'), {}, { preserveScroll: true, replace: true });
    };

    const desde = filtro_ganancias?.desde ?? maxFecha;
    const hasta = filtro_ganancias?.hasta ?? maxFecha;

    const onRangoChange = (next) => {
        router.get(
            route('dashboard'),
            {
                fecha: fecha_iso || undefined,
                desde: next.desde ?? desde,
                hasta: next.hasta ?? hasta,
            },
            { preserveScroll: true, replace: true },
        );
    };

    const cobrosPct = kpis?.cobros_pct_vs_ayer;
    const metaCobros = Math.max(Number(kpis?.cobros_ayer ?? 0), 1);
    const pctMetaCobros = Math.min(100, Math.round((Number(kpis?.cobros_dia ?? 0) / metaCobros) * 100));

    const maxSemanal = Math.max(1, ...serie_semanal.map((d) => Number(d.total ?? 0)));
    const resumenFinanciero = ganancias?.[periodoFinanciero] ?? {};
    const gananciaNeta = Number(resumenFinanciero.ganancia ?? 0);
    const margenNeto = Number(resumenFinanciero.ventas ?? 0) > 0
        ? (gananciaNeta / Number(resumenFinanciero.ventas)) * 100
        : 0;

    const badgeForUiEstado = (ui) => {
        switch (ui) {
            case 'en_mora':
                return { label: 'EN MORA', cls: 'bg-red-50 text-red-700 ring-red-200' };
            case 'nuevo':
                return { label: 'NUEVO', cls: 'bg-sky-50 text-sky-700 ring-sky-200' };
            case 'cancelado':
                return { label: 'CANCELADO', cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
            default:
                return { label: 'AL DÍA', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Dashboard Financiero</h1>
                        <p className="mt-1 text-body-md text-outline">
                            Resumen operativo de la sucursal: ventas, cobros, cartera, inventario y riesgos del día.
                        </p>
                        {!es_fecha_hoy && (
                            <p className="mt-2 text-xs text-amber-800">
                                Vista histórica: ventas, cobros, gráfico semanal y mora se calculan respecto a la fecha
                                elegida. Por cobrar, inventario, garantías y caja reflejan el estado actual en base de
                                datos.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 py-2 shadow-sm">
                            <label htmlFor="dashboard-fecha" className="sr-only">
                                Fecha del dashboard
                            </label>
                            <input
                                id="dashboard-fecha"
                                type="date"
                                max={maxFecha}
                                value={fecha_iso ?? maxFecha}
                                onChange={onFechaChange}
                                className="border-0 bg-transparent text-sm font-medium text-on-surface focus:ring-0"
                            />
                            <span className="hidden text-xs text-outline sm:inline">({fecha_label})</span>
                            {!es_fecha_hoy && (
                                <button
                                    type="button"
                                    onClick={irHoy}
                                    className="rounded-lg bg-surface-container-low px-2 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container-high"
                                >
                                    Hoy
                                </button>
                            )}
                        </div>
                        {permisos.has('caja.ver') && (
                            <Link
                                href={
                                    !kpis?.caja_abierta && permisos.has('caja.crear')
                                        ? `${route('caja.index')}#apertura-caja`
                                        : route('caja.index')
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-primary-container/40 bg-white px-4 py-2 text-sm font-semibold text-primary-container shadow-sm hover:bg-surface-container-low"
                            >
                                {!kpis?.caja_abierta && permisos.has('caja.crear') ? 'Abrir caja' : 'Ir a caja'}
                            </Link>
                        )}
                        {permisos.has('ventas.crear') && (
                            <Link
                                href={route('ventas.pos')}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                            >
                                <span className="text-lg leading-none">+</span>
                                Nueva venta
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <section className="mb-6 rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-on-surface">Resumen financiero</h2>
                        <div className="mt-1 text-xs text-outline">
                            Ventas, costos, gastos y resultado neto del período seleccionado.
                        </div>
                    </div>
                    <div className="inline-flex flex-wrap rounded-xl bg-surface-container-low p-1" aria-label="Período financiero">
                        {[
                            { label: 'Hoy', key: 'dia' },
                            { label: 'Semana', key: 'semana' },
                            { label: 'Mes', key: 'mes' },
                            { label: 'Rango', key: 'rango' },
                        ].map((periodo) => (
                            <button
                                key={periodo.key}
                                type="button"
                                onClick={() => setPeriodoFinanciero(periodo.key)}
                                className={
                                    'rounded-lg px-3 py-2 text-sm font-semibold transition ' +
                                    (periodoFinanciero === periodo.key
                                        ? 'bg-white text-primary-container shadow-sm'
                                        : 'text-outline hover:text-on-surface')
                                }
                            >
                                {periodo.label}
                            </button>
                        ))}
                    </div>
                </div>

                {periodoFinanciero === 'rango' && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
                        <label className="text-xs font-semibold text-outline" htmlFor="ganancias-desde">Desde</label>
                        <input
                            id="ganancias-desde"
                            type="date"
                            max={maxFecha}
                            value={desde}
                            onChange={(e) => onRangoChange({ desde: e.target.value })}
                            className="rounded-lg border-outline-variant bg-white text-sm font-medium text-on-surface"
                        />
                        <label className="text-xs font-semibold text-outline" htmlFor="ganancias-hasta">Hasta</label>
                        <input
                            id="ganancias-hasta"
                            type="date"
                            max={maxFecha}
                            value={hasta}
                            onChange={(e) => onRangoChange({ hasta: e.target.value })}
                            className="rounded-lg border-outline-variant bg-white text-sm font-medium text-on-surface"
                        />
                    </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Ventas', value: resumenFinanciero.ventas, cls: 'text-on-surface' },
                        { label: 'Costo de ventas', value: resumenFinanciero.costo_ventas, cls: 'text-on-surface' },
                        { label: 'Gastos', value: resumenFinanciero.gastos, cls: 'text-on-surface' },
                        { label: 'Ganancia neta', value: gananciaNeta, cls: gananciaNeta >= 0 ? 'text-emerald-700' : 'text-red-700' },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-4">
                            <div className="text-label-sm font-medium uppercase tracking-wider text-outline">{item.label}</div>
                            <div className={'mt-2 text-h2 font-semibold ' + item.cls}>{formatMoney(item.value)}</div>
                            {item.label === 'Ganancia neta' && (
                                <div className="mt-1 text-xs text-outline">Margen neto: {margenNeto.toFixed(1)}%</div>
                            )}
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-xs text-outline">El costo de ventas se estima con el costo actual registrado en cada producto.</p>
            </section>

            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="text-label-sm font-medium uppercase tracking-wider text-outline">
                            Cobros del día
                        </div>
                        <KpiIcon className="bg-emerald-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="2" d="M12 3v18M17 8l-5-5-5 5" />
                            </svg>
                        </KpiIcon>
                    </div>
                    <div className="mt-2 text-h2 font-semibold text-on-surface">{formatMoney(kpis?.cobros_dia)}</div>
                    <div className="mt-2 text-xs text-outline">
                        <span>{pctMetaCobros}% vs meta diaria (base: cobros de ayer)</span>
                        {cobrosPct !== null && cobrosPct !== undefined ? (
                            <span className="ms-2">
                                ·{' '}
                                <span className={cobrosPct >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                                    {cobrosPct >= 0 ? '+' : ''}
                                    {cobrosPct}% vs ayer
                                </span>
                            </span>
                        ) : null}
                    </div>
                </div>

                <div
                    className={
                        'rounded-xl border bg-white p-4 shadow-sm ' +
                        (Number(kpis?.cuotas_vencidas ?? 0) > 0
                            ? 'border-red-300 ring-1 ring-red-200'
                            : 'border-outline-variant')
                    }
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="text-label-sm font-medium uppercase tracking-wider text-outline">
                            Cuotas vencidas
                        </div>
                        <KpiIcon className="bg-red-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="2" d="M12 9v4M12 17h.01M10.3 4.7h3.4L20 18H4L10.3 4.7z" />
                            </svg>
                        </KpiIcon>
                    </div>
                    <div className="mt-2 text-h2 font-semibold text-error">{kpis?.cuotas_vencidas ?? 0}</div>
                    {Number(kpis?.cuotas_vencidas ?? 0) > 0 ? (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            Acción requerida
                        </div>
                    ) : (
                        <div className="mt-2 text-xs text-outline">Sin cuotas vencidas hoy.</div>
                    )}
                </div>

                <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="text-label-sm font-medium uppercase tracking-wider text-outline">Por cobrar</div>
                        <KpiIcon className="bg-slate-800">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="2" d="M7 7h10v10H7zM7 3h10M7 21h10" />
                            </svg>
                        </KpiIcon>
                    </div>
                    <div className="mt-2 text-h2 font-semibold text-on-surface">{formatCompactMoney(kpis?.por_cobrar)}</div>
                    <div className="mt-2 text-xs text-outline">Cartera activa (balance total de financiamientos).</div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="text-label-sm font-medium uppercase tracking-wider text-outline">Stock crítico</div>
                        <KpiIcon className="bg-amber-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="2" d="M4 7h16v10H4zM8 7V5h8v2" />
                            </svg>
                        </KpiIcon>
                    </div>
                    <div className="mt-2 text-h2 font-semibold text-on-surface">{kpis?.stock_critico ?? 0}</div>
                    <div className="mt-2 text-xs text-outline">SKUs por debajo del mínimo (con stock &gt; 0).</div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="text-label-sm font-medium uppercase tracking-wider text-outline">Garantías</div>
                        <KpiIcon className="bg-sky-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="2" d="M12 3l8 4v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V7l8-4z" />
                            </svg>
                        </KpiIcon>
                    </div>
                    <div className="mt-2 text-h2 font-semibold text-on-surface">{kpis?.garantias_en_revision ?? 0}</div>
                    <div className="mt-2 text-xs text-outline">Casos abiertos o en proceso.</div>
                </div>
            </div>

            <div className="mt-gutter grid grid-cols-1 gap-gutter xl:grid-cols-12">
                <section className="xl:col-span-8">
                    <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-on-surface">Ventas por categoría</h2>
                                <p className="text-sm text-outline">
                                    Distribución (top 8) por subtotal de venta en la semana que incluye la fecha consultada.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface">
                                {es_fecha_hoy ? 'Semana actual' : 'Semana de la fecha'}
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-low p-3">
                            <DonutVentasCategoria items={ventas_por_categoria} height={320} />
                        </div>

                    </div>
                </section>

                <aside className="xl:col-span-4">
                    <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-on-surface">Alertas críticas</h2>
                        <p className="mt-1 text-sm text-outline">Prioriza mora, ruptura de stock y garantías.</p>

                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-red-800">Mora alta</div>
                                <div className="mt-2 text-sm text-red-900">
                                    <span className="font-semibold">{kpis?.mora_alta_clientes ?? 0}</span> clientes con cuotas
                                    vencidas hace más de 60 días.
                                </div>
                                {permisos.has('cobros.ver') && (
                                    <Link href={route('cobros.index')} className="mt-3 inline-block text-sm font-semibold text-red-800 underline">
                                        Ir a cobros
                                    </Link>
                                )}
                            </div>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-amber-900">Productos agotados</div>
                                <div className="mt-2 text-sm text-amber-950">
                                    <span className="font-semibold">{kpis?.productos_agotados ?? 0}</span> referencias sin stock.
                                </div>
                                {productos_agotados_lista?.length ? (
                                    <ul className="mt-3 space-y-1 text-sm text-amber-950">
                                        {productos_agotados_lista.map((p, idx) => (
                                            <li key={idx} className="truncate">
                                                <span className="font-semibold">{p.nombre}</span>
                                                {p.modelo ? <span className="text-amber-900/80"> · {p.modelo}</span> : null}
                                                {p.almacen ? <span className="text-amber-900/70"> ({p.almacen})</span> : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="mt-3 text-sm text-amber-900/80">No hay rupturas registradas.</div>
                                )}
                                {permisos.has('compras.crear') && (
                                    <Link href={route('compras.create')} className="mt-3 inline-block text-sm font-semibold text-amber-950 underline">
                                        Generar orden de compra
                                    </Link>
                                )}
                            </div>

                            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-sky-900">Garantías y servicio</div>
                                <div className="mt-2 text-sm text-sky-950">
                                    <span className="font-semibold">{kpis?.garantias_en_revision ?? 0}</span> garantías en revisión ·{' '}
                                    <span className="font-semibold">{kpis?.servicio_tecnico_pendientes ?? 0}</span> órdenes de servicio
                                    pendientes.
                                </div>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                                    {permisos.has('garantias.ver') && (
                                        <Link href={route('garantias.index')} className="text-sky-900 underline">
                                            Ver garantías
                                        </Link>
                                    )}
                                    {permisos.has('servicio_tecnico.ver') && (
                                        <Link href={route('servicio-tecnico.index')} className="text-sky-900 underline">
                                            Ver servicio técnico
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <section className="mt-gutter rounded-xl border border-outline-variant bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
                    <h2 className="text-lg font-semibold text-on-surface">Últimos financiamientos</h2>
                    {permisos.has('financiamientos.ver') && (
                        <Link href={route('financiamientos.index')} className="text-sm font-semibold text-primary-container hover:underline">
                            Ver todos
                        </Link>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-surface-container-low text-xs font-semibold uppercase tracking-wide text-outline">
                            <tr>
                                <th className="px-5 py-3">Cliente</th>
                                <th className="px-5 py-3">Producto</th>
                                <th className="px-5 py-3">Monto</th>
                                <th className="px-5 py-3">Plan</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {ultimos_financiamientos?.length ? (
                                ultimos_financiamientos.map((row) => {
                                    const badge = badgeForUiEstado(row.ui_estado);
                                    return (
                                        <tr key={row.id} className="hover:bg-surface-container-low/60">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
                                                        {initialsFromName(row.cliente)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium text-on-surface">{row.cliente}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="max-w-[320px] truncate text-on-surface">{row.producto}</div>
                                            </td>
                                            <td className="px-5 py-3 font-semibold">{formatMoney(row.monto)}</td>
                                            <td className="px-5 py-3 text-outline">{row.plan}</td>
                                            <td className="px-5 py-3">
                                                <span className={'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ' + badge.cls}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {permisos.has('financiamientos.ver') ? (
                                                    <Link
                                                        href={route('financiamientos.show', row.id)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low"
                                                        title="Ver en listado"
                                                    >
                                                        <span className="sr-only">Opciones</span>
                                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                                                        </svg>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-outline">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td className="px-5 py-8 text-center text-sm text-outline" colSpan={6}>
                                        Aún no hay financiamientos registrados en esta sucursal.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
