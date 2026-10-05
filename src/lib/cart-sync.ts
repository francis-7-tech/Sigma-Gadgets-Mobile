export type SyncStatus = "off" | "connecting" | "live" | "unavailable";

export const FALLBACK_REFRESH_MS = 30_000;

export function cartRefreshInterval(status: SyncStatus): number | false {
  return status === "connecting" || status === "unavailable" ? FALLBACK_REFRESH_MS : false;
}

export function statusForConnectionState(state: string, previous: SyncStatus): SyncStatus {
  if (state === "connected") return previous;
  return state === "connecting" || state === "initialized" ? "connecting" : "unavailable";
}

export function syncStatusLabel(status: SyncStatus): string {
  if (status === "live") return "Live: synced with the website";
  if (status === "unavailable") return "Live updates unavailable. Pull down to refresh.";
  return "Connecting to live updates…";
}

type AuthorizerParams = { socketId: string; channelName: string };
type AuthorizerCallback = (error: Error | null, authData: { auth: string } | null) => void;

export function createChannelAuthorizer(apiUrl: string, token: string, fetcher: typeof fetch = fetch) {
  return async function authorizeChannel({ socketId, channelName }: AuthorizerParams, callback: AuthorizerCallback): Promise<void> {
    try {
      const response = await fetcher(`${apiUrl}/api/v1/realtime/auth`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: `socket_id=${encodeURIComponent(socketId)}&channel_name=${encodeURIComponent(channelName)}`,
      });
      const payload = (await response.json().catch(() => null)) as { auth?: unknown } | null;
      if (!response.ok || typeof payload?.auth !== "string") {
        callback(new Error(`The server refused live updates (${response.status})`), null);
        return;
      }
      callback(null, { auth: payload.auth });
    } catch (error) {
      callback(error instanceof Error ? error : new Error("Could not reach the server for live updates"), null);
    }
  };
}
