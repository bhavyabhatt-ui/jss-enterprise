// Web Crypto API HMAC token generation & verification (Edge & Node.js compatible)

const DEFAULT_ADMIN_USERNAME = "adminjss";
const DEFAULT_ADMIN_PASSWORD = "jss2026";
const DEFAULT_AUTH_SECRET = "jss-enterprise-secure-admin-token-secret-2026";

export const AUTH_COOKIE_NAME = "jss_admin_session";

export function getAdminCredentials() {
  return {
    username: (process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim(),
    password: (process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD).trim(),
  };
}

function getSecretKey(): string {
  return process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
}

// Convert string to BufferSource
function strToBuffer(str: string): BufferSource {
  return new TextEncoder().encode(str) as unknown as BufferSource;
}

// Convert ArrayBuffer to Hex string
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getCryptoKey(): Promise<CryptoKey> {
  const secret = getSecretKey();
  return crypto.subtle.importKey(
    "raw",
    strToBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a signed session token: base64(payload).signature
 * Expire in 30 days
 */
export async function createSessionToken(username: string): Promise<string> {
  const payload = {
    u: username,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = typeof Buffer !== "undefined"
    ? Buffer.from(payloadStr).toString("base64url")
    : btoa(payloadStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, strToBuffer(payloadBase64));
  const sigHex = bufToHex(signature);

  return `${payloadBase64}.${sigHex}`;
}

/**
 * Verifies a session token signature & expiration
 */
export async function verifySessionToken(token: string | undefined | null): Promise<{
  valid: boolean;
  username?: string;
}> {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payloadBase64, sigHex] = parts;

  try {
    const key = await getCryptoKey();
    const expectedSig = await crypto.subtle.sign("HMAC", key, strToBuffer(payloadBase64));
    const expectedSigHex = bufToHex(expectedSig);

    if (sigHex !== expectedSigHex) {
      return { valid: false };
    }

    // Decode payload
    const payloadStr = typeof Buffer !== "undefined"
      ? Buffer.from(payloadBase64, "base64url").toString("utf-8")
      : atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));

    const payload = JSON.parse(payloadStr);

    if (!payload.exp || Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, username: payload.u };
  } catch (err) {
    return { valid: false };
  }
}
