import { Script } from 'node:vm';
import { init, loadRemote } from '@module-federation/runtime';
import {
  createInvokeTransport,
  mfRpcClient,
  type RpcInvokeRequest,
  type RpcInvokeResponse,
} from '@module-federation/doc';
import type { Contract } from 'remote/rpc-contract';

type RemoteContractVersion = typeof import('remote/rpc-contract').CONTRACT_VERSION;

const CONTRACT_VERSION: RemoteContractVersion = '0.1.0';

type ScriptElementLike = {
  src?: string;
  onload?: (evt: unknown) => void;
  onerror?: (evt: unknown) => void;
};

const loadBrowserScript = async (url: string, element?: ScriptElementLike) => {
  const response = await fetch(url);
  const code = await response.text();
  const script = new Script(code, { filename: url });
  script.runInThisContext();
  element?.onload?.({ type: 'load', target: element });
};

const setupDomShim = () => {
  if (typeof window !== 'undefined') {
    return;
  }

  const globalWindow = globalThis as unknown as Window & typeof globalThis;
  globalThis.window = globalWindow;
  globalThis.self = globalWindow;
  globalThis.HTMLScriptElement = class {} as unknown as typeof HTMLScriptElement;
  globalThis.HTMLLinkElement = class {} as unknown as typeof HTMLLinkElement;
  globalThis.document = {
    defaultView: globalThis,
    head: {
      appendChild(element: ScriptElementLike) {
        if (element?.src) {
          loadBrowserScript(element.src, element).catch((error) => {
            element?.onerror?.({ type: 'error', target: element, error });
          });
        }
        return element as unknown as Node;
      },
      removeChild() {
        return undefined as unknown as Node;
      },
    },
    createElement() {
      const attrs = new Map<string, string>();
      return {
        attrs,
        setAttribute(name: string, value: string) {
          attrs.set(name, value);
          if (name === 'src') {
            (this as { src?: string }).src = value;
          }
        },
        getAttribute(name: string) {
          return attrs.get(name);
        },
      };
    },
    getElementsByTagName() {
      return [];
    },
  } as unknown as Document;
};

const run = async () => {
  setupDomShim();

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

  if (!runtime) {
    throw new Error('Remote runtime not found');
  }

  const api = mfRpcClient<Contract>({
    transport: createInvokeTransport(runtime),
    contractVersion: CONTRACT_VERSION,
  });

  const response = await api.users({ id: '1' }).get();
  console.log('RPC response', response);
};

run().catch((error) => {
  console.error('RPC error', error);
});
