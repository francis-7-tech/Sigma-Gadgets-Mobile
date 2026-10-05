import * as SecureStore from "expo-secure-store";
import type { Session } from "@/lib/types";

const KEY = "sigma-gadgets-session";

export async function loadSession(): Promise<Session | null> {
  try {
    const stored = await SecureStore.getItemAsync(KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as Partial<Session>;
    return typeof session.token === "string" && session.user?.id ? (session as Session) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
