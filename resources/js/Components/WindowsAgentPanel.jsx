import { useState } from 'react';
import { agentRequest, printerStorageKey, selectedPrinter, sendAgentCommand, setAgentToken } from '@/lib/windowsAgent';

export default function WindowsAgentPanel({ user }) {
    const [devices, setDevices] = useState(null);
    const [printer, setPrinter] = useState(() => selectedPrinter(user));
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('Conecta con el agente de BSM-POS instalado en este equipo.');
    const [busy, setBusy] = useState(false);
    const [connected, setConnected] = useState(false);
    async function run(action) {
        setBusy(true);
        try { await action(); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
    }
    async function connect() {
        setConnected(false);
        setAgentToken(token);
        const status = await agentRequest('/api/status', { timeoutMs: 3000 });
        if (status?.status !== 'ok') throw new Error('Respuesta de estado del agente no válida.');
        const data = await agentRequest('/api/devices');
        if (!Array.isArray(data?.printers)) throw new Error('El agente no devolvió una lista válida de impresoras.');
        setDevices(data);
        setConnected(true);
        setMessage(`${status.agent} ${status.version}: conectado. Selecciona una impresora y guarda la selección.`);
    }
    const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50';
    return <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3" aria-label="Conexión con Windows">
        <h2 className="font-semibold">Conexión con Windows</h2>
        <p className="text-sm text-slate-600">Impresoras instaladas, Bluetooth y puertos seriales mediante BSM-POS Windows Agent.</p>
        <label className="block text-sm">Token del agente (si está configurado)
            <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 block w-full rounded-lg border-slate-300" />
        </label>
        <p className="text-xs text-slate-500">El token se conserva solo mientras esta página permanezca abierta. La impresora se recuerda por usuario y sucursal en este navegador.</p>
        <button className={button} disabled={busy} onClick={() => run(connect)}>{busy ? 'Procesando…' : 'Conectar y buscar dispositivos'}</button>
        <p role="status" className="text-sm">{message}</p>
        <label className="block text-sm">Impresora de este equipo
            <select value={printer} onChange={(e) => setPrinter(e.target.value)} className="mt-1 block w-full rounded-lg border-slate-300">
                <option value="">Sin impresora seleccionada</option>
                {printer && !devices?.printers?.some((p) => p.name === printer) && <option value={printer}>{printer} (guardada; no detectada)</option>}
                {(devices?.printers ?? []).map((p) => <option key={p.name} value={p.name}>{p.name} — {p.type ?? 'Windows'} {p.port ?? ''} ({p.status})</option>)}
            </select>
        </label>
        <div className="flex flex-wrap gap-2">
            <button className={button} disabled={busy} onClick={() => run(async () => { localStorage.setItem(printerStorageKey(user), printer); setMessage('Selección de impresora guardada para este equipo.'); })}>Guardar impresora</button>
            <button className={button} disabled={busy || !connected || !printer} onClick={() => run(async () => { await sendAgentCommand('/api/test', { printer, message: 'ERP Bsolutions Finanzas - Prueba de conexión Windows' }); setMessage('Prueba aceptada por el agente. Comprueba la salida del papel.'); })}>Imprimir prueba</button>
        </div>
        {devices && <p className="text-xs text-slate-500">{devices.printers.length} impresoras · {devices.bluetoothDevices?.length ?? 0} dispositivos Bluetooth · {devices.serialPorts?.length ?? 0} puertos seriales. La detección no confirma la impresión física.</p>}
    </section>;
}
