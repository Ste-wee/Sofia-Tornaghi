import { isAuthenticated, jsonResponse, missingConfig } from '../_lib/auth.js';
import { readFile, writeJsonFile } from '../_lib/github.js';
import { GROUPS, sanitizeValues } from '../_lib/schema.js';

const CONTENT_PATH = 'content/site.json';
const PHOTO_PATH = 'content/foto.json';

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

async function guard(request, env) {
  const incomplete = missingConfig(env);
  if (incomplete.length > 0) {
    return jsonResponse({
      error: 'Configurazione incompleta sul server. Variabili mancanti: ' + incomplete.join(', ') + '.'
    }, 500);
  }
  if (!(await isAuthenticated(request, env))) {
    return jsonResponse({ error: 'Sessione scaduta. Rifai il login.' }, 401);
  }
  return null;
}

// Legge i valori da GitHub e non dal sito pubblicato: subito dopo un
// salvataggio il sito è ancora in ricostruzione, ma il pannello deve già
// mostrare il testo appena scritto.
export async function onRequestGet(context) {
  const { request, env } = context;

  const denied = await guard(request, env);
  if (denied) return denied;

  try {
    const [site, photo] = await Promise.all([
      readFile(env, CONTENT_PATH),
      readFile(env, PHOTO_PATH)
    ]);

    return jsonResponse({
      groups: GROUPS,
      values: parseJson(site.text, {}),
      foto: parseJson(photo.text, {}).immagine || ''
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 502);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  const denied = await guard(request, env);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Richiesta non valida.' }, 400);
  }

  const values = sanitizeValues(body && body.values);
  if (Object.keys(values).length === 0) {
    return jsonResponse({ error: 'Nessun contenuto da salvare.' }, 400);
  }

  try {
    // I valori esistenti restano sotto: se in futuro si aggiunge un campo
    // allo schema, un salvataggio fatto da una scheda aperta da prima non
    // cancella quello che non conosce.
    const current = await readFile(env, CONTENT_PATH);
    const merged = Object.assign({}, parseJson(current.text, {}), values);

    await writeJsonFile(env, CONTENT_PATH, merged, 'Aggiorna i testi del sito dal pannello');

    return jsonResponse({ ok: true, values: merged });
  } catch (error) {
    return jsonResponse({ error: error.message }, 502);
  }
}
