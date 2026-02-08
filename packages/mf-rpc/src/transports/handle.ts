import type { RpcInvokeResponse, RpcTransport } from '../types';
import {
  DEFAULT_BASE_URL,
  buildRequestInit,
  buildUrl,
  responseToInvokeResponse,
} from './utils';

export type HandleRuntime = {
  handle(request: Request): Promise<Response>;
  CONTRACT_VERSION?: string;
};

export type HandleTransportOptions = {
  baseUrl?: string;
};

export const createHandleTransport = (
  runtime: HandleRuntime,
  options: HandleTransportOptions = {}
): RpcTransport => {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  return {
    contractVersion: runtime.CONTRACT_VERSION,
    invoke: async (request): Promise<RpcInvokeResponse> => {
      const url = buildUrl(baseUrl, request.path, request.query);
      const init = buildRequestInit(request);
      const response = await runtime.handle(new Request(url, init));
      return responseToInvokeResponse(response);
    },
  };
};
