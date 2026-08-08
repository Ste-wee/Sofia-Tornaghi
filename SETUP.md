# Configurazione del sito

Il sito è statico e gira su **Cloudflare Pages**. Sopra ci sono due cose che
richiedono una configurazione iniziale:

- il **modulo contatti**, che invia le email tramite Web3Forms;
- il **pannello di gestione** su `/admin`, con cui Sofia modifica i testi e la
  foto senza toccare il codice e senza bisogno di un account GitHub.

Tutto quello che segue si fa una volta sola.

---

## 1. Chiave per il modulo contatti

1. Vai su [web3forms.com](https://web3forms.com) e inserisci l'indirizzo email a
   cui devono arrivare i messaggi del sito.
2. Arriva una **Access Key** via email.
3. Incollala nel pannello `/admin`, sezione **Modulo contatti**, e salva.

Non serve modificare il codice: la chiave sta in `content/site.json` e viene
letta dalla pagina all'avvio. È una chiave **pubblica** — è pensata per stare
nell'HTML — quindi non è un segreto, ma chiunque la legga può usarla per
inviare messaggi a quella casella. Se arriva spam, si attiva hCaptcha dal
pannello di Web3Forms.

Finché la chiave è vuota, il modulo mostra un avviso e invita a usare la
prenotazione online: non fallisce in silenzio.

---

## 2. Token GitHub per il pannello

Il pannello salva le modifiche facendo un commit sul repository. Serve un token
con il permesso minimo per farlo.

1. GitHub → Settings → Developer settings → **Personal access tokens** →
   *Fine-grained tokens* → **Generate new token**
2. **Repository access**: solo `Ste-wee/Sofia-Tornaghi`
3. **Permissions** → Repository permissions → **Contents: Read and write**
   (nient'altro)
4. Imposta una scadenza e segnati in agenda di rigenerarlo prima che scada:
   quando scade, il pannello smette di salvare.

---

## 3. Variabili su Cloudflare Pages

Cloudflare Dashboard → il progetto Pages → **Settings** → **Environment
variables** → aggiungile per l'ambiente *Production* (e *Preview*, se usi le
anteprime).

| Nome | Tipo | Valore |
|---|---|---|
| `ADMIN_PASSWORD` | **Secret** | La password con cui Sofia entra in `/admin` |
| `SESSION_SECRET` | **Secret** | Una stringa casuale lunga, serve solo al server |
| `GITHUB_TOKEN` | **Secret** | Il token del punto 2 |
| `GITHUB_OWNER` | Testo | `Ste-wee` |
| `GITHUB_REPO` | Testo | `Sofia-Tornaghi` |
| `GITHUB_BRANCH` | Testo | `main` (facoltativa, è già il valore predefinito) |

Le prime tre vanno inserite come **Secret** (crittografate, non più
rileggibili dal pannello Cloudflare), non come variabili di testo.

Per generare `SESSION_SECRET` e una buona `ADMIN_PASSWORD`:

```bash
openssl rand -base64 32
```

Dopo aver salvato le variabili serve un **nuovo deploy** perché vengano
applicate (Deployments → Retry deployment).

---

## 4. Come si usa il pannello

Sofia apre `https://<il-dominio>/admin`, inserisce la password ed è dentro.

- I testi sono raggruppati per sezione del sito. Si modificano e si preme
  **Salva le modifiche**.
- La foto si carica dalla sezione in cima: parte subito, senza premere Salva.
- Ogni salvataggio è un commit sul repository, quindi resta lo storico ed è
  sempre possibile tornare indietro.
- Il sito pubblico si aggiorna dopo la ricostruzione automatica di Cloudflare,
  circa un minuto.
- La sessione dura 8 ore, poi va rifatto il login.

---

## Note di sicurezza

- Il token GitHub sta **solo lato server**, nelle variabili di Cloudflare. Chi
  usa il pannello non lo vede e non può estrarlo.
- Il pannello accetta in scrittura **solo i campi previsti** in
  `functions/_lib/schema.js`: non è possibile usarlo per scrivere altri file
  del repository.
- Le immagini vengono accettate solo se i primi byte del file corrispondono
  davvero a un JPG, PNG o WebP, con un limite di 3 MB. Il nome del file lo
  decide il server.
- Il cookie di sessione è `HttpOnly`, `Secure` e `SameSite=Strict`.
- I tentativi di login sbagliati vengono rallentati. Per una protezione più
  robusta conviene aggiungere una **Rate limiting rule** di Cloudflare su
  `/api/login` (es. 10 richieste al minuto per IP).
- Il repository è **pubblico**: nessun messaggio dei pazienti passa o viene
  salvato qui. Le email del modulo vanno direttamente da Web3Forms alla
  casella di Sofia.

---

## In sospeso

- **Informativa privacy.** Il modulo contatti ha una casella di consenso al
  trattamento dei dati, ma la pagina con l'informativa non esiste ancora.
  Trattandosi di dati raccolti da una psicologa, e potenzialmente relativi
  alla salute (art. 9 GDPR), l'informativa va scritta e collegata prima di
  promuovere il modulo.
- **Font Google.** Sono caricati da `fonts.googleapis.com`, che riceve l'IP di
  ogni visitatore. Ospitarli direttamente sul sito eliminerebbe il problema.
