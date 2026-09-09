import { useMemo } from 'react';

function safeNum(n) {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
}

export default function DonutVentasCategoria({ items = [], height = 320 }) {
    const rows = useMemo(() => {
        return (Array.isArray(items) ? items : [])
            .map((r) => ({ label: String(r?.categoria ?? '—'), value: Math.max(0, safeNum(r?.total)) }))
            .filter((r) => r.value > 0);
    }, [items]);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const colors = ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
    let position = 0;
    const stops = rows.map((row, index) => {
        const start = position;
        position += row.value / total * 100;
        return `${colors[index % colors.length]} ${start}% ${position}%`;
    });
    const money = (n) => n.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
    if (!total) return <div style={{ minHeight: height }} className="flex items-center justify-center text-sm text-outline">Sin datos de ventas para graficar.</div>;
    return <figure className="flex flex-col items-center justify-center gap-4 py-3" style={{ minHeight: height }} aria-label="Ventas por categoría">
        <div aria-hidden="true" className="flex items-center justify-center rounded-full" style={{ width: 200, height: 200, background: `conic-gradient(${stops.join(',')})` }}>
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-xs text-outline">Total</span><span className="text-sm font-semibold">{money(total)}</span>
            </div>
        </div>
        <figcaption className="w-full">
            <ul className="space-y-2 text-sm">
                {rows.map((row, index) => <li key={`${row.label}-${index}`} className="flex items-center justify-between gap-3" title={`${row.label}: ${money(row.value)}`}>
                    <span className="flex items-center gap-2"><span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />{row.label}</span>
                    <span className="text-right">{money(row.value)} ({(row.value / total * 100).toFixed(1)}%)</span>
                </li>)}
            </ul>
        </figcaption>
    </figure>;
}

