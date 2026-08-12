

/**
 * Klien REST untuk backend NestJS (menggantikan akses Prisma langsung).
 * Token JWT dibaca dari cookie httpOnly `token`.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";
export const TOKEN_COOKIE = "token";

// Server-side auth (for SSR pages)
async function serverAuthHeader(): Promise<Record<string, string> | null> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const token = store.get(TOKEN_COOKIE)?.value;
    return token ? { Authorization: `Bearer ${token}` } : null;
  } catch {
    return null;
  }
}

// Client-side auth (for CSR pages)
async function clientAuthHeader(): Promise<Record<string, string> | null> {
  try {
    const token = typeof document !== "undefined" 
      ? document.cookie.split("; ").find(row => row.startsWith(`${TOKEN_COOKIE}=`))?.split("=")[1]
      : null;
    return token ? { Authorization: `Bearer ${token}` } : null;
  } catch {
    return null;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const token = typeof window !== "undefined" 
    ? document?.cookie?.split("; ").find(row => row.startsWith(`${TOKEN_COOKIE}=`))?.split("=")[1]
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const b = body as { message?: string | string[]; error?: string } | null;
    const msg = Array.isArray(b?.message)
      ? b.message.join(", ")
      : (b?.message ?? b?.error ?? `HTTP ${res.status}`);
    throw new ApiError(msg, res.status);
  }
  return body;
}

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  async get<T>(path: string, query?: Query): Promise<T> {
    const res = await fetch(`${API_URL}${withQuery(path, query)}`, {
      headers: { ...(await authHeader()) },
      cache: "no-store",
    });
    return parse(res) as Promise<T>;
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    return parse(res) as Promise<T>;
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    return parse(res) as Promise<T>;
  },

  async del<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: { ...(await authHeader()) },
      cache: "no-store",
    });
    return parse(res) as Promise<T>;
  },

  async deleteCampaign(id: string) {
    return api.del(`/kampanye/${id}`);
  },

  /** POST multipart (upload file). `form` sudah berisi field + file. */
  async postForm<T>(path: string, form: FormData): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { ...(await authHeader()) },
      body: form,
      cache: "no-store",
    });
    return parse(res) as Promise<T>;
  },

  /** Proxy unduhan file dari backend (bawa token server-side) → Response. */
  async download(path: string, query?: Query): Promise<Response> {
    return fetch(`${API_URL}${withQuery(path, query)}`, {
      headers: { ...(await authHeader()) },
      cache: "no-store",
    });
  },
};

export const PUBLIC_API_URL = API_URL;
