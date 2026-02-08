import type { RpcRuntime, RpcTransport } from '../types';

export const createInvokeTransport = (runtime: RpcRuntime): RpcTransport => ({
  contractVersion: runtime.CONTRACT_VERSION,
  invoke: (request) => runtime.invoke(request),
});
