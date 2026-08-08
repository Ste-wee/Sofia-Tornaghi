// Autenticazione del pannello di gestione.
//
// Non esiste un database utenti: c'è una sola password, conservata come
// secret di Cloudflare Pages (ADMIN_PASSWORD). Dopo il login viene emesso
// un cookie di sessione firmato con HMAC-SHA256 (SESSION_SECRET), così il
// server non deve conservare nulla per riconoscere chi è già entrato.

const COOKIE_NAME = 'st_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 ore

const encoder = new TextEncoder();

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(function (b) { return b.toString(16).padStart(2, '0'); })
    .join('');
}

async function sha256Hex(value) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

// Confronto a tempo costante: esce sempre dopo lo stesso numero di
// iterazioni, così la durata della risposta non rivela quanti caratteri
// iniziali erano corretti.
function equalsConstantTime(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

// Confronta le password sui rispettivi digest: hanno sempre la stessa
// lunghezza, quindi nemmeno la lunghezza della password vera trapela.
export async function passwordMatches(submitted, expected) {
  if (typeof submitted !== 'string' || typeof expected !== 'string') return false;
  if (expected.length === 0) return false;
  const a = await sha256Hex(submitted);
  const b = await sha256Hex(expected);
  return equalsConstantTime(a, b);
}

export async function createSessionToken(secret) {
  const expiresAt = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  const signature = await hmacHex(secret, expiresAt);
  return expiresAt + '.' + signature;
}

export async function sessionTokenIsValid(secret, token) {
  if (!secret || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const expiresAt = parts[0];
  const signature = parts[1];
  if (!/^\d+$/.test(expiresAt)) return false;

  const expected = await hmacHex(secret, expiresAt);
  if (!equalsConstantTime(signature, expected)) return false;

  return Number(expiresAt) > Date.now();
}

export function readCookie(request, name) {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  const parts = header.split(';');
  for (let i = 0; i < parts.length; i++) {
    const piece = parts[i].trim();
    const eq = piece.indexOf('=');
    if (eq > 0 && piece.slice(0, eq) === name) {
      return piece.slice(eq + 1);
    }
  }
  return null;
}

// SameSite=Strict: il cookie non viaggia con richieste partite da altri
// siti, il che rende inutili gli attacchi CSRF contro le API di salvataggio.
export function sessionCookieHeader(token) {
  return COOKIE_NAME + '=' + token +
    '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + SESSION_TTL_SECONDS;
}

export function clearedCookieHeader() {
  return COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

export async function isAuthenticated(request, env) {
  const token = readCookie(request, COOKIE_NAME);
  return sessionTokenIsValid(env.SESSION_SECRET, token);
}

export function jsonResponse(payload, status, extraHeaders) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  if (extraHeaders) {
    Object.keys(extraHeaders).forEach(function (k) { headers[k] = extraHeaders[k]; });
  }
  return new Response(JSON.stringify(payload), { status: status || 200, headers });
}

export function missingConfig(env) {
  const required = ['ADMIN_PASSWORD', 'SESSION_SECRET', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
  return required.filter(function (name) { return !env[name]; });
}
