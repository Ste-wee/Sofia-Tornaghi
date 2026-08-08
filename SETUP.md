# Configurazione del sito

Il sito è statico e gira su **Cloudflare Pages**. Sopra ci sono due cose che
richiedono una configurazione iniziale:

- i **contatti**, cioè i pulsanti che aprono WhatsApp, l'email o il telefono;
- il **pannello di gestione** su `/admin`, con cui Sofia modifica i testi e la
  foto senza toccare il codice e senza bisogno di un account GitHub.

Tutto quello che segue si fa una volta sola.

---

## 1. Recapiti per i contatti

Il sito non ha un modulo da compilare: nella sezione Contatti ci sono pulsanti
che aprono direttamente WhatsApp, il programma di posta o il telefono del
visitatore. Non passa nessun dato da server di terze parti, perché il sito non
raccoglie niente: mette solo in comunicazione due persone.

I recapiti si impostano dal pannello `/admin`, sezione **Come farsi
contattare**:

- **Indirizzo email** — attiva il pulsante "Scrivimi una email".
- **Numero WhatsApp** — con prefisso internazionale, es. `+39 335 166 5278`.
  Se lo lasci vuoto e il campo *Telefono* contiene un cellulare italiano,
  WhatsApp usa automaticamente quel numero.
- **Messaggio precompilato** — il testo che il visitatore si ritrova già
  scritto su WhatsApp e può modificare prima di inviare.

**Ogni pulsante compare solo se il recapito è configurato.** Un campo vuoto
non produce un pulsante che non porta da nessuna parte. Il pulsante di
prenotazione su MioDottore è invece sempre presente.

Gli indirizzi non sono scritti nell'HTML: arrivano da `content/site.json`
tramite JavaScript, il che li rende meno facili da raccogliere per i robot
che cercano email da spammare.

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
  salvato qui. Con i contatti diretti i messaggi viaggiano da WhatsApp o dal
  programma di posta del visitatore alla casella di Sofia, senza toccare né
  il sito né il repository.

---

## Note pratiche sui contatti diretti

- **WhatsApp è di Meta.** Il primo contatto va benissimo, ma è bene che lo
  scambio resti sul piano organizzativo (disponibilità, appuntamenti) e che i
  contenuti clinici si affrontino in seduta. Per questo il messaggio
  precompilato è volutamente generico.
- **Numero dedicato.** Se il numero del sito è lo stesso personale, vale la
  pena valutare una seconda utenza o WhatsApp Business, così i contatti di
  lavoro restano separati.
- **Su computer** il pulsante email apre il programma di posta predefinito.
  Chi non ne ha uno configurato vede comunque l'indirizzo scritto sotto al
  pulsante e può copiarlo.

---

## In sospeso

- **Informativa privacy.** Con i contatti diretti il sito non raccoglie più
  dati, quindi non serve più una casella di consenso. Resta comunque
  opportuna una breve pagina di informativa, dato che Sofia tratta i dati dei
  pazienti nella sua attività.
- **Font Google.** Sono caricati da `fonts.googleapis.com`, che riceve l'IP di
  ogni visitatore. Ospitarli direttamente sul sito eliminerebbe il problema.
