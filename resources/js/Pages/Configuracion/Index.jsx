import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import WindowsAgentPanel from '@/Components/WindowsAgentPanel';

export default function ConfiguracionIndex({ ajustes, claves }) {
    const { auth } = usePage().props;
    const [form, setForm] = useState({});

    useEffect(() => {
        const base = {};
        (claves ?? []).forEach((c) => {
            base[c] = ajustes?.[c] ?? '';
        });
        setForm(base);
    }, [ajustes, claves]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Configuración" />

            <div className="max-w-3xl space-y-4">
                <WindowsAgentPanel user={auth.user} />
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Configuración</h1>
                    <p className="text-sm text-slate-600">Empresa, impuestos, intereses y mora (por sucursal).</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Empresa (nombre)</label>
                            <input
                                value={form['empresa.nombre'] ?? ''}
                                onChange={(e) => setForm({ ...form, ['empresa.nombre']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">RNC</label>
                            <input
                                value={form['empresa.rnc'] ?? ''}
                                onChange={(e) => setForm({ ...form, ['empresa.rnc']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">ITBIS (%)</label>
                            <input
                                value={form['ventas.itbis_porcentaje'] ?? ''}
                                onChange={(e) => setForm({ ...form, ['ventas.itbis_porcentaje']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Ej: 18"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interés financiamiento (%)</label>
                            <input
                                value={form['financiamiento.interes_porcentaje'] ?? ''}
                                onChange={(e) => setForm({ ...form, ['financiamiento.interes_porcentaje']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Ej: 10"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mora diaria</label>
                            <input
                                value={form['cobros.mora_diaria'] ?? ''}
                                onChange={(e) => setForm({ ...form, ['cobros.mora_diaria']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Ej: 50"
                            />
                        </div>

                        <div className="sm:col-span-2 pt-2">
                            <div className="text-sm font-semibold text-slate-900">Lector de código de barras / QR</div>
                            <p className="text-sm text-slate-600">
                                En web el lector funciona como teclado. Aquí configuras el comportamiento (agregar/sumar/limpiar).
                            </p>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activar lector</label>
                            <select
                                value={form['lector.activo'] ?? '1'}
                                onChange={(e) => setForm({ ...form, ['lector.activo']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="1">Sí</option>
                                <option value="0">No</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Limpiar campo al agregar</label>
                            <select
                                value={form['lector.limpiar_al_agregar'] ?? '1'}
                                onChange={(e) => setForm({ ...form, ['lector.limpiar_al_agregar']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="1">Sí</option>
                                <option value="0">No</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto-agregar al escanear</label>
                            <select
                                value={form['lector.auto_agregar'] ?? '1'}
                                onChange={(e) => setForm({ ...form, ['lector.auto_agregar']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="1">Sí (Enter/Agregar)</option>
                                <option value="0">No (solo buscar)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto-sumar si ya existe</label>
                            <select
                                value={form['lector.auto_sumar'] ?? '1'}
                                onChange={(e) => setForm({ ...form, ['lector.auto_sumar']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="1">Sí</option>
                                <option value="0">No (duplicar línea)</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permitir escaneo por SKU</label>
                            <select
                                value={form['lector.usar_sku'] ?? '1'}
                                onChange={(e) => setForm({ ...form, ['lector.usar_sku']: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="1">Sí</option>
                                <option value="0">No (solo barra/QR)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => router.put(route('configuracion.update'), { ajustes: form }, { preserveScroll: true })}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

