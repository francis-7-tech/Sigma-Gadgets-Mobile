import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatNaira } from "@/lib/money";
import { colors, radius, spacing } from "@/lib/theme";
import type { Product } from "@/lib/types";

export function stockLabel(stock: number): string | null {
  if (stock < 1) return "Out of stock";
  return stock <= 3 ? `Only ${stock} left` : null;
}

export function ProductCard({ product }: { product: Product }) {
  const badge = stockLabel(product.stock);
  return (
    <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="link">
        <View style={styles.imageBox}>
          {product.imageUrl ? (
            <Image source={product.imageUrl} style={styles.image} contentFit="contain" transition={150} accessibilityLabel={product.name} />
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
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  pressed: { opacity: 0.85 },
  imageBox: { aspectRatio: 1, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: colors.border },
  image: { width: "100%", height: "100%" },
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
  body: { padding: spacing.md, gap: 3, flex: 1 },
  category: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  name: { fontSize: 14, fontWeight: "600", color: colors.foreground, lineHeight: 19, minHeight: 38 },
  price: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 2 },
});
