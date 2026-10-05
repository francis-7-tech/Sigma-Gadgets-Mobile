import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { ScreenMessage } from "@/components/screen-message";
import { useAuth } from "@/context/auth";
import { useAddToCart } from "@/hooks/use-cart";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import { colors, radius, spacing } from "@/lib/theme";

type Feedback = { ok: boolean; text: string };

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const product = useQuery({ queryKey: ["product", slug], queryFn: () => api.product(slug) });
  const addToCart = useAddToCart();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (product.isPending) return <ScreenMessage loading />;
  if (product.isError) {
    return (
      <ScreenMessage title="Couldn't load this product" message={product.error.message}>
        <Button label="Try again" onPress={() => product.refetch()} />
      </ScreenMessage>
    );
  }

  const item = product.data;
  const inStock = item.stock > 0;

  function handleAdd() {
    if (!session) {
      router.push("/account");
      return;
    }
    setFeedback(null);
    addToCart.mutate(
      { productId: item.id, quantity: 1 },
      {
        onSuccess: (result) => setFeedback({ ok: true, text: result.message }),
        onError: (error) => setFeedback({ ok: false, text: error.message }),
      },
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.imageBox}>
        {item.imageUrls[0] ? (
          <Image source={item.imageUrls[0]} style={styles.image} contentFit="contain" transition={150} accessibilityLabel={item.name} />
        ) : null}
      </View>
      {item.illustrativePhoto ? <Text style={styles.note}>Illustrative photo: the actual product may look different.</Text> : null}

      <Text style={styles.category}>{item.category.name}</Text>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>{formatNaira(item.priceKobo)}</Text>
      <View style={styles.stockRow}>
        <View style={[styles.dot, { backgroundColor: inStock ? "#1D8A4A" : colors.mutedForeground }]} />
        <Text style={styles.stock}>{inStock ? "In stock" : "Out of stock"}</Text>
        {inStock ? <Text style={styles.stockCount}>{item.stock <= 3 ? `Only ${item.stock} left` : `${item.stock} available`}</Text> : null}
      </View>
      <Text style={styles.description}>{item.description}</Text>

      <Button
        label={!inStock ? "Out of stock" : session ? "Add to cart" : "Sign in to add to cart"}
        onPress={handleAdd}
        disabled={!inStock}
        loading={addToCart.isPending}
      />
      {feedback ? (
        <Text style={[styles.feedback, { color: feedback.ok ? colors.success : colors.warning }]} accessibilityLiveRegion="polite">
          {feedback.text}
        </Text>
      ) : null}
      {feedback?.ok ? <Button label="View cart" variant="secondary" onPress={() => router.push("/cart")} /> : null}

      {item.specs.length ? (
        <View style={styles.specs}>
          <Text style={styles.specsTitle}>Key specs</Text>
          {item.specs.map((spec) => (
            <View key={spec.label} style={styles.specRow}>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  imageBox: {
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  note: { fontSize: 13, color: colors.mutedForeground },
  category: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  name: { fontSize: 26, fontWeight: "800", color: colors.foreground, lineHeight: 32 },
  price: { fontSize: 26, fontWeight: "700", color: colors.foreground },
  stockRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stock: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  stockCount: { fontSize: 14, color: colors.mutedForeground },
  description: { fontSize: 15, color: colors.mutedForeground, lineHeight: 22 },
  feedback: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  specs: { marginTop: spacing.lg },
  specsTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, marginBottom: spacing.xs },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: { fontSize: 15, color: colors.mutedForeground },
  specValue: { fontSize: 15, fontWeight: "600", color: colors.foreground, flexShrink: 1, textAlign: "right" },
});
