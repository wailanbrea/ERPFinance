import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router } from '@inertiajs/react';

export default function ReportesIndex({ filtros, resumen }) {
    const setFiltros = (next) => {
        router.get(route('reportes.index'), { ...filtros, ...next }, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">Reportes</h1>
                    <p className="mt-1 text-body-md text-on-surface-variant">Resumen por rango de fechas.</p>
                </div>
            }
        >
            <Head title="Reportes" />

            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <InputLabel htmlFor="desde" value="Desde" />
                        <TextInput
                            id="desde"
                            type="date"
                            value={filtros.desde}
                            onChange={(e) => setFiltros({ desde: e.target.value })}
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="hasta" value="Hasta" />
                        <TextInput
                            id="hasta"
                            type="date"
                            value={filtros.hasta}
                            onChange={(e) => setFiltros({ hasta: e.target.value })}
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div className="md:justify-self-end">
                        <PrimaryButton type="button" onClick={() => setFiltros({})}>
                            Actualizar
                        </PrimaryButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Ventas', value: resumen.ventas_total },
                        { label: 'Cobros', value: resumen.cobros_total },
                        { label: 'Mora', value: resumen.mora_total },
                        { label: 'Gastos', value: resumen.gastos_total },
                    ].map((k) => (
                        <div key={k.label} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{k.label}</div>
                            <div className="mt-2 text-2xl font-extrabold text-on-surface">RD$ {Number(k.value).toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

