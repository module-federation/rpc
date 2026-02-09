import type { RpcTreaty } from '../../src/typelevel';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false;
type Expect<T extends true> = T;

type Contract = {
  users: {
    ':id': {
      get: {
        params: { id: string };
        response: { 200: { id: string; name: string }; 404: { message: string } };
      };
      posts: {
        get: {
          query: { page?: number };
          response: { 200: { items: string[] } };
        };
      };
    };
    post: {
      body: { name: string };
      response: { 201: { id: string } };
    };
  };
  health: {
    get: {
      response: { 200: { ok: true } };
    };
  };
};

type Client = RpcTreaty.Create<Contract>;

type UsersParam = Parameters<Client['users']>[0];
type _UsersParam = Expect<Equal<UsersParam, { id: string }>>;

type UserGetOptions = NonNullable<Parameters<ReturnType<Client['users']>['get']>[0]>;
type _UserGetOptions = Expect<Equal<UserGetOptions, { params?: { id: string } }>>;

type UserGetResponse = Awaited<ReturnType<ReturnType<Client['users']>['get']>>;
type ExpectedUserGetResponse =
  | { status: 200; body: { id: string; name: string }; headers?: Record<string, string> }
  | { status: 404; body: { message: string }; headers?: Record<string, string> };
type _UserGetResponse = Expect<Equal<UserGetResponse, ExpectedUserGetResponse>>;

type CreateUserOptions = Parameters<Client['users']['post']>[0];
type _CreateUserOptions = Expect<Equal<CreateUserOptions, { body: { name: string } }>>;

type OptionalContract = {
  posts: {
    ':slug?': {
      get: { response: { 200: { slug?: string } } };
    };
  };
};

type OptionalClient = RpcTreaty.Create<OptionalContract>;
type OptionalParams = Parameters<OptionalClient['posts']>[0];
type _OptionalParams = Expect<Equal<OptionalParams, { slug?: string } | undefined>>;
