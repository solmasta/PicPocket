// itty-router-extras' `json()` treats its second argument as a full
// ResponseInit object (`{ status, headers }`), not a bare status code, so
// `json(data, 404)` silently ignores the 404 and always responds 200. This
// wrapper keeps the `json(data, status)` call shape used throughout the
// routes while actually setting the response status.
export function json(data, status = 200, init = {}) {
  const { headers = {}, ...rest } = init;
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
    ...rest,
  });
}
