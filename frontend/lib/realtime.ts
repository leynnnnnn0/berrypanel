import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echo: Echo<"reverb"> | null = null;

export function deploymentEcho() {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_REVERB_APP_KEY) return null;
  if (echo) return echo;
  window.Pusher = Pusher;
  const token = window.localStorage.getItem("berrypanel_auth_token");
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 80),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiUrl}/broadcasting/auth`,
    auth: { headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" } },
  });
  return echo;
}

declare global { interface Window { Pusher: typeof Pusher; } }
