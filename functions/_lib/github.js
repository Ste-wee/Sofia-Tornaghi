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
    throw new Error('Scrittura di ' + path + ' non riuscita (GitHub ' + response.status + '): ' + detail.slice(0, 200));
  }

  return response.json();
}

// Rilegge lo sha subito prima di scrivere: se nel frattempo qualcun altro
// ha salvato, GitHub rifiuta il commit con 409 e qui si riprova una volta
// sui dati aggiornati, invece di sovrascrivere in silenzio.
export async function writeJsonFile(env, path, value, message) {
  const base64 = textToBase64(JSON.stringify(value, null, 2) + '\n');

  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await readFile(env, path);
    try {
      return await writeFile(env, path, base64, message, current.sha);
    } catch (error) {
      const isConflict = String(error.message).indexOf('409') !== -1;
      if (!isConflict || attempt === 1) throw error;
    }
  }
}
