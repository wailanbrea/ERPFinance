import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function BusquedaIndex({ q, clientes, productos, financiamientos }) {
    const form = useForm({ q: q ?? '' });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('busqueda.index'), { q: form.data.q }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-on-surface">Búsqueda</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">Clientes, productos y financiamientos de tu empresa.</p>
                </div>
            }
        >
            <Head title="Búsqueda" />

            <div className="mx-auto max-w-4xl space-y-6">
                <form onSubmit={submit} className="flex gap-2">
                    <input
                        type="search"
                        value={form.data.q}
                        onChange={(e) => form.setData('q', e.target.value)}
                        placeholder="Escribe al menos 2 caracteres…"
                        className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Buscar
                    </button>
                </form>

                {(!q || String(q).length < 2) && (
                    <p className="text-sm text-on-surface-variant">Introduce un término de búsqueda (mínimo 2 caracteres).</p>
                )}

                {q && String(q).length >= 2 && (
                    <div className="grid gap-6 md:grid-cols-1">
                        <section>
                            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Clientes</h3>
                            {(clientes ?? []).length ? (
                                <ul className="divide-y rounded-lg border border-outline-variant bg-white">
                                    {clientes.map((c) => (
                                        <li key={c.id}>
                                            <Link
                                                href={route('clientes.edit', c.id)}
                                                className="block px-3 py-2 text-sm hover:bg-surface-container-low"
                                            >
                                                {c.nombre} {c.apellido ?? ''} · {c.cedula_rnc ?? '—'}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-on-surface-variant">Sin resultados.</p>
                            )}
                        </section>

                        <section>
                            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Productos</h3>
                            {(productos ?? []).length ? (
                                <ul className="divide-y rounded-lg border border-outline-variant bg-white">
                                    {productos.map((p) => (
                                        <li key={p.id}>
                                            <Link
                                                href={route('productos.edit', p.id)}
                                                className="block px-3 py-2 text-sm hover:bg-surface-container-low"
                                            >
                                                {p.nombre} {p.sku ? `· ${p.sku}` : ''}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-on-surface-variant">Sin resultados.</p>
                            )}
                        </section>

                        <section>
                            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Financiamientos</h3>
                            {(financiamientos ?? []).length ? (
                                <ul className="divide-y rounded-lg border border-outline-variant bg-white">
                                    {financiamientos.map((f) => (
                                        <li key={f.id}>
                                            <Link
                                                href={route('financiamientos.show', f.id)}
                                                className="block px-3 py-2 text-sm hover:bg-surface-container-low"
                                            >
                                                #{f.id}{' '}
                                                {f.cliente
                                                    ? `· ${f.cliente.nombre ?? ''} ${f.cliente.apellido ?? ''}`.trim()
                                                    : ''}{' '}
                                                · balance RD$ {Number(f.balance ?? 0).toLocaleString('es-DO')}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-on-surface-variant">Sin resultados.</p>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
