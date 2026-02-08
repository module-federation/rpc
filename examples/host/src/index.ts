import { init, loadRemote } from '@module-federation/runtime';
import {
  createInvokeTransport,
  mfRpcClient,
  type RpcInvokeRequest,
  type RpcInvokeResponse,
} from '@module-federation/mf-rpc';
import type { Contract } from 'remote/rpc-contract';

type RemoteContractVersion = typeof import('remote/rpc-contract').CONTRACT_VERSION;

const CONTRACT_VERSION: RemoteContractVersion = '0.1.0';

const run = async () => {
  init({
    name: 'host',
    remotes: [
      {
        name: 'remote',
        alias: 'remote',
        entry: 'http://localhost:3001/remoteEntry.js',
      },
    ],
  });

  const runtime = await loadRemote<{
    CONTRACT_VERSION: string;
    invoke(request: RpcInvokeRequest): Promise<RpcInvokeResponse>;
  }>('remote/rpc-runtime');

  const api = mfRpcClient<Contract>({
    transport: createInvokeTransport(runtime),
    contractVersion: CONTRACT_VERSION,
  });

  const response = await api.users({ id: '1' }).get();
  if (typeof document !== 'undefined') {
    const output = document.getElementById('rpc-output');
    if (output) {
      output.textContent = JSON.stringify(response, null, 2);
    }
  }
  console.log('RPC response', response);
};

run().catch((error) => {
  console.error('RPC error', error);
});
