// Lettura e scrittura dei file di contenuto tramite l'API GitHub.
//
// Il token sta solo qui, lato server, come secret di Cloudflare Pages: chi
// usa il pannello non lo vede mai e non ha bisogno di un account GitHub.
// Ogni salvataggio è un commit, quindi resta lo storico delle modifiche.

const GITHUB_API = 'https://api.github.com';

function headers(env) {
  return {
    'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'sito-sofia-tornaghi',
    'Content-Type': 'application/json'
  };
}

function branch(env) {
  return env.GITHUB_BRANCH || 'main';
}

function contentsUrl(env, path) {
  return GITHUB_API + '/repos/' + env.GITHUB_OWNER + '/' + env.GITHUB_REPO +
    '/contents/' + path.split('/').map(encodeURIComponent).join('/');
}

// I contenuti sono in italiano: senza passare per i byte, gli accenti si
// romperebbero sia in lettura sia in scrittura.
export function base64ToText(base64) {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function readFile(env, path) {
  const response = await fetch(contentsUrl(env, path) + '?ref=' + encodeURIComponent(branch(env)), {
    headers: headers(env)
  });

  if (response.status === 404) return { sha: null, text: null };
  if (!response.ok) {
    throw new Error('Lettura di ' + path + ' non riuscita (GitHub ' + response.status + ')');
  }

  const payload = await response.json();
  return { sha: payload.sha, text: base64ToText(payload.content || '') };
}

export async function writeFile(env, path, base64Content, message, sha) {
  const body = {
    message: message,
    content: base64Content,
    branch: branch(env)
  };
  if (sha) body.sha = sha;

  const response = await fetch(contentsUrl(env, path), {
    method: 'PUT',
    headers: headers(env),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text();
    // Lo stato viaggia sull'errore invece di essere ripescato dal testo del
    // messaggio: il corpo restituito da GitHub potrebbe contenere "409" per
    // conto suo e far scambiare un errore qualsiasi per un conflitto.
    const error = new Error('Scrittura di ' + path + ' non riuscita (GitHub ' + response.status + '): ' + detail.slice(0, 200));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// Un file di contenuto illeggibile non deve bloccare il salvataggio: si
// riparte da un oggetto vuoto e i campi vengono riscritti.
export function parseJsonObject(text) {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

// Scrive un file JSON ricalcolando il contenuto a ogni tentativo.
//
// `buildValue` riceve il contenuto attuale del file e restituisce quello da
// scrivere. Viene richiamata dopo ogni rilettura, ed è questo il punto: se
// fra la lettura e la scrittura qualcun altro ha salvato, GitHub rifiuta il
// commit con 409 e si riparte dai dati aggiornati. Calcolare il contenuto
// una volta sola e riprovare col solo sha nuovo significherebbe cancellare
// la modifica dell'altro, che è esattamente quello che si vuole evitare.
export async function writeJsonFile(env, path, buildValue, message) {
  return writeTextFile(env, path, function (text) {
    return JSON.stringify(buildValue(parseJsonObject(text)), null, 2) + '\n';
  }, message);
}

// Lo stesso ciclo di rilettura per un file di testo qualsiasi. `buildText`
// riceve il testo attuale e restituisce quello nuovo; se restituisce lo
// stesso testo non si fa nessun commit, che sarebbe vuoto.
export async function writeTextFile(env, path, buildText, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await readFile(env, path);
    const text = buildText(current.text);
    if (text === current.text) return null;

    try {
      return await writeFile(env, path, textToBase64(text), message, current.sha);
    } catch (error) {
      if (error.status !== 409 || attempt === 1) throw error;
    }
  }
}

// Serve solo lo sha, quindi il contenuto non viene decodificato: per
// un'immagine da qualche megabyte sarebbe lavoro sprecato.
async function readSha(env, path) {
  const response = await fetch(contentsUrl(env, path) + '?ref=' + encodeURIComponent(branch(env)), {
    headers: headers(env)
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error('Lettura di ' + path + ' non riuscita (GitHub ' + response.status + ')');
  }

  const payload = await response.json();
  return payload.sha || null;
}

export async function deleteFile(env, path, message) {
  const sha = await readSha(env, path);
  if (!sha) return;

  const response = await fetch(contentsUrl(env, path), {
    method: 'DELETE',
    headers: headers(env),
    body: JSON.stringify({ message: message, sha: sha, branch: branch(env) })
  });

  if (!response.ok) {
    throw new Error('Cancellazione di ' + path + ' non riuscita (GitHub ' + response.status + ')');
  }
}
