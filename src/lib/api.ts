import { API_URL } from "@/lib/config";
import type { Cart, CategoryWithCount, Product, ProductDetail, RealtimeConfig, Session, User } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; token?: string };

export function buildRequest(path: string, { method = "GET", body, token }: RequestOptions = {}): { url: string; init: RequestInit } {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return {
    url: `${API_URL}${path}`,
    init: { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
  };
}

export function toApiError(status: number, payload: unknown): ApiError {
  const error = (payload as { error?: { code?: unknown; message?: unknown } } | null)?.error;
  return new ApiError(
    status,
    typeof error?.code === "string" ? error.code : "unknown_error",
    typeof error?.message === "string" ? error.message : "Something went wrong. Please try again.",
  );
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const { url, init } = buildRequest(path, options);
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(0, "network_error", "Can't reach Sigma Gadgets. Check your internet connection.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, payload);
  return payload as T;
}

export function productListPath(category: string | null): string {
  return category ? `/api/v1/products?category=${encodeURIComponent(category)}` : "/api/v1/products";
}

export const api = {
  products: (category: string | null) => request<{ products: Product[] }>(productListPath(category)).then((r) => r.products),
  product: (slug: string) => request<{ product: ProductDetail }>(`/api/v1/products/${encodeURIComponent(slug)}`).then((r) => r.product),
  categories: () => request<{ categories: CategoryWithCount[] }>("/api/v1/categories").then((r) => r.categories),

  exchangeCode: (code: string, codeVerifier: string) =>
    request<Session>("/api/mobile/token", { method: "POST", body: { code, codeVerifier } }),
  me: (token: string) => request<{ user: User }>("/api/v1/me", { token }).then((r) => r.user),
  signOut: (token: string) => request<{ signedOut: boolean }>("/api/v1/session", { method: "DELETE", token }),

  cart: (token: string) => request<{ cart: Cart }>("/api/v1/cart", { token }).then((r) => r.cart),
  addToCart: (token: string, productId: number, quantity: number) =>
    request<{ cart: Cart; message: string }>("/api/v1/cart/items", { method: "POST", token, body: { productId, quantity } }),
  setQuantity: (token: string, productId: number, quantity: number) =>
    request<{ cart: Cart }>(`/api/v1/cart/items/${productId}`, { method: "PATCH", token, body: { quantity } }).then((r) => r.cart),
  removeFromCart: (token: string, productId: number) =>
    request<{ cart: Cart }>(`/api/v1/cart/items/${productId}`, { method: "DELETE", token }).then((r) => r.cart),

  realtime: (token: string) => request<{ realtime: RealtimeConfig | null }>("/api/v1/realtime", { token }).then((r) => r.realtime),
};
