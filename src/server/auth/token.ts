const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const ADMIN_SESSION_COOKIE = "julia_admin_session";

export type AdminSessionClaims = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  v: 1;
};

function toBase64Url(input: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < input.length; index += chunkSize) {
    binary += String.fromCharCode(...input.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const output = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }

  return output;
}

function encodeJson(value: unknown): Uint8Array {
  return textEncoder.encode(JSON.stringify(value));
}

function decodeJson<T>(value: Uint8Array): T {
  return JSON.parse(textDecoder.decode(value)) as T;
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function createAdminSessionClaims(
  input: { userId: string; email: string },
  maxAgeSeconds: number,
): AdminSessionClaims {
  const issuedAt = Math.floor(Date.now() / 1000);

  return {
    sub: input.userId,
    email: input.email,
    iat: issuedAt,
    exp: issuedAt + maxAgeSeconds,
    v: 1,
  };
}

export async function signAdminSessionToken(
  claims: AdminSessionClaims,
  secret: string,
): Promise<string> {
  const payload = encodeJson(claims);
  const key = await importHmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, toArrayBuffer(payload)));

  return `${toBase64Url(payload)}.${toBase64Url(signature)}`;
}

export async function verifyAdminSessionToken(
  token: string,
  secret: string,
): Promise<AdminSessionClaims | null> {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  let claims: AdminSessionClaims;
  let payload: Uint8Array;

  try {
    payload = fromBase64Url(payloadPart);
    claims = decodeJson<AdminSessionClaims>(payload);
  } catch {
    return null;
  }

  if (claims.v !== 1 || typeof claims.sub !== "string" || typeof claims.email !== "string") {
    return null;
  }

  if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp)) {
    return null;
  }

  if (claims.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  try {
    const key = await importHmacKey(secret);
    const signature = fromBase64Url(signaturePart);
    const isValid = await crypto.subtle.verify("HMAC", key, toArrayBuffer(signature), toArrayBuffer(payload));
    return isValid ? claims : null;
  } catch {
    return null;
  }
}
