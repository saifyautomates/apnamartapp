let csrfToken: string | null = null;

/**
 * Fetches and caches the CSRF token for secure mutation requests.
 */
export async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch("/api/auth/csrf");
    const json = await res.json();
    csrfToken = (json.data?.csrfToken as string) ?? "";
    return csrfToken;
  } catch {
    return "";
  }
}

export function clearCsrf(): void {
  csrfToken = null;
}
