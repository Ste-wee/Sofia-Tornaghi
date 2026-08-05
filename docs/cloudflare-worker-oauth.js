// Servizio che completa il login GitHub per il pannello di gestione
// (Decap CMS, backend "github" in admin/config.yml).
//
// QUESTO FILE NON GIRA SU QUESTO SITO: va incollato in un Cloudflare
// Worker a parte (gratuito, cloudflare.com -> Workers & Pages -> Create).
// Vive qui solo come riferimento versionato di cosa e' stato pubblicato.
//
// --- Come metterlo in funzione (in questo ordine) -------------------------
//
// 1. Crea il Worker su Cloudflare, incolla questo codice, pubblica.
//    Cloudflare ti da' un indirizzo tipo https://nome.account.workers.dev
//
// 2. Crea una GitHub OAuth App:
//    github.com -> Settings -> Developer settings -> OAuth Apps -> New OAuth App
//      Homepage URL:            https://ste-wee.github.io/Sofia-Tornaghi/
//      Authorization callback:  https://IL-TUO-WORKER.workers.dev/callback
//    (l'indirizzo di callback deve finire ESATTAMENTE con /callback)
//
// 3. GitHub ti mostra un Client ID e ti fa generare un Client Secret.
//    Nel Worker: Settings -> Variables and Secrets -> aggiungi
//      OAUTH_CLIENT_ID     = il Client ID
//      OAUTH_CLIENT_SECRET = il Client Secret (tipo "Secret", non "Text",
//                             cosi' resta cifrato e nessuno lo rilegge)
//
// 4. In admin/config.yml, sostituisci il segnaposto di "base_url" con
//    l'indirizzo vero del Worker (quello del punto 1). Questo valore NON
//    e' segreto, puo' stare tranquillamente nel repository.
//
// ---------------------------------------------------------------------------

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Passo 1 del login: Decap apre questa pagina in un popup, che rimanda
    // subito a GitHub per chiedere l'autorizzazione.
    if (url.pathname === '/auth') {
      const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
      authorizeUrl.searchParams.set('client_id', env.OAUTH_CLIENT_ID);
      authorizeUrl.searchParams.set('scope', 'repo,user');
      authorizeUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
      return Response.redirect(authorizeUrl.toString(), 302);
    }

    // Passo 2: GitHub riporta qui il visitatore dopo che ha autorizzato,
    // con un "code" temporaneo da scambiare con un token vero e proprio.
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Manca il parametro "code" nella richiesta.', { status: 400 });
      }

      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: env.OAUTH_CLIENT_ID,
          client_secret: env.OAUTH_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response('Errore restituito da GitHub: ' + tokenData.error_description, { status: 400 });
      }

      // Decap si aspetta di ricevere il token con questo preciso protocollo
      // a messaggi tra finestre (documentato dal progetto Decap CMS): prima
      // un "sono pronto", poi, quando il popup risponde, il token vero.
      const message =
        'authorization:github:success:' +
        JSON.stringify({ token: tokenData.access_token, provider: 'github' });

      const html = `<!DOCTYPE html>
<html><body>
<script>
  (function () {
    function riceviRisposta(e) {
      window.opener.postMessage(${JSON.stringify(message)}, e.origin);
      window.removeEventListener('message', riceviRisposta, false);
    }
    window.addEventListener('message', riceviRisposta, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body></html>`;

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return new Response('Servizio di login per il pannello di Sofia Tornaghi. Endpoint: /auth, /callback', {
      status: 200,
    });
  },
};
