import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState } from "react-native";
import { AuthProvider } from "@/context/auth";
import { CartSyncProvider } from "@/context/cart-sync";
import { queryClient } from "@/lib/query-client";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartSyncProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.foreground,
              headerTitleStyle: { fontWeight: "800" },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[slug]" options={{ title: "", headerBackTitle: "Shop" }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
          </Stack>
        </CartSyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
