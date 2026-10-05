import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { ScreenMessage } from "@/components/screen-message";
import { useAuth } from "@/context/auth";
import { useCartIsLive } from "@/context/cart-sync";
import { useCart, useSetQuantity } from "@/hooks/use-cart";
import { API_URL } from "@/lib/config";
import { formatNaira } from "@/lib/money";
import { colors, radius, spacing } from "@/lib/theme";
import type { CartLine } from "@/lib/types";

export default function CartScreen() {
  const { status } = useAuth();
  const cart = useCart();
  const setQuantity = useSetQuantity();
  const live = useCartIsLive();

  if (status === "loading") return <ScreenMessage loading />;
  if (status === "signedOut") {
    return (
      <ScreenMessage title="Sign in to see your cart" message="Your cart is saved to your account and shared with the website.">
        <Button label="Sign in" onPress={() => router.push("/account")} />
      </ScreenMessage>
    );
  }
  if (cart.isPending) return <ScreenMessage loading />;
  if (cart.isError) {
    return (
      <ScreenMessage title="Couldn't load your cart" message={cart.error.message}>
        <Button label="Try again" onPress={() => cart.refetch()} />
      </ScreenMessage>
    );
  }

  const data = cart.data;
  const busyProductId = setQuantity.isPending ? setQuantity.variables.productId : null;

  function renderLine({ item }: { item: CartLine }) {
    const busy = busyProductId === item.productId;
    return (
      <View style={[styles.line, busy && styles.busy]}>
        <View style={styles.thumb}>
          {item.imageUrl ? <Image source={item.imageUrl} style={styles.thumbImage} contentFit="contain" accessibilityLabel={item.name} /> : null}
        </View>
        <View style={styles.lineBody}>
          <Text style={styles.lineName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.linePrice}>{formatNaira(item.priceKobo)} each</Text>
          {item.exceedsStock ? <Text style={styles.problem}>Only {item.stock} in stock</Text> : null}
          <View style={styles.controls}>
            <View style={styles.stepper}>
              <StepButton icon="remove" label="Decrease quantity" disabled={busy} onPress={() => setQuantity.mutate({ productId: item.productId, quantity: item.quantity - 1 })} />
              <Text style={styles.quantity}>{item.quantity}</Text>
              <StepButton
                icon="add"
                label="Increase quantity"
                disabled={busy || item.quantity >= item.stock}
                onPress={() => setQuantity.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
              disabled={busy}
              onPress={() => setQuantity.mutate({ productId: item.productId, quantity: 0 })}
              style={styles.remove}
            >
              <Ionicons name="trash-outline" size={18} color={colors.foreground} />
              <Text style={styles.removeLabel}>Remove</Text>
            </Pressable>
          </View>
          <Text style={styles.lineTotal}>{formatNaira(item.lineTotalKobo)}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={data.lines}
      keyExtractor={(line) => String(line.productId)}
      renderItem={renderLine}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={cart.isRefetching} onRefresh={() => cart.refetch()} />}
      ListHeaderComponent={
        <View style={styles.syncRow}>
          <View style={[styles.syncDot, { backgroundColor: live ? "#1D8A4A" : colors.input }]} />
          <Text style={styles.syncText}>{live ? "Live: synced with the website" : "Connecting to live updates…"}</Text>
        </View>
      }
      ListEmptyComponent={
        <ScreenMessage title="Your cart is empty" message="Items you add here or on the website show up in both places.">
          <Button label="Browse gadgets" onPress={() => router.push("/")} />
        </ScreenMessage>
      }
      ListFooterComponent={
        data.lines.length ? (
          <View style={styles.summary}>
            <SummaryRow label="Subtotal" value={formatNaira(data.subtotalKobo)} />
            <SummaryRow label="Delivery" value={formatNaira(data.deliveryFeeKobo)} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatNaira(data.totalKobo)}</Text>
            </View>
            <Button label="Checkout on the website" onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/checkout`)} disabled={data.hasStockProblem} />
            <Text style={styles.hint}>You&apos;ll pay by bank transfer after placing your order.</Text>
          </View>
        ) : null
      }
    />
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: "add" | "remove"; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.stepButton, disabled && styles.busy]}>
      <Ionicons name={icon} size={18} color={colors.foreground} />
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  syncRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncText: { fontSize: 13, color: colors.mutedForeground },
  line: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  busy: { opacity: 0.5 },
  thumb: { width: 84, height: 84, borderRadius: radius.control, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  thumbImage: { width: "100%", height: "100%" },
  lineBody: { flex: 1, gap: 4 },
  lineName: { fontSize: 15, fontWeight: "600", color: colors.foreground, lineHeight: 20 },
  linePrice: { fontSize: 13, color: colors.mutedForeground },
  problem: { fontSize: 13, fontWeight: "700", color: colors.warning },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.input, borderRadius: radius.pill },
  stepButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  quantity: { minWidth: 28, textAlign: "center", fontSize: 16, fontWeight: "700", color: colors.foreground },
  remove: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: spacing.xs },
  removeLabel: { fontSize: 14, fontWeight: "700", color: colors.foreground, textDecorationLine: "underline" },
  lineTotal: { fontSize: 16, fontWeight: "700", color: colors.foreground, textAlign: "right" },
  summary: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 15, color: colors.mutedForeground },
  summaryValue: { fontSize: 15, color: colors.foreground },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  totalLabel: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  totalValue: { fontSize: 22, fontWeight: "700", color: colors.foreground },
  hint: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
});
