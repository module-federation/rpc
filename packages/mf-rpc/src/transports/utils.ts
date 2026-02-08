import type { RpcInvokeRequest, RpcInvokeResponse } from '../types';

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export const DEFAULT_BASE_URL = 'http://mf-rpc.local';

const appendQueryValue = (searchParams: URLSearchParams, key: string, value: unknown) => {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      appendQueryValue(searchParams, key, entry);
    }
    return;
  }

  if (typeof value === 'object') {
    searchParams.append(key, JSON.stringify(value));
    return;
  }

  searchParams.append(key, String(value));
};

export const buildUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, unknown>
) => {
  const url = new URL(path, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      appendQueryValue(url.searchParams, key, value);
    }
  }

  return url.toString();
};

export const buildRequestInit = (request: RpcInvokeRequest): RequestInit => {
  const headers = new Headers(request.headers ?? {});
  let body: string | undefined;

  if (request.body !== undefined) {
    body = JSON.stringify(request.body);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }

  return {
    method: request.method,
    headers,
    body,
  };
};

const headersToRecord = (headers: Headers) => {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
};

export const responseToInvokeResponse = async (
  response: Response
): Promise<RpcInvokeResponse> => {
  const contentType = response.headers.get('content-type') ?? '';
  let body: unknown = undefined;

  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    const text = await response.text();
    body = text.length ? text : undefined;
  }

  return {
    status: response.status,
    headers: headersToRecord(response.headers),
    body,
  };
};
