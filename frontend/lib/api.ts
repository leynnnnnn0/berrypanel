const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

type ApiOptions = RequestInit & { skipAuth?: boolean };

export function storeAuthToken(token?: string) {
  if (!token || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("berrypanel_auth_token", token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("berrypanel_auth_token");
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("berrypanel_auth_token")
      : null;

  const res = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && !options.skipAuth
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (res.status === 401) {
    clearAuthToken();
    // Token expired or invalid — redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthenticated");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? "API error");
  }

  return res.json();
}
