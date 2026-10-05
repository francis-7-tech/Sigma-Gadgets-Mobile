import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { ProductCard } from "@/components/product-card";
import { ScreenMessage } from "@/components/screen-message";
import { api } from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

export default function ShopScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const products = useQuery({ queryKey: ["products", category], queryFn: () => api.products(category) });

  const chips = [{ name: "All", slug: null as string | null }, ...(categories.data ?? [])];

  return (
    <View style={styles.screen}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((chip) => {
            const selected = chip.slug === category;
            return (
              <Pressable
                key={chip.slug ?? "all"}
                onPress={() => setCategory(chip.slug)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{chip.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {products.isPending ? (
        <ScreenMessage loading />
      ) : products.isError ? (
        <ScreenMessage title="Couldn't load the shop" message={products.error.message}>
          <Button label="Try again" onPress={() => products.refetch()} />
        </ScreenMessage>
      ) : (
        <FlatList
          data={products.data}
          keyExtractor={(product) => String(product.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ProductCard product={item} />}
          refreshControl={<RefreshControl refreshing={products.isRefetching} onRefresh={() => products.refetch()} />}
          ListEmptyComponent={<ScreenMessage title="No products here yet" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  chips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  chipLabelSelected: { color: colors.primaryForeground },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md, flexGrow: 1 },
  row: { gap: spacing.md },
});
