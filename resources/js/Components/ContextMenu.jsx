import { useEffect } from 'react';

export default function ContextMenu({ open, x, y, items, onClose }) {
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            // click fuera o ESC cierra
            if (e.type === 'keydown' && e.key !== 'Escape') return;
            onClose?.();
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onDoc);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onDoc);
        };
    }, [open, onClose]);

    if (!open) return null;

    const left = Math.max(8, Number(x ?? 0));
    const top = Math.max(8, Number(y ?? 0));

    return (
        <div
            className="fixed z-[9999] w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            style={{ left, top }}
            role="menu"
        >
            {(items ?? []).map((it, idx) => {
                const disabled = !!it.disabled;
                return (
                    <button
                        key={`${idx}-${it.label}`}
                        type="button"
                        onClick={() => {
                            if (disabled) return;
                            it.onClick?.();
                            onClose?.();
                        }}
                        disabled={disabled}
                        className={
                            'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ' +
                            (disabled ? 'cursor-not-allowed text-slate-400' : 'text-slate-800 hover:bg-slate-50')
                        }
                    >
                        <span className="font-medium">{it.label}</span>
                        {it.hint ? <span className="text-xs text-slate-400">{it.hint}</span> : null}
                    </button>
                );
            })}
        </div>
    );
}

