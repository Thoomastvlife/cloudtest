// functions/_lib/auth.js
// 共用的密碼雜湊 (PBKDF2) 與 Session Token (HMAC 簽章) 工具函式

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 小時

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

// ---------- 密碼雜湊 (PBKDF2-SHA256) ----------

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${bufToHex(salt.buffer)}:${bufToHex(derivedBits)}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const salt = hexToBuf(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bufToHex(derivedBits) === hashHex;
}

// ---------- Session Token (HMAC-SHA256 簽章) ----------

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64urlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

export async function createSessionToken(username, secret) {
  const payload = JSON.stringify({
    username,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
  const payloadB64 = base64urlEncode(payload);
  const sig = await hmacSign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = await hmacSign(payloadB64, secret);
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.exp < Date.now()) return null;
    return payload; // { username, exp }
  } catch {
    return null;
  }
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export const SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;

// ---------- 隨機權杖 / 隨機密碼 ----------

// 產生一組隨機的分享用權杖（32 bytes -> 64 碼 hex）
export function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bufToHex(bytes.buffer);
}

// 給管理員「重置密碼」用：產生一組人類可讀、避免混淆字元(0/O/1/l 等)的隨機密碼
export function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
