export const HTTP_HEADER = { "Content-Type": "application/json" }

export enum HttpMethod {
  PUT = "PUT",
  POST = "POST",
  GET = "GET",
  DELETE = "DELETE",
}

export enum HttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}
