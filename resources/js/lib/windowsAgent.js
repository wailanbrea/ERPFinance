const BASE_URLS = ['http://127.0.0.1:8765', 'http://localhost:8765'];
const ENDPOINTS = new Set(['/api/status', '/api/config', '/api/devices', '/api/printers', '/api/test', '/api/print', '/api/drawer/open']);
let sessionToken = '';
let activeBase = BASE_URLS[0];
let sending = false;

// The terminal secret lives only in memory, never in localStorage or server props.
export function setAgentToken(token) { sessionToken = token.trim(); }

export async function signedHeaders(method, path, token = sessionToken, timestamp = Math.floor(Date.now() / 1000)) {
    const headers = { Accept: 'application/json' };
    if (!token) return headers;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(token), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${method}\n${path}\n${timestamp}`));
    return { ...headers, 'X-Agent-Token': token, 'X-Agent-Timestamp': String(timestamp),
        'X-Agent-Signature': [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('') };
}

export async function agentRequest(path, { method = 'GET', body, timeoutMs = 10000 } = {}) {
    if (!ENDPOINTS.has(path)) throw new Error('Operación de agente no permitida.');
    const headers = await signedHeaders(method, path);
    if (body) headers['Content-Type'] = 'application/json';
    // Only reads may try another address. A lost POST response may already have printed.
    const bases = method === 'GET' ? [activeBase, ...BASE_URLS.filter((url) => url !== activeBase)] : [activeBase];
    for (let i = 0; i < bases.length; i++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        let response;
        try {
            response = await fetch(`${bases[i]}${path}`, {
                method, headers, body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error', targetAddressSpace: 'loopback',
            });
            activeBase = bases[i];
            const data = await response.json();
            if (!response.ok) {
                const reasons = { 401: 'El agente requiere un token válido y el reloj de Windows sincronizado.',
                    403: 'El agente no permite el origen de esta aplicación.', 429: 'El agente recibió demasiadas solicitudes. Espera un momento.' };
                throw new Error(reasons[response.status] || data.message || `Error del agente (${response.status}).`);
            }
            return data;
        } catch (error) {
            if (response) throw error;
            if (i === bases.length - 1) {
                throw new Error(method === 'GET'
                    ? 'No se pudo conectar con BSM-POS Windows Agent (puerto 8765). Verifica que esté iniciado y que el navegador permita acceso a la red local.'
                    : 'No se recibió confirmación del agente. Comprueba la impresora o la gaveta antes de repetir la operación.');
            }
        } finally { clearTimeout(timer); }
    }
}

export async function sendAgentCommand(path, body) {
    if (sending) throw new Error('Ya hay una operación de impresora en curso.');
    if (path === '/api/print' && (typeof body?.content !== 'string' || !body.content.trim() || body.content.length > 8000)) {
        throw new Error('El ticket debe contener entre 1 y 8000 caracteres. Usa el PDF para documentos más largos.');
    }
    sending = true;
    try {
        const data = await agentRequest(path, { method: 'POST', body });
        if (data?.status !== (path === '/api/drawer/open' ? 'opened' : 'printed')) {
            throw new Error(data?.message || 'El agente no confirmó la operación.');
        }
        return data;
    } finally { sending = false; }
}

export function printerStorageKey(user) {
    return `erp.windows-printer.${user?.empresa_id ?? 'none'}.${user?.sucursal_id ?? 'none'}.${user?.id ?? 'guest'}`;
}

export function selectedPrinter(user) {
    try { return localStorage.getItem(printerStorageKey(user)) || ''; } catch { return ''; }
}
