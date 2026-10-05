import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCart } from "@/hooks/use-cart";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { data: cart } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: "800", color: colors.foreground },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.primaryForeground },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Sigma Gadgets",
          tabBarLabel: "Shop",
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Your cart",
          tabBarLabel: "Cart",
          tabBarBadge: cart?.itemCount ? cart.itemCount : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
