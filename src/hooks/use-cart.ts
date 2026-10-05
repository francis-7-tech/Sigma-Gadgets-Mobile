import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { useCartIsLive } from "@/context/cart-sync";
import { api } from "@/lib/api";
import { CART_QUERY_KEY, queryClient } from "@/lib/query-client";
import type { Cart } from "@/lib/types";

function storeCart(cart: Cart) {
  queryClient.setQueryData(CART_QUERY_KEY, cart);
}

const FALLBACK_POLL_MS = 2500;

export function useCart() {
  const { session } = useAuth();
  const live = useCartIsLive();
  const token = session?.token;
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => api.cart(token!),
    enabled: !!token,
    staleTime: 0,
    refetchInterval: live ? false : FALLBACK_POLL_MS,
  });
}

export function useAddToCart() {
  const { session } = useAuth();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.addToCart(session!.token, productId, quantity),
    onSuccess: (result) => storeCart(result.cart),
  });
}

export function useSetQuantity() {
  const { session } = useAuth();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      quantity === 0 ? api.removeFromCart(session!.token, productId) : api.setQuantity(session!.token, productId, quantity),
    onSuccess: storeCart,
  });
}
