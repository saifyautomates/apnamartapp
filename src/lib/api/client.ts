import { ensureCsrf } from "./csrf";

/**
 * World-class API client that automatically attaches CSRF token and Content-Type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await ensureCsrf();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": token,
      ...(init.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

export * from "./csrf";
