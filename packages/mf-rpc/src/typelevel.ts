import type { HttpMethod, RpcMethod, RpcResponse } from './types';

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type UnionToIntersection<Union> = (
  Union extends unknown ? (argument: Union) => void : never
) extends (argument: infer Intersection) => void
  ? Intersection
  : never;

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type RequestField<Key extends string, Value> = [Value] extends [undefined]
  ? {}
  : undefined extends Value
  ? { [K in Key]?: Value }
  : { [K in Key]: Value };

type OptionalRequestField<Key extends string, Value> = [Value] extends [undefined]
  ? {}
  : { [K in Key]?: Value };

type MethodKeys<Node> = Extract<keyof Node, HttpMethod>;
type ChildKeys<Node> = Exclude<keyof Node, HttpMethod>;
type DynamicChildKeys<Node> = Extract<ChildKeys<Node>, `:${string}`>;
type StaticChildKeys<Node> = Exclude<ChildKeys<Node>, `:${string}`>;

type ChildNode<Node, Key extends keyof Node> = Node[Key] extends RpcMethod
  ? never
  : Node[Key];

type MethodParamsUnion<Node> = {
  [Key in MethodKeys<Node>]: Node[Key] extends RpcMethod ? Node[Key]['params'] : never;
}[MethodKeys<Node>];

type ParamTypeFromMethods<Node, ParamName extends string> =
  MethodParamsUnion<Node> extends infer Params
    ? Params extends Record<string, unknown>
      ? ParamName extends keyof Params
        ? Params[ParamName]
        : never
      : never
    : never;

type SegmentParam<Node, Segment extends string> = Segment extends `:${infer Name}?`
  ? { [Key in Name]?: ParamTypeFromMethods<Node, Name> extends never ? string : ParamTypeFromMethods<Node, Name> }
  : Segment extends `:${infer Name}`
  ? { [Key in Name]: ParamTypeFromMethods<Node, Name> extends never ? string : ParamTypeFromMethods<Node, Name> }
  : {};

type MergeParams<PathParams, MethodParams> = [MethodParams] extends [undefined]
  ? PathParams
  : [PathParams] extends [undefined]
  ? MethodParams
  : Simplify<Omit<PathParams, keyof MethodParams> & MethodParams>;

type IsEmptyObject<T> = T extends object ? (keyof T extends never ? true : false) : false;

type NormalizedParams<PathParams, MethodParams> = MergeParams<
  PathParams,
  MethodParams
> extends infer Combined
  ? IsEmptyObject<Combined> extends true
    ? undefined
    : Combined
  : undefined;

type MethodBody<Method> = Method extends { body: infer Body } ? Body : undefined;
type MethodQuery<Method> = Method extends { query: infer Query } ? Query : undefined;
type MethodHeaders<Method> = Method extends { headers: infer Headers } ? Headers : undefined;
type MethodParams<Method> = Method extends { params: infer Params } ? Params : undefined;

export type RpcRequestOptions<Method extends RpcMethod, PathParams> = Simplify<
  OptionalRequestField<'params', NormalizedParams<PathParams, MethodParams<Method>>> &
    RequestField<'query', MethodQuery<Method>> &
    RequestField<'headers', MethodHeaders<Method>> &
    RequestField<'body', MethodBody<Method>>
>;

type RpcResponseFor<Method extends RpcMethod> = Method extends {
  response: infer Responses extends Record<number, unknown>;
}
  ? RpcResponse<Responses>
  : never;

type MethodCall<Method extends RpcMethod, PathParams> =
  RequiredKeys<RpcRequestOptions<Method, PathParams>> extends never
    ? (options?: RpcRequestOptions<Method, PathParams>) => Promise<RpcResponseFor<Method>>
    : (options: RpcRequestOptions<Method, PathParams>) => Promise<RpcResponseFor<Method>>;

type ParamStep<Node, PathParams> = DynamicChildKeys<Node> extends never
  ? {}
  : UnionToIntersection<
      {
        [Segment in DynamicChildKeys<Node>]: (
          params: SegmentParam<ChildNode<Node, Segment>, Segment>
        ) => RpcProxy<
          ChildNode<Node, Segment>,
          Simplify<PathParams & SegmentParam<ChildNode<Node, Segment>, Segment>>
        >;
      }[DynamicChildKeys<Node>]
    >;

export type RpcProxy<Node, PathParams> = {
  [Method in MethodKeys<Node>]: Node[Method] extends RpcMethod
    ? MethodCall<Node[Method], PathParams>
    : never;
} & {
  [Segment in StaticChildKeys<Node>]: RpcProxy<ChildNode<Node, Segment>, PathParams>;
} & {
  [Segment in DynamicChildKeys<Node>]: RpcProxy<
    ChildNode<Node, Segment>,
    Simplify<PathParams & SegmentParam<ChildNode<Node, Segment>, Segment>>
  >;
} & ParamStep<Node, PathParams> & {
  then?: never;
};

export namespace RpcTreaty {
  export type Create<Contract> = RpcProxy<Contract, {}>;
  export type Sign<Route> = RpcProxy<Route, {}>;
}
