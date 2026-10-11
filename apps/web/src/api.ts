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
  post: <T = any>(path: string, body: unknown) => req<T>(path, { method: "POST", body: JSON.stringify(body) }),
  del: <T = any>(path: string) => req<T>(path, { method: "DELETE" }),
};
