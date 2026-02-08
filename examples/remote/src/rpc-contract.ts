import type { RpcContract } from '@module-federation/mf-rpc';
import { CONTRACT_VERSION } from './contractVersion';

export type Contract = RpcContract & {
  users: {
    post: {
      body: { name: string };
      response: { 201: { id: string } };
    };
    ':id': {
      get: {
        params: { id: string };
        response: {
          200: { id: string; name: string };
          404: { message: string };
        };
      };
    };
  };
};

export { CONTRACT_VERSION };
