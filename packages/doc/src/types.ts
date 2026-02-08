export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'
  | 'connect';

export type RpcMethod = {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  body?: unknown;
  response: Record<number, unknown>;
};

export type RpcMethodMap = {
  [Method in HttpMethod]?: RpcMethod;
};

export type RpcContract = RpcMethodMap & {
  [segment: string]: RpcContract | RpcMethod | undefined;
};

export type RpcInvokeRequest = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: unknown;
};

export type RpcInvokeResponse = {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
};

export type RpcRuntime = {
  CONTRACT_VERSION: string;
  invoke(req: RpcInvokeRequest): Promise<RpcInvokeResponse>;
};

export type Transformer = {
  serialize(data: unknown): unknown;
  deserialize(data: unknown): unknown;
};

export type RpcTransport = {
  invoke(req: RpcInvokeRequest): Promise<RpcInvokeResponse>;
  contractVersion?: string;
};

export type RpcClientOptions = {
  transport: RpcTransport;
  transformer?: Transformer;
  contractVersion?: string;
};

type StatusKey = number | `${number}`;

export type RpcResponse<Responses extends Record<number, unknown>> = {
  [Status in keyof Responses & StatusKey]: {
    status: Status extends `${infer Code extends number}` ? Code : Status;
    body: Responses[Status];
    headers?: Record<string, string>;
  };
}[keyof Responses & StatusKey];
