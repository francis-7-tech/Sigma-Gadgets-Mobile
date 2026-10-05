import Module from "node:module";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { cartRefreshInterval, createChannelAuthorizer, FALLBACK_REFRESH_MS, statusForConnectionState, syncStatusLabel } from "@/lib/cart-sync";

type ModuleLoader = (request: string, ...rest: unknown[]) => unknown;
const nodeModule = Module as unknown as { _load: ModuleLoader };
const originalLoad = nodeModule._load;

beforeAll(() => {
  const netInfo = { fetch: async () => ({ type: "wifi" }), addEventListener: () => () => {} };
  nodeModule._load = function (this: unknown, request, ...rest) {
    if (request === "@react-native-community/netinfo") return { default: netInfo, ...netInfo };
    return originalLoad.call(this, request, ...rest);
  };
});

afterAll(() => {
  nodeModule._load = originalLoad;
});

describe("Pusher import", () => {
  it("gets a real constructor from the React Native build of pusher-js", async () => {
    const { Pusher } = await import("@/lib/pusher");

    expect(typeof Pusher).toBe("function");
    const client = new Pusher("test-key", { cluster: "eu", enabledTransports: [] });
    expect(typeof client.subscribe).toBe("function");
    client.disconnect();
  });

  it("accepts the class as a named or a default export, and rejects anything else", async () => {
    const { resolvePusher } = await import("@/lib/pusher");
    class FakePusher {}

    expect(resolvePusher({ Pusher: FakePusher })).toBe(FakePusher);
    expect(resolvePusher({ default: FakePusher })).toBe(FakePusher);
    expect(resolvePusher({ Pusher: FakePusher, default: { Pusher: FakePusher } })).toBe(FakePusher);
    expect(() => resolvePusher({ default: { Pusher: FakePusher } })).toThrow("did not export a Pusher class");
    expect(() => resolvePusher({})).toThrow();
  });
});

describe("cartRefreshInterval", () => {
  it("never polls while live updates are connected or the user is signed out", () => {
    expect(cartRefreshInterval("live")).toBe(false);
    expect(cartRefreshInterval("off")).toBe(false);
  });

  it("falls back to a slow check only while live updates are down", () => {
    expect(cartRefreshInterval("connecting")).toBe(FALLBACK_REFRESH_MS);
    expect(cartRefreshInterval("unavailable")).toBe(FALLBACK_REFRESH_MS);
    expect(FALLBACK_REFRESH_MS).toBeGreaterThanOrEqual(30_000);
  });
});

describe("statusForConnectionState", () => {
  it("keeps the current status when the socket connects, until the channel is confirmed", () => {
    expect(statusForConnectionState("connected", "connecting")).toBe("connecting");
    expect(statusForConnectionState("connected", "live")).toBe("live");
  });

  it("stops claiming to be live as soon as the connection drops", () => {
    expect(statusForConnectionState("connecting", "live")).toBe("connecting");
    expect(statusForConnectionState("unavailable", "live")).toBe("unavailable");
    expect(statusForConnectionState("failed", "connecting")).toBe("unavailable");
    expect(statusForConnectionState("disconnected", "live")).toBe("unavailable");
  });
});

describe("syncStatusLabel", () => {
  it("says what is really happening", () => {
    expect(syncStatusLabel("live")).toBe("Live: synced with the website");
    expect(syncStatusLabel("connecting")).toBe("Connecting to live updates…");
    expect(syncStatusLabel("unavailable")).toContain("unavailable");
  });
});

describe("createChannelAuthorizer", () => {
  const params = { socketId: "1234.5678", channelName: "private-cart-user-1" };

  it("asks the website for permission with the login token and returns the signature", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ auth: "key:signature" }), { status: 200 }));
    const callback = vi.fn();

    await createChannelAuthorizer("https://shop.test", "TOKEN", fetcher as unknown as typeof fetch)(params, callback);

    expect(fetcher).toHaveBeenCalledExactlyOnceWith("https://shop.test/api/v1/realtime/auth", {
      method: "POST",
      headers: { Authorization: "Bearer TOKEN", "Content-Type": "application/x-www-form-urlencoded" },
      body: "socket_id=1234.5678&channel_name=private-cart-user-1",
    });
    expect(callback).toHaveBeenCalledExactlyOnceWith(null, { auth: "key:signature" });
  });

  it("reports a refusal instead of hiding it", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: { code: "forbidden" } }), { status: 403 }));
    const callback = vi.fn();

    await createChannelAuthorizer("https://shop.test", "TOKEN", fetcher as unknown as typeof fetch)(params, callback);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(callback.mock.calls[0][0].message).toContain("403");
    expect(callback.mock.calls[0][1]).toBeNull();
  });

  it("reports a network failure instead of throwing", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("Network request failed");
    });
    const callback = vi.fn();

    await createChannelAuthorizer("https://shop.test", "TOKEN", fetcher as unknown as typeof fetch)(params, callback);

    expect(callback.mock.calls[0][0].message).toBe("Network request failed");
    expect(callback.mock.calls[0][1]).toBeNull();
  });
});
