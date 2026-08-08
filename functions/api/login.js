import { passwordMatches, createSessionToken, sessionCookieHeader, jsonResponse, missingConfig } from '../_lib/auth.js';

// Ritardo su ogni tentativo fallito: rende impraticabile provare password a
// raffica, senza bisogno di uno stato condiviso fra le richieste.
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
