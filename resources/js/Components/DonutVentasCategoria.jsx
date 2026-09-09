import { useMemo, useState } from 'react';

function safeNum(n) {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
}

const COLORS = [
    '#2563eb', // Azul
    '#0d9488', // Teal
    '#f59e0b', // Ámbar
    '#8b5cf6', // Púrpura
    '#ef4444', // Rojo
    '#06b6d4', // Cyan
    '#84cc16', // Lima
    '#ec4899', // Rosa
    '#3b82f6', // Índigo
];

export default function DonutVentasCategoria({ items = [], height = 340 }) {
    const [activeIdx, setActiveIdx] = useState(null);

    const rows = useMemo(() => {
        return (Array.isArray(items) ? items : [])
            .map((r) => ({
                label: String(r?.categoria ?? '—'),
                value: Math.max(0, safeNum(r?.total)),
                cantidad: safeNum(r?.cantidad ?? 0),
            }))
            .filter((r) => r.value > 0);
    }, [items]);

    const total = useMemo(() => rows.reduce((sum, row) => sum + row.value, 0), [rows]);

    const money = (n) =>
        'RD$ ' +
        Number(n ?? 0).toLocaleString('es-DO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const RADIUS = 85;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    // Calcular segmentos para SVG
    const segments = useMemo(() => {
        if (!total) return [];
        let accumulatedPercent = 0;
        return rows.map((row, index) => {
            const percent = row.value / total;
            const strokeDasharray = `${percent * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
            const strokeDashoffset = -accumulatedPercent * CIRCUMFERENCE;
            accumulatedPercent += percent;
            return {
                ...row,
                index,
                percent,
                color: COLORS[index % COLORS.length],
                strokeDasharray,
                strokeDashoffset,
            };
        });
    }, [rows, total, CIRCUMFERENCE]);

    if (!total) {
        return (
            <div
                style={{ minHeight: height }}
                className="flex items-center justify-center text-sm text-slate-400"
            >
                Sin datos de ventas para graficar.
            </div>
        );
    }

    const activeItem = activeIdx !== null ? rows[activeIdx] : null;

    return (
        <figure
            className="flex flex-col items-center justify-center gap-5 py-2 select-none"
            style={{ minHeight: height }}
            aria-label="Ventas por categoría"
        >
            {/* Donut SVG con animación e interacción */}
            <div className="relative flex items-center justify-center">
                <svg
                    width="230"
                    height="230"
                    viewBox="0 0 240 240"
                    className="transform -rotate-90 transition-transform duration-500 ease-out"
                >
                    {/* Anillo de fondo base */}
                    <circle
                        cx="120"
                        cy="120"
                        r={RADIUS}
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="24"
                    />

                    {/* Segmentos de la dona */}
                    {segments.map((seg) => {
                        const isHovered = activeIdx === seg.index;
                        const isAnyHovered = activeIdx !== null;

                        return (
                            <circle
                                key={seg.label + seg.index}
                                cx="120"
                                cy="120"
                                r={RADIUS}
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth={isHovered ? 32 : 24}
                                strokeDasharray={seg.strokeDasharray}
                                strokeDashoffset={seg.strokeDashoffset}
                                strokeLinecap="butt"
                                className="transition-all duration-300 ease-out cursor-pointer"
                                style={{
                                    opacity: isAnyHovered ? (isHovered ? 1 : 0.4) : 1,
                                    filter: isHovered
                                        ? `drop-shadow(0 4px 10px ${seg.color}66)`
                                        : 'none',
                                }}
                                onMouseEnter={() => setActiveIdx(seg.index)}
                                onMouseLeave={() => setActiveIdx(null)}
                            />
                        );
                    })}
                </svg>

                {/* Centro interactivo de la dona */}
                <div
                    className="pointer-events-none absolute flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white/95 px-2 text-center shadow-inner backdrop-blur-sm transition-all duration-300"
                    style={{
                        transform: activeIdx !== null ? 'scale(1.05)' : 'scale(1)',
                    }}
                >
                    {activeItem ? (
                        <>
                            <span
                                className="line-clamp-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200"
                                style={{ color: COLORS[activeIdx % COLORS.length] }}
                            >
                                {activeItem.label}
                            </span>
                            <span className="mt-0.5 text-sm font-bold text-slate-800 tracking-tight">
                                {money(activeItem.value)}
                            </span>
                            <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {((activeItem.value / total) * 100).toFixed(1)}% del total
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                Total Ventas
                            </span>
                            <span className="mt-0.5 text-sm font-bold text-slate-900 tracking-tight">
                                {money(total)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {rows.length} {rows.length === 1 ? 'categoría' : 'categorías'}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Leyenda interactiva */}
            <figcaption className="w-full max-w-sm px-1">
                <ul className="grid grid-cols-1 gap-1.5 text-xs sm:text-sm">
                    {rows.map((row, index) => {
                        const isHovered = activeIdx === index;
                        const isAnyHovered = activeIdx !== null;
                        const color = COLORS[index % COLORS.length];

                        return (
                            <li
                                key={`${row.label}-${index}`}
                                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all duration-200 cursor-pointer ${
                                    isHovered
                                        ? 'bg-slate-100/90 shadow-sm scale-[1.02]'
                                        : isAnyHovered
                                          ? 'opacity-40 hover:opacity-100'
                                          : 'hover:bg-slate-50'
                                }`}
                                onMouseEnter={() => setActiveIdx(index)}
                                onMouseLeave={() => setActiveIdx(null)}
                                title={`${row.label}: ${money(row.value)} (${((row.value / total) * 100).toFixed(1)}%)`}
                            >
                                <span className="flex items-center gap-2 font-medium text-slate-700">
                                    <span
                                        aria-hidden="true"
                                        className="inline-block h-3 w-3 shrink-0 rounded-full transition-transform duration-200"
                                        style={{
                                            backgroundColor: color,
                                            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                                            boxShadow: isHovered ? `0 0 8px ${color}aa` : 'none',
                                        }}
                                    />
                                    <span className="line-clamp-1">{row.label}</span>
                                </span>
                                <span className="text-right font-semibold text-slate-800">
                                    {money(row.value)}{' '}
                                    <span className="font-normal text-slate-400 text-xs">
                                        ({((row.value / total) * 100).toFixed(1)}%)
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </figcaption>
        </figure>
    );
}
