import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, usePage } from '@inertiajs/react';

const modules = [
    ['Ventas y facturación', 'POS, facturas, clientes y ventas al por mayor en un solo flujo.'],
    ['Crédito y cobros', 'Financiamientos, cuotas, mora y rutas de cobro con seguimiento diario.'],
    ['Inventario y compras', 'Existencias por almacén, movimientos, proveedores y garantías.'],
    ['Control financiero', 'Caja, gastos, indicadores y reportes para decidir con datos actuales.'],
];

export default function Welcome({ canLogin }) {
    const user = usePage().props?.auth?.user;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Head title="Gestión financiera y operativa" />

            <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <ApplicationLogo className="h-11 w-11 text-blue-600" />
                    <div>
                        <div className="text-lg font-extrabold tracking-tight">ERP Bsolutions</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">Finanzas</div>
                    </div>
                </div>
                {user ? (
                    <Link href={route('dashboard')} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-blue-900/30 transition hover:bg-blue-500">
                        Ir al dashboard
                    </Link>
                ) : canLogin ? (
                    <Link href={route('login')} className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold transition hover:border-blue-400 hover:bg-slate-900">
                        Iniciar sesión
                    </Link>
                ) : null}
            </header>

            <main>
                <section className="relative overflow-hidden px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
                    <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
                    <div className="relative mx-auto max-w-7xl">
                        <div className="max-w-3xl">
                            <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-sm font-medium text-blue-200">Operación, ventas y finanzas conectadas</span>
                            <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">Control claro para hacer crecer tu negocio.</h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">ERP Bsolutions Finanzas reúne la gestión comercial, el crédito, los cobros y el inventario en una plataforma diseñada para trabajar cada día.</p>
                            <div className="mt-9 flex flex-wrap gap-4">
                                <Link href={user ? route('dashboard') : route('login')} className="rounded-xl bg-blue-600 px-6 py-3.5 font-bold shadow-xl shadow-blue-950 transition hover:-translate-y-0.5 hover:bg-blue-500">{user ? 'Abrir el sistema' : 'Acceder al sistema'}</Link>
                                <a href="#modulos" className="rounded-xl border border-slate-700 px-6 py-3.5 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900">Ver capacidades</a>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="modulos" className="border-y border-slate-800 bg-slate-900/60 px-6 py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="max-w-2xl">
                            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-400">Una vista completa</p>
                            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">La información que cada área necesita</h2>
                        </div>
                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {modules.map(([title, description], index) => (
                                <article key={title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl">
                                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-sm font-black text-blue-300">0{index + 1}</div>
                                    <h3 className="text-lg font-bold">{title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                <span>ERP Bsolutions Finanzas</span>
                <span>Gestión empresarial con datos confiables.</span>
            </footer>
        </div>
    );
}
