const API_BASE = "/api";

const TOKEN_KEY = "iscms_access_token";

let accessToken: string | null = null;

try {
  accessToken = localStorage.getItem(TOKEN_KEY);
} catch {
  accessToken = null;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode / SSR */
    }
  } else {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  // Binary download (e.g. ISO/IEC 19794 .bir fingerprint files) — returns the raw blob.
  getBlob: async (path: string): Promise<{ blob: Blob; filename: string }> => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE}${path}`, { method: "GET", headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    const blob = await res.blob();
    let filename = "download";
    const cd = res.headers.get("Content-Disposition");
    if (cd) {
      const m = /filename="?([^"]+)"?/.exec(cd);
      if (m) filename = m[1];
    }
    return { blob, filename };
  },
};
