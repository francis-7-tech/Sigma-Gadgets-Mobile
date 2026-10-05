import { createHash, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ApiError, buildRequest, productListPath, toApiError } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import { buildAuthorizeUrl, bytesToBase64Url, readAuthCallback, toBase64Url } from "@/lib/pkce";

describe("formatNaira", () => {
  it("formats whole kobo as naira with thousands separators", () => {
    expect(formatNaira(2_800_000)).toBe("₦28,000");
    expect(formatNaira(135_000_000)).toBe("₦1,350,000");
    expect(formatNaira(0)).toBe("₦0");
    expect(formatNaira(1_500_050)).toBe("₦15,000.50");
  });

  it("rejects fractional kobo", () => {
    expect(() => formatNaira(10.5)).toThrow();
  });
});

describe("base64url helpers", () => {
  it("encode bytes the same way as Node", () => {
    for (const length of [1, 2, 3, 16, 31, 32, 33]) {
      const bytes = randomBytes(length);
      expect(bytesToBase64Url(new Uint8Array(bytes)), `${length} bytes`).toBe(bytes.toString("base64url"));
    }
  });

  it("produce a challenge the website accepts for its verifier", () => {
    const verifier = bytesToBase64Url(new Uint8Array(randomBytes(32)));
    const digest = createHash("sha256").update(verifier).digest();

    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(toBase64Url(digest.toString("base64"))).toBe(digest.toString("base64url"));
    expect(toBase64Url(digest.toString("base64"))).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe("buildAuthorizeUrl", () => {
  it("points at the website's app sign-in page with encoded values", () => {
    const url = buildAuthorizeUrl("https://shop.test", "exp://192.168.1.20:8081/--/auth", "CHALLENGE", "STATE");

    expect(url).toBe("https://shop.test/mobile/authorize?redirect_uri=exp%3A%2F%2F192.168.1.20%3A8081%2F--%2Fauth&code_challenge=CHALLENGE&state=STATE");
  });
});

describe("readAuthCallback", () => {
  it("returns the code when the state matches", () => {
    expect(readAuthCallback("sigmagadgets://auth?code=abc-123&state=xyz", "xyz")).toEqual({ code: "abc-123" });
    expect(readAuthCallback("exp://192.168.1.20:8081/--/auth?state=xyz&code=abc#frag", "xyz")).toEqual({ code: "abc" });
  });

  it("refuses a response with the wrong state or no code", () => {
    expect(readAuthCallback("sigmagadgets://auth?code=abc&state=other", "xyz")).toHaveProperty("error");
    expect(readAuthCallback("sigmagadgets://auth?state=xyz", "xyz")).toHaveProperty("error");
    expect(readAuthCallback("sigmagadgets://auth", "xyz")).toHaveProperty("error");
  });
});

describe("API client", () => {
  it("sends the login token and JSON body", () => {
    const { url, init } = buildRequest("/api/v1/cart/items", { method: "POST", token: "TOKEN", body: { productId: 7, quantity: 1 } });

    expect(url).toMatch(/\/api\/v1\/cart\/items$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Accept: "application/json", Authorization: "Bearer TOKEN", "Content-Type": "application/json" });
    expect(init.body).toBe('{"productId":7,"quantity":1}');
  });

  it("sends no token or body for public requests", () => {
    const { init } = buildRequest("/api/v1/products");

    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({ Accept: "application/json" });
    expect(init.body).toBeUndefined();
  });

  it("builds the product list path", () => {
    expect(productListPath(null)).toBe("/api/v1/products");
    expect(productListPath("audio")).toBe("/api/v1/products?category=audio");
  });

  it("turns the website's error shape into an ApiError", () => {
    const error = toApiError(409, { error: { code: "out_of_stock", message: "Sorry, this item is out of stock." } });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: "out_of_stock", message: "Sorry, this item is out of stock." });
  });

  it("falls back to a friendly message for unexpected responses", () => {
    expect(toApiError(500, null)).toMatchObject({ status: 500, code: "unknown_error", message: "Something went wrong. Please try again." });
  });
});
