export type GraphQLErrorResponse<T = unknown> = {
  errors: T;
}
export type GraphQLSuccessResponse<T = unknown> = {
  data: T;
}
export type GraphQLResponse<T = unknown, U = unknown> = GraphQLSuccessResponse<T> | GraphQLErrorResponse<U>;
