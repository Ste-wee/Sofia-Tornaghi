import { passwordMatches, createSessionToken, sessionCookieHeader, jsonResponse, missingConfig } from '../_lib/auth.js';

// Ritardo su ogni tentativo fallito. Scoraggia chi prova le password una
// dopo l'altra, ma NON chi le prova in parallelo: ogni richiesta aspetta per
// conto proprio, quindi mille tentativi lanciati insieme finiscono comunque
// in poco più di questo ritardo. La protezione vera è la Rate limiting rule
// di Cloudflare su /api/login, che va configurata (vedi SETUP.md).
function pause(milliseconds) {
  return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const incomplete = missingConfig(env);
  if (incomplete.length > 0) {
    return jsonResponse({
      error: 'Configurazione incompleta sul server. Variabili mancanti: ' + incomplete.join(', ') + '.'
    }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Richiesta non valida.' }, 400);
  }

  const ok = await passwordMatches(body && body.password, env.ADMIN_PASSWORD);
  if (!ok) {
    await pause(700);
    return jsonResponse({ error: 'Password non corretta.' }, 401);
  }

  const token = await createSessionToken(env.SESSION_SECRET);
  return jsonResponse({ ok: true }, 200, { 'Set-Cookie': sessionCookieHeader(token) });
}
