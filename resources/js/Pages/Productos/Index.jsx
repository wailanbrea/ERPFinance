import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Puede } from '@/lib/permisos';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function Pagination({ links }) {
    if (!links || links.length <= 3) return null;
    return (
        <nav className="mt-6 flex justify-center">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-outline-variant bg-white p-1 shadow-sm">
                {links.map((l, idx) => {
                    const disabled = !l.url;
                    const label = l.label === '&laquo; Previous' ? 'Atrás' : l.label === 'Next &raquo;' ? 'Adelante' : l.label;
                    const clsBase =
                        'min-w-9 h-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition';
                    const cls = l.active
                        ? 'bg-primary-container text-white'
                        : 'bg-white text-on-surface hover:bg-surface-container-low';

                    return (
                        <Link
                            key={idx}
                            href={l.url ?? '#'}
                            preserveScroll
                            preserveState
                            aria-disabled={disabled}
                            className={clsBase + ' ' + cls + (disabled ? ' opacity-40 pointer-events-none' : '')}
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                })}
            </div>
        </nav>
    );
}

export default function ProductosIndex({ productos, filtros, categorias, stock }) {
    const { flash } = usePage().props;
    const [buscar, setBuscar] = useState(filtros?.buscar ?? '');
    const [categoriasSel, setCategoriasSel] = useState(new Set((filtros?.categorias ?? []).map(String)));
    const [stockSel, setStockSel] = useState(filtros?.stock ?? 'en_stock');
    const [precioFinanciadoDesde, setPrecioFinanciadoDesde] = useState(filtros?.precio_financiado_desde ?? '');
    const [precioFinanciadoHasta, setPrecioFinanciadoHasta] = useState(filtros?.precio_financiado_hasta ?? '');
    const [precioContadoDesde, setPrecioContadoDesde] = useState(filtros?.precio_contado_desde ?? '');
    const [precioContadoHasta, setPrecioContadoHasta] = useState(filtros?.precio_contado_hasta ?? '');
    const rows = useMemo(() => productos?.data ?? [], [productos]);

    const aplicar = (next = {}) => {
        router.get(
            route('productos.index'),
            {
                buscar,
                categorias: Array.from(categoriasSel),
                stock: stockSel || undefined,
                precio_financiado_desde: precioFinanciadoDesde === '' ? undefined : precioFinanciadoDesde,
                precio_financiado_hasta: precioFinanciadoHasta === '' ? undefined : precioFinanciadoHasta,
                precio_contado_desde: precioContadoDesde === '' ? undefined : precioContadoDesde,
                precio_contado_hasta: precioContadoHasta === '' ? undefined : precioContadoHasta,
                ...next,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-h1 font-bold text-on-surface">Catálogo de Productos</h1>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            Gestiona y consulta el inventario disponible para financiamiento.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                            href={route('categorias.index')}
                            className="inline-flex items-center rounded-xl border border-outline-variant bg-white px-5 py-2.5 text-sm font-semibold text-primary-container shadow-sm hover:bg-surface-container-low"
                        >
                            Administrar categorías
                        </Link>
                        <Puede permiso="productos.crear">
                            <Link
                                href={route('productos.create')}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 active:scale-[0.99]"
                            >
                                <span className="text-lg leading-none">+</span>
                                Agregar Producto
                            </Link>
                        </Puede>
                    </div>
                </div>
            }
        >
            <Head title="Productos" />

            {flash?.success ? (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {flash.success}
                </div>
            ) : null}

            <div className="flex items-start gap-6">
                <aside className="w-72 flex-shrink-0 space-y-4">
                    <div className="rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm">
                        <div className="text-h3 font-semibold text-primary">Filtros</div>

                        <div className="mt-5">
                            <div className="text-label-sm uppercase tracking-wider text-outline mb-3">Categoría</div>
                            <div className="space-y-2">
                                {categorias.map((c) => (
                                    <label key={c.id} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={categoriasSel.has(String(c.id))}
                                            onChange={(e) => {
                                                const next = new Set(categoriasSel);
                                                if (e.target.checked) next.add(String(c.id));
                                                else next.delete(String(c.id));
                                                setCategoriasSel(next);
                                            }}
                                            className="rounded border-outline-variant text-primary-container focus:ring-primary-container"
                                        />
                                        <span className="text-body-md text-on-surface">{c.nombre}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="text-label-sm uppercase tracking-wider text-outline mb-3">Disponibilidad</div>
                            <div className="space-y-2">
                                {[
                                    { id: 'en_stock', label: 'En Stock' },
                                    { id: 'agotado', label: 'Agotado' },
                                ].map((o) => (
                                    <label key={o.id} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="stock"
                                            checked={stockSel === o.id}
                                            onChange={() => setStockSel(o.id)}
                                            className="border-outline-variant text-primary-container focus:ring-primary-container"
                                        />
                                        <span className="text-body-md text-on-surface">{o.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="mb-3 text-label-sm uppercase tracking-wider text-outline">Precio financiado</div>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="text-xs font-medium text-outline">
                                    Desde
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        inputMode="decimal"
                                        value={precioFinanciadoDesde}
                                        onChange={(e) => setPrecioFinanciadoDesde(e.target.value)}
                                        placeholder="RD$ 0"
                                        className="mt-1 w-full rounded-lg border-outline-variant px-2.5 py-2 text-sm text-on-surface focus:border-primary-container focus:ring-primary-container/20"
                                    />
                                </label>
                                <label className="text-xs font-medium text-outline">
                                    Hasta
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        inputMode="decimal"
                                        value={precioFinanciadoHasta}
                                        onChange={(e) => setPrecioFinanciadoHasta(e.target.value)}
                                        placeholder="Sin límite"
                                        className="mt-1 w-full rounded-lg border-outline-variant px-2.5 py-2 text-sm text-on-surface focus:border-primary-container focus:ring-primary-container/20"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="mb-3 text-label-sm uppercase tracking-wider text-outline">Precio de contado</div>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="text-xs font-medium text-outline">
                                    Desde
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        inputMode="decimal"
                                        value={precioContadoDesde}
                                        onChange={(e) => setPrecioContadoDesde(e.target.value)}
                                        placeholder="RD$ 0"
                                        className="mt-1 w-full rounded-lg border-outline-variant px-2.5 py-2 text-sm text-on-surface focus:border-primary-container focus:ring-primary-container/20"
                                    />
                                </label>
                                <label className="text-xs font-medium text-outline">
                                    Hasta
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        inputMode="decimal"
                                        value={precioContadoHasta}
                                        onChange={(e) => setPrecioContadoHasta(e.target.value)}
                                        placeholder="Sin límite"
                                        className="mt-1 w-full rounded-lg border-outline-variant px-2.5 py-2 text-sm text-on-surface focus:border-primary-container focus:ring-primary-container/20"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button
                                type="button"
                                onClick={() => aplicar({ page: 1 })}
                                className="flex-1 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                            >
                                Aplicar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBuscar('');
                                    setCategoriasSel(new Set());
                                    setStockSel('en_stock');
                                    setPrecioFinanciadoDesde('');
                                    setPrecioFinanciadoHasta('');
                                    setPrecioContadoDesde('');
                                    setPrecioContadoHasta('');
                                    router.get(route('productos.index'), {}, { preserveState: true, replace: true });
                                }}
                                className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-primary-container hover:bg-surface-variant"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="flex-1">
                    <div className="mb-4 flex gap-3">
                        <input
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar productos por SKU, nombre o marca..."
                            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-sm focus:border-primary-container focus:ring-primary-container/20"
                        />
                        <button
                            type="button"
                            onClick={() => aplicar({ page: 1 })}
                            className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                        >
                            Buscar
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {rows.map((p) => {
                            const st = Number(stock?.[p.id] ?? 0);
                            const sinStock = st <= 0;
                            const almacenes = (p.almacenes ?? []).map((a) => a?.nombre).filter(Boolean);
                            const almacenesTxt =
                                almacenes.length > 2
                                    ? `${almacenes.slice(0, 2).join(', ')} +${almacenes.length - 2}`
                                    : almacenes.join(', ');
                            return (
                                <div
                                    key={p.id}
                                    className={
                                        'rounded-xl border border-outline-variant/40 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg ' +
                                        (sinStock ? 'opacity-80' : '')
                                    }
                                >
                                    <div className="relative h-48 bg-surface-container-low overflow-hidden">
                                        {p.imagen_url ? (
                                            <img src={p.imagen_url} alt={p.nombre} className="h-full w-full object-cover" />
                                        ) : null}
                                        <span className="absolute top-3 left-3 rounded uppercase tracking-wider bg-primary-container text-white text-[10px] font-bold px-2 py-1">
                                            {p.categoria?.nombre ?? 'General'}
                                        </span>
                                        {sinStock ? (
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <span className="bg-error text-white text-xs font-bold px-4 py-2 rounded-full uppercase">
                                                    Sin stock
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="p-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-primary mb-1 truncate">
                                                    {p.marca?.nombre ?? '—'}
                                                </div>
                                                <div className="text-sm font-semibold text-on-surface line-clamp-2">{p.nombre}</div>
                                            </div>
                                            <div className={'px-2 py-1 rounded ' + (sinStock ? 'bg-error-container' : 'bg-surface-container-low')}>
                                                <div className={'text-[10px] uppercase font-bold ' + (sinStock ? 'text-on-error-container' : 'text-outline')}>
                                                    Stock
                                                </div>
                                                <div className={'text-sm font-black ' + (sinStock ? 'text-on-error-container' : 'text-on-surface')}>
                                                    {st} ud.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-1 rounded-lg bg-surface-container-low/70 px-2.5 py-2 text-[11px] text-outline">
                                            <div className="break-all" title={p.modelo ?? ''}>
                                                <span className="font-semibold">Modelo:</span> {p.modelo || '—'}
                                            </div>
                                            <div className="break-all" title={p.serial ?? ''}>
                                                <span className="font-semibold">N/S:</span> {p.serial || '—'}
                                            </div>
                                            <div className="truncate" title={almacenes.join(', ')}>
                                                <span className="font-semibold">Almacén:</span> {almacenesTxt || '—'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-outline-variant/30">
                                            <div>
                                                <div className="text-[10px] text-outline uppercase font-bold mb-1">Precio contado</div>
                                                <div className="text-sm font-bold text-on-surface">RD$ {Number(p.precio_contado ?? 0).toFixed(2)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-primary uppercase font-bold mb-1">Precio financiado</div>
                                                <div className="text-sm font-black text-primary-container">
                                                    RD$ {Number(p.precio_financiado ?? 0).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <Puede permiso="productos.editar">
                                                <Link
                                                    href={route('productos.edit', p.id)}
                                                    className="flex-1 py-2 bg-surface-container-low text-on-surface-variant font-semibold rounded-lg hover:bg-primary-container hover:text-white transition-all text-center text-sm"
                                                >
                                                    Gestionar
                                                </Link>
                                            </Puede>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {rows.length === 0 ? (
                            <div className="text-sm text-on-surface-variant">No hay productos para los filtros seleccionados.</div>
                        ) : null}
                    </div>

                    <Pagination links={productos?.links} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

