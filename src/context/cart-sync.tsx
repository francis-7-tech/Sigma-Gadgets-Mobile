import Pusher from "pusher-js/react-native";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { CART_QUERY_KEY, queryClient } from "@/lib/query-client";

const CartSyncContext = createContext(false);

function refreshCart() {
  queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
}

export function CartSyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const token = session?.token;
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let pusher: Pusher | null = null;

    api
      .realtime(token)
      .then((config) => {
        if (cancelled || !config) return;
        pusher = new Pusher(config.key, {
          cluster: config.cluster,
          channelAuthorization: {
            endpoint: `${API_URL}/api/v1/realtime/auth`,
            transport: "ajax",
            headers: { Authorization: `Bearer ${token}` },
          },
        });
        const channel = pusher.subscribe(config.channel);
        channel.bind(config.event, refreshCart);
        channel.bind("pusher:subscription_succeeded", () => {
          setLive(true);
          refreshCart();
        });
        pusher.connection.bind("state_change", (states: { current: string }) => {
          if (states.current !== "connected") setLive(false);
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      pusher?.disconnect();
      setLive(false);
    };
  }, [token]);

  return <CartSyncContext.Provider value={live && !!token}>{children}</CartSyncContext.Provider>;
}

export function useCartIsLive(): boolean {
  return useContext(CartSyncContext);
}
