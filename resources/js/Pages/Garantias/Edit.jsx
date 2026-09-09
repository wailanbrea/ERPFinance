import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

function formatDateOrDash(v) {
    const s = String(v ?? '').trim();
    return s ? s : '—';
}

function pill(cls, label) {
    return <span className={'inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ' + cls}>{label}</span>;
}

export default function GarantiasEdit({ garantia, detalle }) {
    const { auth } = usePage().props;
    const permisos = new Set(auth?.permisos ?? []);
    const d = detalle ?? {};
    const cliente = d.cliente ?? null;
    const producto = d.producto ?? null;
    const venta = d.venta ?? null;
    const st = d.servicio_tecnico ?? null;
    const calc = d.garantia_calc ?? {};

    const { data, setData, put, processing, errors } = useForm({
        estado: garantia.estado ?? 'abierta',
        diagnostico: garantia.diagnostico ?? '',
        resolucion: garantia.resolucion ?? '',
        fecha_cierre: garantia.fecha_cierre ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('garantias.update', garantia.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Garantía #{garantia.id}</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">Actualiza estado, diagnóstico y resolución.</p>
                    </div>
                    <Link
                        href={route('garantias.index')}
                        className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title={`Garantía #${garantia.id}`} />

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="text-sm font-semibold text-on-surface">Detalles del reclamo</div>
                            <div className="mt-1 text-xs text-outline">
                                Aquí se muestra el cliente, producto, venta y cálculo de vigencia de garantía.
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {calc?.en_garantia === true
                                ? pill('bg-emerald-50 text-emerald-700 ring-emerald-200', 'EN GARANTÍA')
                                : calc?.en_garantia === false
                                  ? pill('bg-red-50 text-red-700 ring-red-200', 'FUERA DE GARANTÍA')
                                  : pill('bg-slate-100 text-slate-600 ring-slate-200', 'SIN CÁLCULO')}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-outline-variant bg-white px-4 py-3">
                        <div className="text-sm text-on-surface">
                            <span className="font-semibold">Servicio técnico:</span>{' '}
                            {st ? (
                                <span className="text-on-surface">
                                    Orden #{st.id} {st.numero ? `(${st.numero})` : ''} ·{' '}
                                    <span className="font-semibold">{st.estado}</span>
                                </span>
                            ) : (
                                <span className="text-outline">Aún no se ha creado una orden.</span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {st && permisos.has('servicio_tecnico.ver') ? (
                                <Link
                                    href={route('servicio-tecnico.edit', st.id)}
                                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                                >
                                    Ver orden
                                </Link>
                            ) : null}
                            {!st && permisos.has('garantias.editar') ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(route('garantias.enviar_servicio', garantia.id), {}, { preserveScroll: true })
                                    }
                                    className="rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                                >
                                    Enviar a servicio técnico
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-outline">Cliente</div>
                            <div className="mt-2 text-sm text-on-surface">
                                <div className="font-semibold">{cliente?.nombre ?? '—'}</div>
                                <div className="mt-1 text-xs text-outline">
                                    Cédula/RNC: {cliente?.cedula_rnc ?? '—'} · Tel: {cliente?.telefono ?? '—'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-outline">Producto</div>
                            <div className="mt-2 text-sm text-on-surface">
                                <div className="font-semibold">
                                    {producto?.nombre ?? '—'}
                                    {producto?.modelo ? <span className="text-outline"> · {producto.modelo}</span> : null}
                                </div>
                                <div className="mt-1 text-xs text-outline">
                                    SKU: {producto?.sku ?? '—'} · Garantía: {Number(producto?.garantia_meses ?? 0)} meses
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-outline-variant bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-outline">Venta</div>
                            <div className="mt-2 text-sm text-on-surface">
                                <div className="font-semibold">#{venta?.id ?? '—'}</div>
                                <div className="mt-1 text-xs text-outline">
                                    Fecha: {formatDateOrDash(venta?.fecha)} · Estado: {venta?.estado ?? '—'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-outline-variant bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-outline">Vigencia</div>
                            <div className="mt-2 text-sm text-on-surface">
                                <div className="text-xs text-outline">
                                    Compra: {formatDateOrDash(calc?.fecha_compra)} · Vence: {formatDateOrDash(calc?.fecha_vencimiento)}
                                </div>
                                {Number.isFinite(Number(calc?.dias_restantes)) ? (
                                    <div className="mt-2 text-sm font-semibold text-on-surface">
                                        {Number(calc.dias_restantes) >= 0
                                            ? `${calc.dias_restantes} días restantes`
                                            : `${Math.abs(calc.dias_restantes)} días vencida`}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-sm text-outline">No se puede calcular sin venta/fecha de compra.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-outline-variant bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-outline">Motivo</div>
                            <div className="mt-2 text-sm text-on-surface">{garantia.motivo || '—'}</div>
                        </div>
                        <div className="rounded-xl border border-outline-variant bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-outline">Reporte del cliente</div>
                            <div className="mt-2 whitespace-pre-wrap text-sm text-on-surface">{garantia.descripcion || '—'}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <InputLabel value="Fecha reclamo" />
                            <TextInput value={garantia.fecha_reclamo} disabled className="mt-1 block w-full" />
                        </div>
                        <div>
                            <InputLabel value="Tipo" />
                            <TextInput value={garantia.tipo} disabled className="mt-1 block w-full" />
                        </div>
                        <div>
                            <InputLabel htmlFor="estado" value="Estado" />
                            <select
                                id="estado"
                                value={data.estado}
                                onChange={(e) => setData('estado', e.target.value)}
                                className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            >
                                <option value="abierta">Abierta</option>
                                <option value="en_proceso">En proceso</option>
                                <option value="resuelta">Resuelta</option>
                                <option value="rechazada">Rechazada</option>
                                <option value="cerrada">Cerrada</option>
                            </select>
                            <InputError message={errors.estado} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="diagnostico" value="Diagnóstico (opcional)" />
                        <textarea
                            id="diagnostico"
                            value={data.diagnostico}
                            onChange={(e) => setData('diagnostico', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={3}
                        />
                        <InputError message={errors.diagnostico} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="resolucion" value="Resolución (opcional)" />
                        <textarea
                            id="resolucion"
                            value={data.resolucion}
                            onChange={(e) => setData('resolucion', e.target.value)}
                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                            rows={3}
                        />
                        <InputError message={errors.resolucion} className="mt-2" />
                    </div>

                    <div className="max-w-xs">
                        <InputLabel htmlFor="fecha_cierre" value="Fecha cierre (opcional)" />
                        <TextInput
                            id="fecha_cierre"
                            type="date"
                            value={data.fecha_cierre || ''}
                            onChange={(e) => setData('fecha_cierre', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.fecha_cierre} className="mt-2" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>Guardar cambios</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

