import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { agentRequest, sendAgentCommand, signedHeaders, setAgentToken, printerStorageKey } from '../../resources/js/lib/windowsAgent.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; setAgentToken(''); });

test('signature matches the Kotlin HMAC protocol', async () => {
    const token = 'test-only-secret';
    const headers = await signedHeaders('POST', '/api/print', token, 12345);
    assert.equal(headers['X-Agent-Signature'], createHmac('sha256', token).update('POST\n/api/print\n12345').digest('hex'));
});

test('a lost print response is never retried', async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new TypeError('network'); };
    await assert.rejects(sendAgentCommand('/api/print', { content: 'Ticket', printer: 'Test' }), /antes de repetir/);
    assert.equal(calls, 1);
});

test('printer rejection is shown rather than treated as success', async () => {
    globalThis.fetch = async () => Response.json({ status: 'printer_error', message: 'Sin papel' }, { status: 503 });
    await assert.rejects(sendAgentCommand('/api/print', { content: 'Ticket' }), /Sin papel/);
});

test('long tickets are rejected without truncation or network request', async () => {
    globalThis.fetch = async () => { assert.fail('must not send truncated receipt'); };
    await assert.rejects(sendAgentCommand('/api/print', { content: 'x'.repeat(8001) }), /8000/);
});

test('unauthorized agent response explains token requirement', async () => {
    globalThis.fetch = async () => Response.json({}, { status: 401 });
    await assert.rejects(agentRequest('/api/status'), /token/);
});

test('overlapping device commands are blocked', async () => {
    let resolve;
    globalThis.fetch = () => new Promise((done) => { resolve = done; });
    const first = sendAgentCommand('/api/print', { content: 'Ticket' });
    await assert.rejects(sendAgentCommand('/api/print', { content: 'Ticket' }), /en curso/);
    resolve(Response.json({ status: 'printed' }));
    await first;
});

test('printer selections are isolated by company, branch and user', () => {
    assert.notEqual(printerStorageKey({ id: 1, empresa_id: 1, sucursal_id: 1 }), printerStorageKey({ id: 1, empresa_id: 2, sucursal_id: 1 }));
});
