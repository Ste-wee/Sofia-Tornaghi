import { isAuthenticated, jsonResponse, missingConfig } from '../_lib/auth.js';
import { writeFile, writeJsonFile, deleteFile } from '../_lib/github.js';

const PHOTO_PATH = 'content/foto.json';
const MAX_BYTES = 3 * 1024 * 1024;

// Solo i file generati dal pannello, che hanno sempre questa forma. La foto
// originale committata a mano non corrisponde e non viene mai cancellata.
const GENERATED_PHOTO = /^foto-profilo-\d+\.(jpg|png|webp)$/;

// Il tipo dichiarato dal browser non viene creduto: si guardano i primi
// byte del file. Un .jpg che in realtà è qualcos'altro non passa.
const SIGNATURES = [
  { extension: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { extension: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { extension: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] } // RIFF, verificato sotto anche per "WEBP"
];

function decodeBase64(base64) {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function startsWith(bytes, signature) {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function detectExtension(bytes) {
  for (let i = 0; i < SIGNATURES.length; i++) {
    if (!startsWith(bytes, SIGNATURES[i].bytes)) continue;

    if (SIGNATURES[i].extension === 'webp') {
      const isWebp = bytes.length > 12 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
      if (!isWebp) continue;
    }
    return SIGNATURES[i].extension;
  }
  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const incomplete = missingConfig(env);
  if (incomplete.length > 0) {
    return jsonResponse({
      error: 'Configurazione incompleta sul server. Variabili mancanti: ' + incomplete.join(', ') + '.'
    }, 500);
  }
  if (!(await isAuthenticated(request, env))) {
    return jsonResponse({ error: 'Sessione scaduta. Rifai il login.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Richiesta non valida.' }, 400);
  }

  const base64 = body && body.data;
  if (typeof base64 !== 'string' || base64.length === 0) {
    return jsonResponse({ error: 'Nessuna immagine ricevuta.' }, 400);
  }

  let bytes;
  try {
    bytes = decodeBase64(base64);
  } catch (error) {
    return jsonResponse({ error: 'Immagine non leggibile.' }, 400);
  }

  if (bytes.length > MAX_BYTES) {
    return jsonResponse({ error: 'Immagine troppo pesante: il limite è 3 MB.' }, 413);
  }

  const extension = detectExtension(bytes);
  if (!extension) {
    return jsonResponse({ error: 'Formato non supportato. Usa un file JPG, PNG o WebP.' }, 415);
  }

  // Il nome lo decide il server: qualsiasi nome arrivi dal browser viene
  // ignorato, quindi non ci sono percorsi da ripulire.
  const filename = 'foto-profilo-' + Date.now() + '.' + extension;

  try {
    await writeFile(env, filename, base64.replace(/\s/g, ''), 'Carica una nuova foto profilo dal pannello', null);

    let previous = '';
    await writeJsonFile(env, PHOTO_PATH, function (current) {
      previous = typeof current.immagine === 'string' ? current.immagine : '';
      return { immagine: filename };
    }, 'Aggiorna la foto profilo dal pannello');

    // La foto sostituita non serve più a nessuno: senza questo passaggio il
    // repository si riempirebbe di immagini morte a ogni cambio.
    if (previous !== filename && GENERATED_PHOTO.test(previous)) {
      try {
        await deleteFile(env, previous, 'Rimuovi la foto profilo sostituita');
      } catch (error) {
        // Il caricamento è andato a buon fine: resta un file di troppo, non
        // è un motivo per dire a Sofia che non ha funzionato.
      }
    }

    return jsonResponse({ ok: true, immagine: filename });
  } catch (error) {
    return jsonResponse({ error: error.message }, 502);
  }
}
