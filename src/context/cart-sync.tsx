import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import { createChannelAuthorizer, statusForConnectionState, type SyncStatus } from "@/lib/cart-sync";
import { API_URL } from "@/lib/config";
import { Pusher, type PusherInstance } from "@/lib/pusher";
import { refreshCart } from "@/lib/query-client";

const CartSyncContext = createContext<SyncStatus>("off");

export function CartSyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const token = session?.token;
  const [status, setStatus] = useState<SyncStatus>("connecting");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let pusher: PusherInstance | null = null;

    function fail(reason: unknown) {
      console.warn("[cart-sync] Live updates unavailable:", reason);
      if (!cancelled) setStatus("unavailable");
    }

    async function connect(activeToken: string) {
      const config = await api.realtime(activeToken);
      if (cancelled) return;
      if (!config) {
        fail("the server has live updates switched off");
        return;
      }

      pusher = new Pusher(config.key, {
        cluster: config.cluster,
        forceTLS: true,
        channelAuthorization: { customHandler: createChannelAuthorizer(API_URL, activeToken) },
      });

      const channel = pusher.subscribe(config.channel);
      channel.bind(config.event, refreshCart);
      channel.bind("pusher:subscription_succeeded", () => {
        setStatus("live");
        refreshCart();
      });
      channel.bind("pusher:subscription_error", fail);
      pusher.connection.bind("error", (error: unknown) => console.warn("[cart-sync] Connection error:", error));
      pusher.connection.bind("state_change", (states: { current: string }) => {
        setStatus((previous) => statusForConnectionState(states.current, previous));
      });
    }

    connect(token).catch(fail);

    return () => {
      cancelled = true;
      pusher?.disconnect();
      setStatus("connecting");
    };
  }, [token]);

  return <CartSyncContext.Provider value={token ? status : "off"}>{children}</CartSyncContext.Provider>;
}

export function useCartSyncStatus(): SyncStatus {
  return useContext(CartSyncContext);
}
