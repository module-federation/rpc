import type {
  HttpMethod,
  RpcClientOptions,
  RpcInvokeRequest,
  RpcResponse,
  Transformer,
} from './types';
import type { RpcTreaty } from './typelevel';

const DEFAULT_TRANSFORMER: Transformer = {
  serialize: (data) => data,
  deserialize: (data) => data,
};

const HTTP_METHODS: HttpMethod[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'connect',
];

const METHOD_SET = new Set<string>(HTTP_METHODS);

type ProxyContext = {
  segments: string[];
  params: Record<string, unknown>;
};

type CallHandler = (context: ProxyContext, args: unknown[]) => unknown;

const createRecursiveProxy = (context: ProxyContext, handler: CallHandler): unknown =>
  new Proxy(() => undefined, {
    get(_target, prop) {
      if (prop === 'then') {
        return undefined;
      }

      if (typeof prop !== 'string') {
        return undefined;
      }

      return createRecursiveProxy(
        {
          segments: [...context.segments, prop],
          params: context.params,
        },
        handler
      );
    },
    apply(_target, _thisArg, argArray) {
      return handler(context, argArray);
    },
  });

const isMethodSegment = (segment: string | undefined): segment is HttpMethod =>
  typeof segment === 'string' && METHOD_SET.has(segment);

const encodePath = (segments: string[], params: Record<string, unknown>) => {
  const pathSegments: string[] = [];

  for (const segment of segments) {
    if (segment.startsWith(':')) {
      const rawName = segment.slice(1);
      const name = rawName.endsWith('?') ? rawName.slice(0, -1) : rawName;
      const value = params[name];

      if (value === undefined || value === null) {
        continue;
      }

      pathSegments.push(encodeURIComponent(String(value)));
      continue;
    }

    pathSegments.push(encodeURIComponent(segment));
  }

  return `/${pathSegments.join('/')}`;
};

const normalizeMethod = (method: string) => method.toUpperCase();

export const assertContractVersion = (
  expected: string | undefined,
  actual: string | undefined,
  remoteName?: string
) => {
  if (!expected || !actual || expected === actual) {
    return;
  }

  const target = remoteName ? ` for ${remoteName}` : '';
  throw new Error(
    `MF RPC contract version mismatch${target}. Expected "${expected}", received "${actual}".`
  );
};

const buildInvokeRequest = (
  context: ProxyContext,
  method: HttpMethod,
  options: Record<string, unknown>,
  transformer: Transformer
): RpcInvokeRequest => {
  const params = {
    ...context.params,
    ...(typeof options.params === 'object' && options.params ? options.params : {}),
  } as Record<string, unknown>;

  const query = options.query ? transformer.serialize(options.query) : undefined;
  const body = options.body !== undefined ? transformer.serialize(options.body) : undefined;

  return {
    method: normalizeMethod(method),
    path: encodePath(context.segments, params),
    headers: options.headers as Record<string, string> | undefined,
    query: query as Record<string, unknown> | undefined,
    body,
  };
};

const buildParamStep = (
  context: ProxyContext,
  paramsArg: unknown,
  handler: CallHandler
) => {
  const params =
    paramsArg && typeof paramsArg === 'object' ? (paramsArg as Record<string, unknown>) : {};
  const keys = Object.keys(params);

  if (keys.length === 0) {
    return createRecursiveProxy(context, handler);
  }

  if (keys.length > 1) {
    throw new Error(
      `MF RPC param step expects a single param key, received ${keys.length}.`
    );
  }

  const key = keys[0];
  return createRecursiveProxy(
    {
      segments: [...context.segments, `:${key}`],
      params: {
        ...context.params,
        [key]: params[key],
      },
    },
    handler
  );
};

export const mfRpcClient = <Contract>(
  options: RpcClientOptions
): RpcTreaty.Create<Contract> => {
  const transformer = options.transformer ?? DEFAULT_TRANSFORMER;
  const transport = options.transport;

  assertContractVersion(options.contractVersion, transport.contractVersion);

  const handler: CallHandler = (context, args) => {
    const lastSegment = context.segments[context.segments.length - 1];

    if (!isMethodSegment(lastSegment)) {
      return buildParamStep(context, args[0], handler);
    }

    const request = buildInvokeRequest(
      {
        segments: context.segments.slice(0, -1),
        params: context.params,
      },
      lastSegment,
      (args[0] ?? {}) as Record<string, unknown>,
      transformer
    );

    return transport.invoke(request).then((response) => {
      const body = transformer.deserialize(response.body);
      return {
        status: response.status,
        headers: response.headers,
        body,
      } as RpcResponse<Record<number, unknown>>;
    });
  };

  return createRecursiveProxy({ segments: [], params: {} }, handler) as RpcTreaty.Create<Contract>;
};
