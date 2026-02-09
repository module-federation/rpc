import { describe, expect, it, vi } from 'vitest';
import {
  createFetchTransport,
  createHandleTransport,
  createInvokeTransport,
  mfRpcClient,
  type RpcInvokeRequest,
} from '../../src/index';

type Contract = {
  users: {
    ':id': {
      post: {
        body: { name: string };
        response: { 201: { ok: true } };
      };
    };
  };
};

describe('mfRpcClient', () => {
  it('builds invoke requests from param steps', async () => {
    let lastRequest: RpcInvokeRequest | undefined;
    const runtime = {
      CONTRACT_VERSION: '0.1.0',
      invoke: async (request: RpcInvokeRequest) => {
        lastRequest = request;
        return { status: 201, body: { wrapped: { ok: true } } };
      },
    };

    const transformer = {
      serialize: (data: unknown) => ({ wrapped: data }),
      deserialize: (data: unknown) => (data as { wrapped: unknown }).wrapped,
    };

    const api = mfRpcClient<Contract>({
      transport: createInvokeTransport(runtime),
      contractVersion: '0.1.0',
      transformer,
    });

    const response = await api.users({ id: '123' }).post({ body: { name: 'Ada' } });

    expect(lastRequest).toEqual({
      method: 'POST',
      path: '/users/123',
      headers: undefined,
      query: undefined,
      body: { wrapped: { name: 'Ada' } },
    });
    expect(response).toEqual({
      status: 201,
      headers: undefined,
      body: { ok: true },
    });
  });

  it('throws on contract version mismatch', () => {
    const runtime = {
      CONTRACT_VERSION: '0.9.0',
      invoke: async () => ({ status: 200, body: {} }),
    };

    expect(() =>
      mfRpcClient<Contract>({
        transport: createInvokeTransport(runtime),
        contractVersion: '0.1.0',
      })
    ).toThrow(/contract version mismatch/i);
  });
});

describe('transports', () => {
  it('uses fetch transport for network calls', async () => {
    const fetchSpy = vi.fn(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-test': '1' },
      });
    });

    const transport = createFetchTransport('https://example.com', { fetch: fetchSpy });
    const response = await transport.invoke({
      method: 'POST',
      path: '/ping',
      query: { page: 1 },
      headers: { 'x-client': 'mf' },
      body: { hello: 'world' },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://example.com/ping?page=1');
    expect(init?.method).toBe('POST');

    const headers = new Headers(init?.headers);
    expect(headers.get('x-client')).toBe('mf');
    expect(headers.get('content-type')).toBe('application/json');
    expect(init?.body).toBe(JSON.stringify({ hello: 'world' }));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(response.headers?.['x-test']).toBe('1');
  });

  it('uses handle transport for in-process handlers', async () => {
    let receivedUrl: string | undefined;
    let receivedMethod: string | undefined;

    const runtime = {
      CONTRACT_VERSION: '0.1.0',
      handle: async (request: Request) => {
        receivedUrl = request.url;
        receivedMethod = request.method;
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    };

    const transport = createHandleTransport(runtime, { baseUrl: 'https://local.test' });
    const response = await transport.invoke({
      method: 'GET',
      path: '/status',
      query: { ping: 'pong' },
    });

    expect(receivedUrl).toBe('https://local.test/status?ping=pong');
    expect(receivedMethod).toBe('GET');
    expect(response.body).toEqual({ ok: true });
  });
});
