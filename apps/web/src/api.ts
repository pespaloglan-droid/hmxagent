/** /api/* istemcisi — tum sayfalar bunu kullanir */
async function req<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => req<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    req<T>(path, { method: "POST", body: JSON.stringify(body) }),
  del: <T = any>(path: string) => req<T>(path, { method: "DELETE" }),
};

/** SSE transport; JSON istekleri gibi ortak hata sınırı. */
export async function apiStream(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }
  if (!response.body) throw new Error("Akış gövdesi boş.");
  return response;
}
