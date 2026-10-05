import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

type ScreenMessageProps = { title?: string; message?: string; loading?: boolean; children?: ReactNode };

export function ScreenMessage({ title, message, loading, children }: ScreenMessageProps) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xxl },
  title: { fontSize: 22, fontWeight: "800", color: colors.foreground, textAlign: "center" },
  message: { fontSize: 15, color: colors.mutedForeground, textAlign: "center", lineHeight: 22 },
});
