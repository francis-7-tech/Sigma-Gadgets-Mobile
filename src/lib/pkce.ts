const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function bytesToBase64Url(bytes: Uint8Array): string {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    output += BASE64_CHARS[a >> 2];
    output += BASE64_CHARS[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) output += BASE64_CHARS[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) output += BASE64_CHARS[c & 63];
  }
  return toBase64Url(output);
}

export function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type AuthCallback = { code: string } | { error: string };

export function readAuthCallback(url: string, expectedState: string): AuthCallback {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
  const params = new Map(
    query.split("&").filter(Boolean).map((pair) => {
      const [key, value = ""] = pair.split("=");
      return [decodeURIComponent(key), decodeURIComponent(value)] as const;
    }),
  );

  const code = params.get("code");
  if (!code) return { error: "The website didn't send a sign-in code. Please try again." };
  if (params.get("state") !== expectedState) return { error: "This sign-in response doesn't match the request. Please try again." };
  return { code };
}

export function buildAuthorizeUrl(apiUrl: string, redirectUri: string, codeChallenge: string, state: string): string {
  const query = [
    ["redirect_uri", redirectUri],
    ["code_challenge", codeChallenge],
    ["state", state],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `${apiUrl}/mobile/authorize?${query}`;
}
