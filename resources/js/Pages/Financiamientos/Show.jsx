import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function money(n) {
    const v = Number(n ?? 0);
    return v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
}

function badgeEstadoPago(estado) {
    switch (estado) {
        case 'en_mora':
            return { label: 'EN MORA', className: 'bg-red-100 text-red-800 ring-red-200' };
        case 'al_dia':
            return { label: 'AL DÍA', className: 'bg-emerald-100 text-emerald-800 ring-emerald-200' };
        case 'liquidado':
            return { label: 'LIQUIDADO', className: 'bg-slate-200 text-slate-800 ring-slate-300' };
        case 'cancelado':
            return { label: 'CANCELADO', className: 'bg-slate-100 text-slate-600 ring-slate-200' };
        default:
            return { label: estado?.toUpperCase() ?? '—', className: 'bg-slate-100 text-slate-700 ring-slate-200' };
    }
}

function badgeSituacionCuota(situacion) {
    switch (situacion) {
        case 'pagada':
            return { label: 'Pagada', className: 'bg-emerald-50 text-emerald-800' };
        case 'vencida':
            return { label: 'Vencida', className: 'bg-red-50 text-red-800' };
        case 'vence_hoy':
            return { label: 'Vence hoy', className: 'bg-amber-50 text-amber-900' };
        case 'futura':
            return { label: 'Futura', className: 'bg-sky-50 text-sky-800' };
        default:
            return { label: situacion, className: 'bg-slate-50 text-slate-700' };
    }
}

