# Module Federation Doc

Type-safe RPC contracts and transports for Module Federation runtimes. This package helps you
define a shared contract, validate versions between host and remote, and call remote procedures
with strong typing.

## Installation

```bash
pnpm add @module-federation/doc
```

## Usage

### Define a contract in the remote

```ts
export type Contract = {
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
```

### Implement a runtime in the remote

```ts
import type { RpcInvokeRequest, RpcInvokeResponse, RpcRuntime } from '@module-federation/doc';

export const CONTRACT_VERSION = '0.1.0';

export const invoke: RpcRuntime['invoke'] = async (
  request: RpcInvokeRequest
): Promise<RpcInvokeResponse> => {
  if (request.method === 'GET' && request.path === '/users/1') {
    return { status: 200, body: { id: '1', name: 'Ada' } };
  }

  return { status: 404, body: { message: 'Not found' } };
};
```

### Consume from the host

```ts
import { init, loadRemote } from '@module-federation/runtime';
import {
  createInvokeTransport,
  mfRpcClient,
  type RpcInvokeRequest,
  type RpcInvokeResponse,
} from '@module-federation/doc';
import type { Contract } from 'remote/rpc-contract';

type RemoteRuntime = {
  CONTRACT_VERSION: string;
  invoke(request: RpcInvokeRequest): Promise<RpcInvokeResponse>;
};

init({
  name: 'host',
  remotes: [{ name: 'remote', alias: 'remote', entry: 'http://localhost:3001/remoteEntry.js' }],
});

const runtime = await loadRemote<RemoteRuntime>('remote/rpc-runtime');

const api = mfRpcClient<Contract>({
  transport: createInvokeTransport(runtime),
  contractVersion: runtime.CONTRACT_VERSION,
});

const response = await api.users({ id: '1' }).get();
```

### Contract version checks

`mfRpcClient` validates the host/remote `contractVersion` and throws if they do not match. Export
`CONTRACT_VERSION` from your remote and pass it to the host to keep contracts in sync.

## Transports

| Transport | Use case |
| --- | --- |
| `createInvokeTransport` | Use when you can call the remote `invoke` function directly (Module Federation runtime). |
| `createHandleTransport` | Use when you have a Fetch-style `handle(request)` method. |
| `createFetchTransport` | Use when you need to call over the network with `fetch`. |

## Examples

```bash
# build the remote + host and run the node-based host example
pnpm test:e2e

# run each example in dev mode
pnpm --filter @module-federation/doc-remote-example dev
pnpm --filter @module-federation/doc-host-example dev
```

## Development scripts

```bash
pnpm -r build
pnpm -r typecheck
pnpm -r test
```