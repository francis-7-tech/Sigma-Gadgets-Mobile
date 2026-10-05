import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatNaira } from "@/lib/money";
import { colors, radius, spacing } from "@/lib/theme";
import type { Product } from "@/lib/types";

export function stockLabel(stock: number): string | null {
  if (stock < 1) return "Out of stock";
  return stock <= 3 ? `Only ${stock} left` : null;
}

export function ProductCard({ product, width }: { product: Product; width: number }) {
  const badge = stockLabel(product.stock);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatNaira(product.priceKobo)}`}
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })}
      style={[styles.card, { width }]}
    >
      <View style={[styles.imageBox, { width, height: width }]}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={{ width, height: width }} contentFit="contain" transition={150} />
        ) : null}
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.category}>{product.category.name}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatNaira(product.priceKobo)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  imageBox: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: colors.border },
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
    color: colors.warning,
    overflow: "hidden",
  },
  body: { padding: spacing.md, gap: 3 },
  category: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  name: { fontSize: 14, fontWeight: "600", color: colors.foreground, lineHeight: 19, minHeight: 38 },
  price: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 2 },
});