export default function FinanciamientosShow({ fin, resumen, cuotas, hoy_iso, productos_venta = [] }) {
    const { auth } = usePage().props;
    const permisos = new Set(auth?.permisos ?? []);
    const estadoBadge = badgeEstadoPago(fin?.estado_pago);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold text-slate-900">Financiamiento #{fin?.id}</h1>
                            <span
                                className={
                                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ' +
                                    estadoBadge.className
                                }
                            >
                                {estadoBadge.label}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                Contrato: {fin?.estado}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                            {fin?.cliente?.nombre ?? 'Cliente'} · Referencia de cobro según calendario de cuotas (corte:{' '}
                            <span className="font-mono">{hoy_iso}</span>).
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('financiamientos.index')}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            ← Volver al listado
                        </Link>
                        {permisos.has('cobros.ver') && (
                            <Link
                                href={route('cobros.index')}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                            >
                                Ir a cobros
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Financiamiento #${fin?.id}`} />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance pendiente</div>
                        <div className="mt-1 text-2xl font-bold text-slate-900">{money(fin?.balance)}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cuotas</div>
                        <div className="mt-1 text-2xl font-bold text-slate-900">
                            {resumen?.cuotas_pagadas ?? 0} / {cuotas?.length ?? 0}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Pagadas · Total del plan</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vencidas sin pagar</div>
                        <div className="mt-1 text-2xl font-bold text-red-700">{resumen?.cuotas_vencidas_sin_pagar ?? 0}</div>
                        <div className="mt-1 text-xs text-slate-500">Según fecha de hoy</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Próxima cuota pendiente</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                            {resumen?.proxima_cuota ? `#${resumen.proxima_cuota.numero}` : '—'}
                        </div>
                        {resumen?.proxima_cuota && (
                            <div className="mt-1 text-xs text-slate-600">
                                {resumen.proxima_cuota.vencimiento_label} · {money(resumen.proxima_cuota.saldo_cuota)} por saldar
                            </div>
                        )}
                    </div>
                </div>

                {productos_venta.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-slate-900">Producto(s) de esta venta</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Foto y códigos del catálogo. La garantía en meses es la <span className="font-medium">garantía comercial</span>{' '}
                            definida en la ficha del producto (p. ej. 12 meses = 1 año, 24 = 2 años). Los reclamos se gestionan en el módulo
                            Garantías.
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {productos_venta.map((item) => (
                                <div
                                    key={`${item.id}-${item.sku ?? ''}-${item.codigo_barra ?? ''}`}
                                    className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                                >
                                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] font-medium uppercase text-slate-400">
                                                Sin foto
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 text-sm">
                                        <div className="font-semibold text-slate-900">{item.nombre}</div>
                                        {item.modelo ? <div className="text-slate-600">Modelo: {item.modelo}</div> : null}
                                        <dl className="mt-2 space-y-1 text-slate-700">
                                            <div className="flex flex-wrap gap-x-2">
                                                <dt className="text-slate-500">SKU</dt>
                                                <dd className="font-mono text-xs font-medium">{item.sku || '—'}</dd>
                                            </div>
                                            <div className="flex flex-wrap gap-x-2">
                                                <dt className="text-slate-500">Código de barras</dt>
                                                <dd className="font-mono text-xs font-medium break-all">{item.codigo_barra || '—'}</dd>
                                            </div>
                                            <div className="pt-1">
                                                <span className="inline-flex rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                                                    {item.garantia_texto}
                                                </span>
                                                {item.garantia_meses > 0 ? (
                                                    <span className="ms-2 text-xs text-slate-500">({item.garantia_meses} meses en ficha)</span>
                                                ) : null}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                Cantidad: <span className="font-semibold text-slate-800">{item.cantidad}</span> · Línea:{' '}
                                                {money(item.linea_subtotal)}
                                            </div>
                                        </dl>
                                        {permisos.has('productos.ver') && (
                                            <Link
                                                href={route('productos.edit', item.id)}
                                                className="mt-2 inline-block text-xs font-semibold text-indigo-700 hover:underline"
                                            >
                                                Ver ficha de producto
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-slate-900">Producto(s) de esta venta</h2>
                        <p className="mt-2 text-sm text-slate-600">{fin?.producto ?? 'No hay detalle de productos en la venta.'}</p>
                    </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">Datos del contrato</h2>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <dt className="text-slate-500">Cliente</dt>
                            <dd className="font-medium text-slate-900">{fin?.cliente?.nombre ?? '—'}</dd>
                            <dd className="text-slate-600">{fin?.cliente?.telefono ?? ''}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Plan</dt>
                            <dd className="font-medium text-slate-900">
                                {String(fin?.frecuencia ?? '').toUpperCase()} · {fin?.cuotas_total} cuotas · Tasa {resumen?.interes_porcentaje ?? fin?.interes}%
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Capital a financiar</dt>
                            <dd className="font-medium text-slate-900">{money(resumen?.capital_financiado ?? 0)}</dd>
                            <dd className="text-xs text-slate-500">Monto de venta menos inicial (base del interés).</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Interés total del contrato</dt>
                            <dd className="font-medium text-indigo-900">{money(resumen?.interes_total_contrato ?? 0)}</dd>
                            <dd className="text-xs text-slate-500">
                                {resumen?.interes_porcentaje ?? 0}% sobre el capital. Suma en cuotas: {money(resumen?.suma_interes_cuotas ?? 0)} (puede
                                diferir en céntimos por redondeo de cada cuota).
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Monto financiado</dt>
                            <dd className="font-medium text-slate-900">{money(fin?.monto)}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Inicial</dt>
                            <dd className="font-medium text-slate-900">{money(fin?.inicial)}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Venta / factura</dt>
                            <dd className="font-medium text-slate-900">
                                {fin?.venta ? (
                                    <>
                                        #{fin.venta.id} · {fin.venta.modalidad === 'mayor' ? 'Por mayor · ' : ''}
                                        {fin.venta.numero_factura ?? '—'} · {fin.venta.fecha}
                                    </>
                                ) : (
                                    '—'
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div>
                    <h2 className="mb-3 text-lg font-semibold text-slate-900">Plan de pago (todas las cuotas)</h2>
                    <p className="mb-4 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Capital</span> e <span className="font-medium text-slate-800">interés</span>{' '}
                        por cuota descomponen el total a pagar: el capital reparte el monto financiado menos la inicial; el interés es el
                        resto hasta el <span className="font-medium">Total cuota</span> (igual al monto guardado por cuota). Filas{' '}
                        <span className="font-medium text-amber-800">Futura</span> son vencimientos posteriores a hoy.{' '}
                        <span className="font-medium text-red-800">Vencida</span> indica mora. El estado <span className="font-mono">pagada</span>{' '}
                        viene de cobros.
                    </p>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Vencimiento
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Capital
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Interés
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Total cuota
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Pagado
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Saldo cuota
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Mora reg.
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Estado DB
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Situación
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Plazo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(cuotas ?? []).map((row) => {
                                        const b = badgeSituacionCuota(row.situacion);
                                        return (
                                            <tr
                                                key={row.id}
                                                className={
                                                    row.situacion === 'vencida'
                                                        ? 'bg-red-50/50'
                                                        : row.situacion === 'vence_hoy'
                                                          ? 'bg-amber-50/40'
                                                          : 'hover:bg-slate-50'
                                                }
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                                                    {row.numero}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-800">
                                                    <div>{row.vencimiento_label}</div>
                                                    <div className="font-mono text-xs text-slate-500">{row.vencimiento}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                                                    {money(row.capital_cuota ?? 0)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-indigo-900">
                                                    {money(row.interes_cuota ?? 0)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                                                    {money(row.monto)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{money(row.pagado)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                                                    {money(row.saldo_cuota)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                                                    {money(row.mora_registrada)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">{row.estado}</span>
                                                    {row.pago_parcial && (
                                                        <span className="ml-1 text-xs font-semibold text-amber-800">Parcial</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ' + b.className}>
                                                        {b.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{row.etiqueta_plazo}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
