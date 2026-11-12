import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableShell from '@/Pages/_Shared/TableShell';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function money(n) {
    const v = Number(n ?? 0);
    return v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
}

export default function ApartadosIndex({ auth, apartados, filters = {} }) {
    const rows = apartados?.data ?? [];
    const [openId, setOpenId] = useState(null);
    const [abonoModal, setAbonoModal] = useState(null);
    const [cancelModal, setCancelModal] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        monto: '',
        metodo_pago: 'efectivo',
        nota: '',
    });

    const openAbonar = (apartado) => {
        reset();
        setData({
            monto: apartado.saldo_pendiente,
            metodo_pago: 'efectivo',
            nota: '',
        });
        setAbonoModal(apartado);
    };

    const submitAbono = (e) => {
        e.preventDefault();
        if (!abonoModal) return;
        post(route('apartados.abonar', abonoModal.id), {
            preserveScroll: true,
            onSuccess: () => {
                setAbonoModal(null);
                reset();
            },
        });
    };

    const confirmCancelacion = () => {
        if (!cancelModal) return;
        router.post(
            route('apartados.cancelar', cancelModal.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setCancelModal(null),
            }
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-title-lg font-bold text-on-surface">Apartados Semanales</h2>
                        <p className="text-body-sm text-on-surface-variant">
                            Gestión de apartados, reserva de productos con descuento de inventario, pagos semanales y recibos.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={route('ventas.pos')}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-label-md font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
                        >
                            <span>+ Nuevo Apartado (POS)</span>
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="Apartados Semanales" />

            <TableShell title="Listado de apartados" description="Productos reservados por clientes y seguimiento de cuotas">
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                        <tr className="text-label-sm text-outline uppercase tracking-wider">
                            <th className="px-6 py-4">Apartado / Factura</th>
                            <th className="px-6 py-4">Cliente / Contacto</th>
                            <th className="px-6 py-4">Fecha / Límite</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Abonado</th>
                            <th className="px-6 py-4 text-right">Saldo Pend.</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-6 py-8 text-center text-sm text-on-surface-variant" colSpan={8}>
                                    No hay apartados registrados actualmente.
                                </td>
                            </tr>
                        ) : (
                            rows.flatMap((a) => {
                                const isOpen = Number(openId) === Number(a.id);
                                const v = a.venta;
                                const c = a.cliente;
                                const rawPhone = c?.whatsapp || c?.telefono || '';
                                const cleanPhone = String(rawPhone).replace(/\D/g, '');
                                const itemsSummary = v?.detalles?.map((d) => `${d.cantidad}x ${d.producto?.nombre}`).join(', ') || 'Productos apartados';
                                const pdfUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/facturas/${v?.id}/pdf`;
                                const waMsg = encodeURIComponent(
                                    `Hola ${c?.nombre ?? 'Cliente'}, le informamos sobre su apartado #${a.id} (${v?.numero_factura ?? 'Factura'}).\n\n` +
                                    `Productos: ${itemsSummary}\n` +
                                    `Monto Total: RD$ ${Number(a.monto_total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n` +
                                    `Total Abonado: RD$ ${Number(a.total_abonado).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n` +
                                    `Saldo Pendiente: RD$ ${Number(a.saldo_pendiente).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n` +
                                    `Fecha Límite: ${a.fecha_limite}\n\n` +
                                    `Puede ver su comprobante y factura aquí:\n${pdfUrl}`
                                );

                                return [
                                    <tr
                                        key={a.id}
                                        className="hover:bg-surface-container-low transition-colors cursor-pointer"
                                        onClick={() => setOpenId(isOpen ? null : a.id)}
                                        title="Clic para ver detalle de cuotas y productos"
                                    >
                                        <td className="px-6 py-4 font-semibold text-on-surface">
                                            <div className="flex items-center gap-2">
                                                <span className="text-outline">{isOpen ? '▾' : '▸'}</span>
                                                <div>
                                                    <div>Apartado #{a.id}</div>
                                                    <div className="text-xs text-outline font-normal">
                                                        Factura: {v?.numero_factura ?? `#${v?.id}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface">
                                            <div className="font-semibold">{c?.nombre ?? '—'}</div>
                                            <div className="text-xs text-on-surface-variant font-mono">
                                                {c?.telefono || c?.whatsapp || 'Sin teléfono'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            <div>{a.fecha_apartado}</div>
                                            <div className="text-xs text-outline">Límite: {a.fecha_limite}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-semibold text-on-surface">
                                            {money(a.monto_total)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-emerald-700 font-semibold">
                                            {money(a.total_abonado)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-rose-700 font-bold">
                                            {money(a.saldo_pendiente)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {a.estado === 'liquidado' ? (
                                                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                                    Liquidado
                                                </span>
                                            ) : a.estado === 'cancelado' ? (
                                                <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                                                    Cancelado
                                                </span>
                                            ) : a.estado === 'vencido' ? (
                                                <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                                    Vencido
                                                </span>
                                            ) : (
                                                <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                                    Activo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                {cleanPhone ? (
                                                    <a
                                                        href={`https://wa.me/${cleanPhone}?text=${waMsg}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Enviar estado de cuenta y factura por WhatsApp"
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <span>WhatsApp</span>
                                                    </a>
                                                ) : null}

                                                {a.estado === 'activo' && Number(a.saldo_pendiente) > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openAbonar(a);
                                                        }}
                                                        className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover"
                                                    >
                                                        Abonar
                                                    </button>
                                                ) : null}

                                                {a.estado === 'activo' ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCancelModal(a);
                                                        }}
                                                        className="rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                ) : null}

                                                {v?.id ? (
                                                    <a
                                                        href={route('facturas.pdf', v.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="rounded-lg border border-outline-variant bg-white px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                                    >
                                                        Factura
                                                    </a>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>,
                                    isOpen ? (
                                        <tr key={`${a.id}-detalle`} className="bg-surface-container-low/40">
                                            <td colSpan={8} className="px-6 py-4 space-y-4">
                                                {/* Detalle de Productos Apartados */}
                                                <div className="rounded-xl border border-outline-variant bg-white overflow-hidden">
                                                    <div className="px-4 py-3 border-b border-outline-variant bg-slate-50 flex items-center justify-between">
                                                        <div className="text-sm font-semibold text-on-surface">
                                                            Productos Reservados en Inventario
                                                        </div>
                                                        <div className="text-xs text-outline">
                                                            {v?.detalles?.length ? `${v.detalles.length} item(s)` : '—'}
                                                        </div>
                                                    </div>
                                                    <table className="w-full text-left">
                                                        <thead className="bg-surface-container-low">
                                                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                                                <th className="px-4 py-2">Producto</th>
                                                                <th className="px-4 py-2 text-right">Cant.</th>
                                                                <th className="px-4 py-2 text-right">Precio</th>
                                                                <th className="px-4 py-2 text-right">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-outline-variant">
                                                            {v?.detalles?.map((d) => (
                                                                <tr key={d.id} className="hover:bg-surface-container-low/60">
                                                                    <td className="px-4 py-2 text-sm font-semibold text-on-surface">
                                                                        {d.producto?.nombre ?? '—'}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                        {Number(d.cantidad ?? 0).toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-sm text-on-surface-variant">
                                                                        {money(d.precio_unitario)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-on-surface">
                                                                        {money(d.subtotal)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Cuotas Semanales */}
                                                <div className="rounded-xl border border-outline-variant bg-white overflow-hidden">
                                                    <div className="px-4 py-3 border-b border-outline-variant bg-slate-50 flex items-center justify-between">
                                                        <div className="text-sm font-semibold text-on-surface">
                                                            Calendario de Cuotas Semanales ({a.cuotas_semanales} Semanas)
                                                        </div>
                                                        <div className="text-xs text-outline">
                                                            {a.cuotas?.length ? `${a.cuotas.length} cuotas` : '—'}
                                                        </div>
                                                    </div>
                                                    <table className="w-full text-left">
                                                        <thead className="bg-surface-container-low">
                                                            <tr className="text-label-sm text-outline uppercase tracking-wider">
                                                                <th className="px-4 py-2">No. Cuota</th>
                                                                <th className="px-4 py-2">Fecha Vencimiento</th>
                                                                <th className="px-4 py-2 text-right">Monto Cuota</th>
                                                                <th className="px-4 py-2 text-right">Monto Pagado</th>
                                                                <th className="px-4 py-2 text-center">Estado</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-outline-variant">
                                                            {a.cuotas?.map((cuota) => (
                                                                <tr key={cuota.id}>
                                                                    <td className="px-4 py-2 text-sm font-semibold">
                                                                        Cuota #{cuota.numero_cuota}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm text-on-surface-variant">
                                                                        {cuota.fecha_vencimiento}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-sm font-medium">
                                                                        {money(cuota.monto)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-sm text-emerald-700 font-semibold">
                                                                        {money(cuota.monto_pagado)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center text-xs">
                                                                        {cuota.estado === 'pagada' ? (
                                                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 font-semibold">
                                                                                Pagada
                                                                            </span>
                                                                        ) : cuota.estado === 'parcial' ? (
                                                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 font-semibold">
                                                                                Parcial
                                                                            </span>
                                                                        ) : (
                                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                                                                                Pendiente
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Historial de Abonos / Pagos */}
                                                {a.pagos?.length ? (
                                                    <div className="rounded-xl border border-outline-variant bg-white p-4">
                                                        <div className="text-sm font-semibold text-on-surface mb-2">
                                                            Historial de Abonos Recibidos
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {a.pagos.map((p) => (
                                                                <div
                                                                    key={p.id}
                                                                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface-container-low"
                                                                >
                                                                    <div>
                                                                        <span className="font-semibold text-on-surface">{p.fecha_pago}</span>
                                                                        <span className="ml-2 text-outline">({p.metodo_pago})</span>
                                                                        {p.nota ? <span className="ml-2 italic text-outline">- {p.nota}</span> : null}
                                                                    </div>
                                                                    <div className="font-bold text-emerald-700">{money(p.monto)}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ) : null,
                                ];
                            })
                        )}
                    </tbody>
                </table>
            </TableShell>

            {/* Modal para Registrar Abono */}
            {abonoModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-on-surface">Registrar Abono a Apartado</h3>
                        <p className="mt-1 text-xs text-on-surface-variant">
                            Cliente: <span className="font-semibold text-on-surface">{abonoModal.cliente?.nombre}</span>
                            <br />
                            Saldo Pendiente: <span className="font-bold text-rose-700">{money(abonoModal.saldo_pendiente)}</span>
                        </p>

                        <form onSubmit={submitAbono} className="mt-4 space-y-4">
                            <div>
                                <InputLabel htmlFor="monto" value="Monto del Abono (RD$)" />
                                <TextInput
                                    id="monto"
                                    type="number"
                                    step="0.01"
                                    max={abonoModal.saldo_pendiente}
                                    value={data.monto}
                                    onChange={(e) => setData('monto', e.target.value)}
                                    className="mt-1 w-full"
                                    required
                                />
                                {errors.monto ? <div className="mt-1 text-xs text-rose-600">{errors.monto}</div> : null}
                            </div>

                            <div>
                                <InputLabel htmlFor="metodo_pago" value="Método de Pago" />
                                <select
                                    id="metodo_pago"
                                    value={data.metodo_pago}
                                    onChange={(e) => setData('metodo_pago', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <InputLabel htmlFor="nota" value="Nota o Referencia (opcional)" />
                                <TextInput
                                    id="nota"
                                    value={data.nota}
                                    onChange={(e) => setData('nota', e.target.value)}
                                    className="mt-1 w-full"
                                    placeholder="Ej. Abono cuota semana 2"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <SecondaryButton type="button" onClick={() => setAbonoModal(null)}>
                                    Cancelar
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? 'Guardando...' : 'Confirmar Abono'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {/* Modal para Confirmar Cancelación de Apartado */}
            {cancelModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-rose-700">¿Cancelar Apartado #{cancelModal.id}?</h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            Esta acción cancelará el apartado del cliente <span className="font-semibold text-on-surface">{cancelModal.cliente?.nombre}</span> y 
                            <span className="font-semibold text-rose-600"> devolverá automáticamente todas las unidades de los productos apartados al inventario</span> de la sucursal y almacén correspondientes.
                        </p>
                        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">
                            <strong>Atención:</strong> El stock reservado quedará disponible inmediatamente para otros clientes y ventas.
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <SecondaryButton type="button" onClick={() => setCancelModal(null)}>
                                Volver
                            </SecondaryButton>
                            <DangerButton type="button" onClick={confirmCancelacion}>
                                Sí, Cancelar y Devolver a Inventario
                            </DangerButton>
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}
