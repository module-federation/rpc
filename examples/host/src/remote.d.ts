declare module 'remote/rpc-contract' {
  export const CONTRACT_VERSION: string;

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
}
