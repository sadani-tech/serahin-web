import { cookies, headers as requestHeaders } from "next/headers";
import { randomUUID } from "node:crypto";

/**
 * Klien REST server-side untuk backend NestJS (menggantikan akses Prisma
 * langsung). Token JWT dibaca dari cookie httpOnly `token`.
 *
 * PENTING: modul ini hanya boleh diimpor dari Server Component / Server
 * Action / Route Handler. Cookie `token` bertanda httpOnly sehingga TIDAK
 * bisa dibaca lewat `document.cookie` di client — jangan tambahkan cabang
 * "client-side" di sini, itu tidak akan pernah membawa token.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 15_000);
export const TOKEN_COOKIE = "token";

function requestSignal(): AbortSignal | undefined {
  return Number.isFinite(API_TIMEOUT_MS) && API_TIMEOUT_MS > 0
    ? AbortSignal.timeout(API_TIMEOUT_MS)
    : undefined;
}

async function authHeader(): Promise<Record<string, string>> {
  const [store, incoming] = await Promise.all([cookies(), requestHeaders()]);
  const token = store.get(TOKEN_COOKIE)?.value;
  const forwarded =
    incoming.get("x-forwarded-for") ??
    incoming.get("x-real-ip") ??
    incoming.get("cf-connecting-ip");
  const clientIp = forwarded?.split(",")[0]?.trim().slice(0, 64);
  const requestId = incoming.get("x-request-id")?.trim() || randomUUID();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(clientIp ? { "X-Forwarded-For": clientIp } : {}),
    "X-Request-Id": requestId.slice(0, 80),
  };
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

/** Map the admin route name to the canonical Architecture v2 API resource. */
function apiPath(path: string): string {
  return path === "/pre-orders" || path.startsWith("/pre-orders/")
    ? path.replace("/pre-orders", "/preorder-campaigns")
    : path;
}

export const api = {
  async get<T>(path: string, query?: Query): Promise<T> {
    const res = await fetch(`${API_URL}${withQuery(apiPath(path), query)}`, {
      headers: { ...(await authHeader()) },
      cache: "no-store",
      signal: requestSignal(),
    });
    return parse(res) as Promise<T>;
  },

  /**
   * GET endpoint daftar berpaginasi. Backend membungkus hasil dalam envelope
   * `{ data, meta }` (lihat `apps/api/src/common/query.ts`), tapi halaman admin
   * hanya butuh array-nya — helper ini mengembalikan `data` langsung.
   */
  async list<T>(path: string, query?: Query): Promise<T[]> {
    const res = await api.get<{ data: T[] }>(path, query);
    return res.data;
  },

  /**
   * Ambil SELURUH baris dari endpoint berpaginasi, bukan hanya halaman
   * pertama (default backend `limit=20`, maksimum 100/request). Dipakai
   * untuk sumber dropdown/filter yang wajib menampilkan semua opsi, mis.
   * daftar Batch PO pada filter dashboard (v2.3.7 FR-37.26) — bukan untuk
   * tabel besar yang memang seharusnya dipaginasi di UI.
   */
  async listAll<T>(path: string, query?: Query): Promise<T[]> {
    const limit = 100;
    const first = await api.get<{ data: T[]; meta: { totalPages: number } }>(
      path,
      { ...query, page: 1, limit },
    );
    const all = [...first.data];
    const totalPages = Math.min(first.meta.totalPages ?? 1, 50); // batas aman
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await api.get<{ data: T[] }>(path, { ...query, page, limit });
      all.push(...next.data);
    }
    return all;
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${apiPath(path)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: requestSignal(),
    });
    return parse(res) as Promise<T>;
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${apiPath(path)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: requestSignal(),
    });
    return parse(res) as Promise<T>;
  },

  async del<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${apiPath(path)}`, {
      method: "DELETE",
      headers: { ...(await authHeader()) },
      cache: "no-store",
    });
    return parse(res) as Promise<T>;
  },

  async deletePreorder(id: string) {
    return api.del(`/pre-orders/${id}`);
  },

  /** POST multipart (upload file). `form` sudah berisi field + file. */
  async postForm<T>(path: string, form: FormData): Promise<T> {
    const res = await fetch(`${API_URL}${apiPath(path)}`, {
      method: "POST",
      headers: { ...(await authHeader()) },
      body: form,
      cache: "no-store",
    });
    return parse(res) as Promise<T>;
  },

  /** Proxy unduhan file dari backend (bawa token server-side) → Response. */
  async download(path: string, query?: Query): Promise<Response> {
    return fetch(`${API_URL}${withQuery(apiPath(path), query)}`, {
      headers: { ...(await authHeader()) },
      cache: "no-store",
    });
  },
};

export const PUBLIC_API_URL = API_URL;
