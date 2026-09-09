import { useState } from 'react';
import { agentRequest, printerStorageKey, selectedPrinter, sendAgentCommand, setAgentToken } from '@/lib/windowsAgent';

export default function WindowsAgentPanel({ user }) {
    const [devices, setDevices] = useState(null);
    const [printer, setPrinter] = useState(() => selectedPrinter(user));
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info'); // 'info' | 'success' | 'error' | 'warning'
    const [busy, setBusy] = useState(false);
    const [connected, setConnected] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [showTokenField, setShowTokenField] = useState(false);

    async function run(action) {
        setBusy(true);
        try {
            await action();
        } catch (error) {
            setMessage(error.message);
            setMessageType('error');
        } finally {
            setBusy(false);
        }
    }

    async function connect() {
        setConnected(false);
        setAgentToken(token);
        setMessage('Buscando agente en http://127.0.0.1:8765...');
        setMessageType('info');

        const status = await agentRequest('/api/status', { timeoutMs: 4000 });
        if (status?.status !== 'ok') {
            throw new Error('Respuesta de estado del agente no válida.');
        }

        const data = await agentRequest('/api/devices');
        if (!Array.isArray(data?.printers)) {
            throw new Error('El agente no devolvió una lista válida de impresoras.');
        }

        setDevices(data);
        setConnected(true);

        // Auto-seleccionar primera impresora si no hay una previa guardada
        if ((!printer || printer === '') && data.printers.length > 0) {
            setPrinter(data.printers[0].name);
        }

        const count = data.printers.length;
        setMessage(`✓ ${status.agent} ${status.version}: conectado con éxito. Se detectaron ${count} impresora(s) en este equipo.`);
        setMessageType('success');
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" aria-label="Conexión con Windows">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">Conexión con Windows (Hardware POS)</h2>
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                connected
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 me-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {connected ? 'Agente Conectado' : 'Agente Desconectado'}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Impresión directa de tickets térmicos ESC/POS, apertura de gaveta y puertos seriales.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                        {showInstructions ? 'Ocultar guía de instalación' : '¿Cómo instalar el agente?'}
                    </button>
                </div>
            </div>

            {/* Banner de descarga e instrucciones para primera vez */}
            {(!connected || showInstructions) && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">
                                    {connected ? 'Instalación y actualización del Agente Windows' : '¿Es tu primera vez o no tienes el Agente instalado?'}
                                </h3>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Para que este sistema web pueda enviar tickets a tu impresora térmica local sin diálogo de impresión, necesitas tener ejecutándose el <strong>BSM-POS Windows Agent</strong> en este equipo.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Botones de descarga y repositorio */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                            href="/configuracion/agente/descargar"
                            download="BSM-POS-Agent.zip"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar Agente Windows (.zip)
                        </a>

                        <a
                            href="https://github.com/wailanbrea/bsmpos-windows-agent"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            Ver en GitHub
                        </a>

                        <span className="text-xs text-slate-500 ms-1">
                            (Incluye Java 21 portable, no requiere instalar nada previo)
                        </span>
                    </div>

                    {/* Pasos de instalación */}
                    <div className="bg-white/80 rounded-lg p-3.5 border border-indigo-100 text-xs space-y-2">
                        <p className="font-semibold text-slate-900">Pasos para instalar y ponerlo a funcionar:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                            <li>
                                <strong>Descarga y descomprime:</strong> Haz clic en el botón azul superior y extrae la carpeta en tu equipo (ejemplo: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">C:\BSM-POS-Agent</code>).
                            </li>
                            <li>
                                <strong>Inicia el agente en Windows:</strong>
                                <ul className="list-disc list-inside ms-4 mt-1 space-y-1 text-slate-600">
                                    <li>
                                        <em>Opción A (Recomendada - Servicio automático):</em> Clic derecho en <code className="font-semibold text-slate-800">INSTALAR-AGENTE.bat</code> y selecciona <strong>«Ejecutar como administrador»</strong>. Se iniciará silenciosamente cada vez que prendas la PC.
                                    </li>
                                    <li>
                                        <em>Opción B (Modo manual portátil):</em> Haz doble clic en <code className="font-semibold text-slate-800">iniciar-sin-servicio.bat</code> o <code className="font-semibold text-slate-800">BSMPOS-Agent.vbs</code>.
                                    </li>
                                </ul>
                            </li>
                        </ol>
                    </div>

                    {/* Alerta de permisos de Chrome/Edge si está en HTTPS */}
                    <div className="rounded-lg bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-900 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Paso clave en Chrome / Edge para permitir conexión local:</span>
                        </div>
                        <p className="leading-relaxed">
                            Al estar navegando en un sitio seguro (HTTPS), los navegadores bloquean por defecto la comunicación con programas en tu propia máquina (127.0.0.1:8765) como protección. Para habilitarlo:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 ms-1 text-amber-900 font-medium">
                            <li>Haz clic en el ícono de candado o controles 🔒 a la izquierda de la dirección web arriba (al lado de <code className="bg-amber-100 px-1 py-0.5 rounded">erpfinance.bsolutions.dev</code>).</li>
                            <li>Selecciona <strong>«Configuración del sitio»</strong> (Site settings).</li>
                            <li>Busca <strong>«Contenido no seguro»</strong> (o <em>Dispositivos en la red local</em>) y cámbialo a <strong>«Permitir»</strong>.</li>
                            <li>Regresa a esta pestaña, recarga la página y pulsa <strong>«Conectar y buscar dispositivos»</strong>.</li>
                        </ol>
                        <div className="pt-1 flex items-center gap-2">
                            <a
                                href="http://127.0.0.1:8765/api/status"
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-800 underline font-semibold hover:text-amber-950 inline-flex items-center gap-1"
                            >
                                Probar si el agente responde en tu navegador (http://127.0.0.1:8765/api/status)
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Acción principal de búsqueda */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(connect)}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors shadow-sm"
                >
                    {busy ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando agente en Windows…
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Conectar y buscar dispositivos
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setShowTokenField(!showTokenField)}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                    {showTokenField ? 'Ocultar token de seguridad' : 'Configurar token de seguridad (opcional)'}
                </button>
            </div>

            {/* Token opcional */}
            {showTokenField && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                    <label className="block font-medium text-slate-700">Token del agente (solo si lo configuraste con seguridad extra en tu PC):</label>
                    <input
                        type="password"
                        autoComplete="off"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Dejar vacío si el agente está en modo predeterminado"
                        className="mt-1 block w-full rounded-md border-slate-300 text-xs px-3 py-1.5"
                    />
                    <p className="text-slate-400">El token se conserva únicamente en la memoria de esta pestaña.</p>
                </div>
            )}

            {/* Mensaje de estado */}
            {message && (
                <div
                    role="status"
                    className={`rounded-lg p-3 text-xs sm:text-sm font-medium ${
                        messageType === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : messageType === 'error'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                >
                    {message}
                </div>
            )}

            {/* Selector de impresora y acciones de prueba */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                    Impresora de este equipo (Tickets ESC/POS)
                    <select
                        value={printer}
                        onChange={(e) => setPrinter(e.target.value)}
                        className="mt-1 block w-full rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">-- Sin impresora seleccionada --</option>
                        {printer && !devices?.printers?.some((p) => p.name === printer) && (
                            <option value={printer}>{printer} (guardada previamente; pendiente de confirmar conexión)</option>
                        )}
                        {(devices?.printers ?? []).map((p) => (
                            <option key={p.name} value={p.name}>
                                {p.name} {p.port ? `(${p.port})` : ''} — {p.type ?? 'Windows'} ({p.status})
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        disabled={busy || !printer}
                        onClick={() =>
                            run(async () => {
                                localStorage.setItem(printerStorageKey(user), printer);
                                setMessage(`✓ Impresora "${printer}" guardada con éxito para este equipo y usuario.`);
                                setMessageType('success');
                            })
                        }
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                    >
                        Guardar impresora
                    </button>

                    <button
                        type="button"
                        disabled={busy || !connected || !printer}
                        onClick={() =>
                            run(async () => {
                                await sendAgentCommand('/api/test', {
                                    printer,
                                    message: 'ERP Bsolutions Finanzas - Prueba de conexion Windows',
                                });
                                setMessage('✓ Prueba enviada al agente con éxito. Por favor comprueba si se imprimió el papel físico.');
                                setMessageType('success');
                            })
                        }
                        className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                        Imprimir prueba física
                    </button>
                </div>

                {devices && (
                    <p className="text-xs text-slate-500 pt-1">
                        Dispositivos detectados: {devices.printers.length} impresora(s) · {devices.bluetoothDevices?.length ?? 0} dispositivo(s) Bluetooth · {devices.serialPorts?.length ?? 0} puerto(s) seriales.
                    </p>
                )}
            </div>
        </section>
    );
}
