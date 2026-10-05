import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { ScreenMessage } from "@/components/screen-message";
import { useAuth } from "@/context/auth";
import { colors, radius, spacing } from "@/lib/theme";

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email || "?";
  const parts = source.split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
}

export default function AccountScreen() {
  const { status, session, busy, error, signIn, signOut } = useAuth();

  if (status === "loading") return <ScreenMessage loading />;

  if (!session) {
    return (
      <ScreenMessage
        title="Sign in to Sigma Gadgets"
        message="Use the same Google account as on the website. Your cart is shared between both."
      >
        <Button label="Sign in with Google" onPress={signIn} loading={busy} style={styles.wide} />
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </ScreenMessage>
    );
  }

  const { user } = session;
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user.name, user.email)}</Text>
        </View>
        <Text style={styles.signedIn}>Signed in as</Text>
        <Text style={styles.name}>{user.name || "Your account"}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  card: {
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.primaryForeground, fontSize: 24, fontWeight: "800" },
  signedIn: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  name: { fontSize: 22, fontWeight: "800", color: colors.foreground, textAlign: "center" },
  email: { fontSize: 15, color: colors.mutedForeground, textAlign: "center" },
  wide: { alignSelf: "stretch" },
  error: { fontSize: 14, fontWeight: "600", color: colors.danger, textAlign: "center" },
});
