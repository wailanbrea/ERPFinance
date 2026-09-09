import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { selectedPrinter, sendAgentCommand } from '@/lib/windowsAgent';
import { usePuede } from '@/lib/permisos';

export default function PrintWindowsTicket({ ventaId }) {
    const { auth } = usePage().props;
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const allowed = usePuede('facturas.imprimir');
    async function print(event) {
        event.stopPropagation();
        if (busy) return;
        setBusy(true);
        setMessage('');
        try {
            const printer = selectedPrinter(auth.user);
            if (!printer) throw new Error('Selecciona una impresora en Configuración → Conexión con Windows.');
            const response = await fetch(route('facturas.ticket', ventaId), { headers: { Accept: 'application/json' }, cache: 'no-store' });
            if (!response.ok) throw new Error(response.status === 403 ? 'No tienes permiso para imprimir esta factura.' : 'No se pudo obtener el ticket de la factura.');
            const { content } = await response.json();
            await sendAgentCommand('/api/print', { printer, content });
            setMessage('Ticket aceptado por el agente. Comprueba la salida del papel.');
        } catch (error) { setMessage(error.message); } finally { setBusy(false); }
    }
    if (!allowed) return null;
    return <span onClick={(e) => e.stopPropagation()}>
        <button type="button" disabled={busy} onClick={print} className="ml-2 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold disabled:opacity-50">{busy ? 'Enviando…' : 'Ticket Windows'}</button>
        {message && <span role="status" className="mt-2 block max-w-xs text-xs text-left">{message}</span>}
    </span>;
}
