import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { API_URL, AUTH_CALLBACK_PATH } from "@/lib/config";
import { buildAuthorizeUrl, bytesToBase64Url, readAuthCallback, toBase64Url } from "@/lib/pkce";
import { CART_QUERY_KEY, queryClient, setUnauthorizedHandler } from "@/lib/query-client";
import { clearSession, loadSession, saveSession } from "@/lib/session-storage";
import type { Session } from "@/lib/types";

type AuthContextValue = {
  status: "loading" | "signedOut" | "signedIn";
  session: Session | null;
  busy: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  completeSignIn: (code: string, state: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type PendingSignIn = { codeVerifier: string; state: string };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<PendingSignIn | null>(null);

  function forgetSession() {
    setSession(null);
    setStatus("signedOut");
    queryClient.removeQueries({ queryKey: CART_QUERY_KEY });
    clearSession().catch(() => {});
  }

  useEffect(() => {
    let active = true;

    async function restore() {
      const stored = await loadSession();
      if (!active) return;
      if (!stored) {
        setStatus("signedOut");
        return;
      }
      setSession(stored);
      setStatus("signedIn");

      try {
        const user = await api.me(stored.token);
        if (!active) return;
        const refreshed = { token: stored.token, user };
        setSession(refreshed);
        await saveSession(refreshed);
      } catch (caught) {
        if (active && caught instanceof ApiError && caught.status === 401) forgetSession();
      }
    }

    restore();
    setUnauthorizedHandler(forgetSession);
    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  async function completeSignIn(code: string, state: string) {
    const request = pending.current;
    if (!request || request.state !== state) return;
    pending.current = null;

    setBusy(true);
    try {
      const signedIn = await api.exchangeCode(code, request.codeVerifier);
      const next = { token: signedIn.token, user: signedIn.user };
      await saveSession(next);
      setSession(next);
      setStatus("signedIn");
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign-in didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    setError(null);
    setBusy(true);
    try {
      const codeVerifier = bytesToBase64Url(Crypto.getRandomBytes(32));
      const state = bytesToBase64Url(Crypto.getRandomBytes(16));
      const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
        encoding: Crypto.CryptoEncoding.BASE64,
      });
      const redirectUri = Linking.createURL(AUTH_CALLBACK_PATH);
      pending.current = { codeVerifier, state };

      const result = await WebBrowser.openAuthSessionAsync(
        buildAuthorizeUrl(API_URL, redirectUri, toBase64Url(digest), state),
        redirectUri,
      );
      if (result.type !== "success") return;

      const callback = readAuthCallback(result.url, state);
      if ("error" in callback) {
        if (pending.current) setError(callback.error);
        return;
      }
      await completeSignIn(callback.code, state);
    } catch {
      setError("Sign-in didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const token = session?.token;
    forgetSession();
    if (token) await api.signOut(token).catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ status, session, busy, error, signIn, completeSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
