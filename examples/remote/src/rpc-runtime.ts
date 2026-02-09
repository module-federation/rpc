import type { RpcInvokeRequest, RpcInvokeResponse, RpcRuntime } from '@module-federation/doc';
import { CONTRACT_VERSION } from './contractVersion';

type User = { id: string; name: string };

const users = new Map<string, User>([['1', { id: '1', name: 'Ada' }]]);
let nextId = 2;

const parsePath = (path: string) => path.split('/').filter(Boolean);

export const invoke: RpcRuntime['invoke'] = async (
  request: RpcInvokeRequest
): Promise<RpcInvokeResponse> => {
  const [resource, id] = parsePath(request.path);
  const method = request.method.toUpperCase();

  if (resource === 'users' && method === 'GET' && id) {
    const user = users.get(decodeURIComponent(id));
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }

    return { status: 200, body: user };
  }

  if (resource === 'users' && method === 'POST') {
    const payload =
      typeof request.body === 'object' && request.body ? (request.body as { name?: string }) : {};
    const name = payload.name ?? 'Unknown';
    const idValue = String(nextId++);
    const user = { id: idValue, name };
    users.set(idValue, user);
    return { status: 201, body: { id: user.id } };
  }

  return { status: 404, body: { message: 'Not found' } };
};

export { CONTRACT_VERSION };
