export type JsonErrorResponseOptions<TCode extends string = string> = {
  status: number;
  code: TCode;
  message: string;
  headers?: HeadersInit;
  details?: Record<string, unknown>;
};

function createHeaders(headers?: HeadersInit): Headers {
  return new Headers(headers);
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = createHeaders(init.headers);

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function jsonError<TCode extends string>(
  options: JsonErrorResponseOptions<TCode>,
): Response {
  const { status, code, message, headers, details } = options;
  const responseHeaders = createHeaders(headers);

  if (!responseHeaders.has("cache-control")) {
    responseHeaders.set("cache-control", "no-store");
  }

  return json(
    {
      ok: false,
      code,
      message,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: responseHeaders,
    },
  );
}
