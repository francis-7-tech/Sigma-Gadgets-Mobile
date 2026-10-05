import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/auth";

export default function AuthCallbackScreen() {
  const { code, state } = useLocalSearchParams<{ code?: string; state?: string }>();
  const { completeSignIn } = useAuth();

  useEffect(() => {
    if (code && state) completeSignIn(code, state);
  }, [code, state, completeSignIn]);

  return <Redirect href="/account" />;
}
