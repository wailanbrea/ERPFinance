import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Puede } from '@/lib/permisos';
import { Head, useForm } from '@inertiajs/react';

export default function CajaIndex({ cajaAbierta, historial, movimientos, balance }) {
    const abrirForm = useForm({ monto_inicial: 0, nota: '' });
    const movForm = useForm({ tipo: 'entrada', concepto: '', monto: 0, nota: '' });
    const cerrarForm = useForm({ monto_cierre: 0, nota: '' });

    const abrir = (e) => {
        e.preventDefault();
        abrirForm.post(route('caja.abrir'));
    };
    const registrarMovimiento = (e) => {
        e.preventDefault();
        movForm.post(route('caja.movimiento'), { onSuccess: () => movForm.reset('concepto', 'monto', 'nota') });
    };
    const cerrar = (e) => {
        e.preventDefault();
        cerrarForm.post(route('caja.cerrar'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Caja</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">Apertura, movimientos y cierre por sucursal.</p>
                </div>
            }
        >
            <Head title="Caja" />

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div id="apertura-caja" className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm scroll-mt-24">
                        <div className="flex items-center justify-between">
                            <div className="font-bold text-on-surface">Estado actual</div>
                            <div className="text-sm text-on-surface-variant">
                                {cajaAbierta ? (
                                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface">
                                        Abierta
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface">
                                        Cerrada
                                    </span>
                                )}
                            </div>
                        </div>

                        {cajaAbierta ? (
                            <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
                                <div>
                                    <span className="font-semibold text-on-surface">Apertura:</span> {cajaAbierta.apertura_en}
                                </div>
                                <div>
                                    <span className="font-semibold text-on-surface">Inicial:</span> RD$ {Number(cajaAbierta.monto_inicial).toFixed(2)}
                                </div>
                                <div>
                                    <span className="font-semibold text-on-surface">Balance actual:</span> RD$ {Number(balance).toFixed(2)}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={abrir} className="mt-4 space-y-3">
                                <div>
                                    <InputLabel htmlFor="monto_inicial" value="Monto inicial" />
                                    <TextInput
                                        id="monto_inicial"
                                        type="number"
                                        value={abrirForm.data.monto_inicial}
                                        onChange={(e) => abrirForm.setData('monto_inicial', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={abrirForm.errors.monto_inicial} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="nota_abrir" value="Nota (opcional)" />
                                    <textarea
                                        id="nota_abrir"
                                        value={abrirForm.data.nota}
                                        onChange={(e) => abrirForm.setData('nota', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                        rows={2}
                                    />
                                </div>
                                <Puede permiso="caja.crear">
                                    <PrimaryButton disabled={abrirForm.processing} className="w-full justify-center">
                                        Abrir caja
                                    </PrimaryButton>
                                </Puede>
                            </form>
                        )}
                    </div>

                    {cajaAbierta ? (
                        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
                            <div className="font-bold text-on-surface">Movimiento (entrada/salida)</div>
                            <form onSubmit={registrarMovimiento} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel htmlFor="tipo" value="Tipo" />
                                        <select
                                            id="tipo"
                                            value={movForm.data.tipo}
                                            onChange={(e) => movForm.setData('tipo', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                        >
                                            <option value="entrada">Entrada</option>
                                            <option value="salida">Salida</option>
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="monto" value="Monto" />
                                        <TextInput
                                            id="monto"
                                            type="number"
                                            value={movForm.data.monto}
                                            onChange={(e) => movForm.setData('monto', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={movForm.errors.monto} className="mt-2" />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel htmlFor="concepto" value="Concepto (opcional)" />
                                    <TextInput
                                        id="concepto"
                                        value={movForm.data.concepto}
                                        onChange={(e) => movForm.setData('concepto', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="nota_mov" value="Nota (opcional)" />
                                    <textarea
                                        id="nota_mov"
                                        value={movForm.data.nota}
                                        onChange={(e) => movForm.setData('nota', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                        rows={2}
                                    />
                                </div>
                                <Puede permiso="caja.crear">
                                    <PrimaryButton disabled={movForm.processing} className="w-full justify-center">
                                        Registrar movimiento
                                    </PrimaryButton>
                                </Puede>
                            </form>
                        </div>
                    ) : null}

                    {cajaAbierta ? (
                        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
                            <div className="font-bold text-on-surface">Cierre / arqueo</div>
                            <form onSubmit={cerrar} className="space-y-3">
                                <div>
                                    <InputLabel htmlFor="monto_cierre" value="Monto contado (cierre)" />
                                    <TextInput
                                        id="monto_cierre"
                                        type="number"
                                        value={cerrarForm.data.monto_cierre}
                                        onChange={(e) => cerrarForm.setData('monto_cierre', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={cerrarForm.errors.monto_cierre} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="nota_cierre" value="Nota (opcional)" />
                                    <textarea
                                        id="nota_cierre"
                                        value={cerrarForm.data.nota}
                                        onChange={(e) => cerrarForm.setData('nota', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-outline-variant shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                                        rows={2}
                                    />
                                </div>
                                <Puede permiso="caja.editar">
                                    <PrimaryButton disabled={cerrarForm.processing} className="w-full justify-center">
                                        Cerrar caja
                                    </PrimaryButton>
                                </Puede>
                            </form>
                        </div>
                    ) : null}
                </div>

                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-outline-variant font-bold text-on-surface">Últimos movimientos</div>
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low">
                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Tipo</th>
                                    <th className="px-6 py-3">Concepto</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {(movimientos ?? []).map((m) => (
                                    <tr key={m.id} className="hover:bg-surface-container-low/60">
                                        <td className="px-6 py-4 text-on-surface-variant">{m.fecha}</td>
                                        <td className="px-6 py-4 text-on-surface-variant">{m.tipo}</td>
                                        <td className="px-6 py-4 text-on-surface-variant">{m.concepto ?? '—'}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-on-surface">
                                            RD$ {Number(m.monto).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {(!movimientos || movimientos.length === 0) ? (
                                    <tr>
                                        <td className="px-6 py-10 text-sm text-on-surface-variant" colSpan={4}>
                                            Sin movimientos.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-outline-variant font-bold text-on-surface">Historial de cajas</div>
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low">
                                <tr className="text-label-sm text-outline uppercase tracking-wider">
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Apertura</th>
                                    <th className="px-6 py-3">Cierre</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {historial.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-surface-container-low/60">
                                        <td className="px-6 py-4 font-semibold text-on-surface">#{c.id}</td>
                                        <td className="px-6 py-4 text-on-surface-variant">{c.apertura_en}</td>
                                        <td className="px-6 py-4 text-on-surface-variant">{c.cierre_en ?? '—'}</td>
                                        <td className="px-6 py-4 text-on-surface-variant">{c.estado}</td>
                                        <td className="px-6 py-4 text-right text-on-surface-variant">RD$ {Number(c.diferencia).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {historial.data.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-10 text-sm text-on-surface-variant" colSpan={5}>
                                            Sin historial.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

