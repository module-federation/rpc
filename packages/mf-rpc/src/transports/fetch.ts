import type { RpcInvokeResponse, RpcTransport } from '../types';
import { buildRequestInit, buildUrl, responseToInvokeResponse, type FetchLike } from './utils';

export type FetchTransportOptions = {
  fetch?: FetchLike;
};

export const createFetchTransport = (
  baseUrl: string,
  options: FetchTransportOptions = {}
): RpcTransport => {
  const fetcher = options.fetch ?? fetch;

  return {
    invoke: async (request): Promise<RpcInvokeResponse> => {
      const url = buildUrl(baseUrl, request.path, request.query);
      const init = buildRequestInit(request);
      const response = await fetcher(url, init);
      return responseToInvokeResponse(response);
    },
  };
};
