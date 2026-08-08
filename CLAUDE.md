# Sito della Dott.ssa Sofia Tornaghi

> **Questo file è la memoria del progetto.** Va aggiornato alla fine di ogni
> sessione di lavoro: stato, decisioni prese, cose rimaste in sospeso. Serve a
> ripartire senza dover ricostruire il contesto dai commit.
>
> Ultimo aggiornamento: **8 agosto 2026**

---

## Cos'è

Sito vetrina di una psicologa di Milano: presentazione, aree di lavoro,
recensioni, tariffe, contatti. Pagina singola, nessun framework, nessuna build.
Sopra c'è un pannello di gestione che permette a Sofia di modificare testi e
foto da sola.

**Due persone in gioco:**
- **Stefano** — segue il progetto, ha accesso a GitHub e Cloudflare.
- **Sofia** — la psicologa. Non è tecnica: per lei esiste solo `/admin` con una
  password. Non ha e non deve avere un account GitHub.

## Dove gira

- **Repository: `Ste-wee/Sofia-Tornaghi`, pubblico.** Conta: qui non deve mai
  finire nulla di riservato, in particolare nessun messaggio di pazienti.
- **Hosting: Cloudflare Pages**, collegato a questo repository e ricostruito a
  ogni push su `main`. Il codice, le PR e la storia restano su GitHub: cambia
  solo chi serve le pagine.
- Dominio di prenotazione esterno: MioDottore.

---

## Impianto scelto (8 agosto 2026)

Per un periodo sono esistiti due impianti in parallelo su due branch che non
sapevano l'uno dell'altro. **La biforcazione è chiusa.** Scelta presa:

| | Scelto | Scartato |
|---|---|---|
| Hosting | Cloudflare Pages | GitHub Pages + Actions |
| Pannello | scritto da noi, login a **password** | Decap CMS via OAuth GitHub |
| Contatti | pulsanti WhatsApp / email / telefono | modulo Formspree |
| Statistiche | nessuna | Microsoft Clarity |

### Perché

- **Sofia non deve avere un account GitHub.** Con Decap le servirebbe: creare
  l'account, accettare l'invito come collaboratrice, fare login OAuth. E come
  collaboratrice avrebbe accesso in scrittura a *tutto* il repository, non solo
  ai testi. Col nostro pannello ha una password e può toccare esclusivamente i
  campi dello schema.
- **GitHub Pages non esegue codice lato server**, e servirebbe comunque: il
  nostro pannello per le API, Decap per il proxy OAuth. Nessuna delle due
  strade evitava un secondo servizio, quindi tenere tutto su Cloudflare
  significa un servizio invece di due.
- Il nostro pannello è ~400 righe senza dipendenze, già scritto e verificato.
  Decap è una libreria di terze parti caricata da `unpkg` con range di versione
  aperto, dentro una pagina che ha in mano un token di scrittura sul repo.

**Se un domani servisse un CMS vero** — più tipi di contenuto, un blog,
anteprime, workflow editoriale — Decap tornerebbe a essere la scelta giusta.
Per 45 campi fissi e una foto è sovradimensionato.

### Cosa è stato recuperato dal branch scartato

`favicon.svg`, le correzioni di accessibilità (SVG decorative nascoste ai
lettori di schermo, stato del menu annunciato, foto in cima caricata subito),
il numero di recensioni non più scritto a mano nell'HTML, e un refuso nei
testi pubblicati (*"ceh"* → *"che"* in `area5_desc`).

**Non ancora recuperato, ma valido:** l'idea di generare `index.html` dai
contenuti alla build invece di popolarlo nel browser. I testi finirebbero
dentro la pagina, il che è meglio per i motori di ricerca e per chi ha una
connessione lenta. Applicabile in seguito senza rifare nulla.

Il branch `fix/audit-codice-e-ui` può essere chiuso una volta portato su `main`
l'impianto scelto.

## Struttura

```
index.html          la pagina, con segnaposto data-content sui testi modificabili
style.css           tutti gli stili
script.js           navbar e menu mobile
content-loader.js   carica i JSON nella pagina e costruisce i link di contatto
content/site.json   45 testi e recapiti modificabili dal pannello
content/foto.json   il nome del file della foto profilo
admin/index.html    il pannello di gestione (login + editor)
functions/api/      login, logout, content, upload — Cloudflare Pages Functions
functions/_lib/     auth, github, schema — codice condiviso fra le API
_headers            CSP e intestazioni di sicurezza
SETUP.md            configurazione: variabili Cloudflare, token, recapiti
```

## Come funziona il pannello

Sofia apre `/admin`, entra con una password, modifica i campi e salva. Ogni
salvataggio è **un commit su GitHub via API**, quindi resta lo storico ed è
sempre possibile tornare indietro. Cloudflare ricostruisce il sito: le
modifiche sono online dopo circa un minuto.

- La password è il secret `ADMIN_PASSWORD` su Cloudflare; il confronto è a
  tempo costante e i tentativi falliti vengono rallentati.
- La sessione è un cookie firmato in HMAC-SHA256, HttpOnly + Secure +
  SameSite=Strict, valido 8 ore.
- Il token GitHub sta **solo lato server**: il browser non lo vede mai.
- **`functions/_lib/schema.js` è la fonte di verità dei campi.** Il pannello
  costruisce il modulo da lì e il salvataggio accetta *solo* quelle chiavi. Per
  aggiungere un campo modificabile: aggiungerlo allo schema e mettere il
  segnaposto `data-content="nome_campo"` nell'HTML.

## Contatti

Non c'è un modulo da compilare. Ci sono pulsanti che aprono direttamente
WhatsApp, il programma di posta o il telefono del visitatore. Il sito **non
raccoglie nessun dato**, e questo è deliberato: i messaggi a una psicologa
ricadono facilmente nei dati sanitari dell'art. 9 GDPR, e non farli passare da
un fornitore terzo toglie il problema alla radice.

I recapiti stanno in `site.json` e si impostano dal pannello. Ogni pulsante
compare solo se il recapito è valido. Se manca il numero WhatsApp si riusa
quello di telefono, ma solo se è un cellulare.

## Convenzioni

- **Italiano ovunque**: interfaccia, commenti nel codice, messaggi di commit.
- Niente framework, niente dipendenze, niente passo di build. Il sito deve
  restare apribile e modificabile a mano.
- I contenuti finiscono in pagina con `textContent`, mai `innerHTML`.
- I commenti nel codice spiegano *perché*, non *cosa*.
- Sviluppo sul branch indicato dalla sessione, mai direttamente su `main`.

---

## Stato dei lavori

### Fatto

- **Giugno–luglio 2026** — sito costruito; CMS Decap su Netlify con
  git-gateway; Sofia ha usato il pannello per aggiornare i testi (ultime
  modifiche sue il 18 luglio).
- **5 agosto 2026** — branch `fix/audit-codice-e-ui`: correzioni di
  accessibilità, generazione dell'HTML dai contenuti, migrazione a GitHub
  Pages + Formspree, Clarity. Mai portato su `main`. Dettagli sopra.
- **8 agosto 2026** — passaggio da Netlify a Cloudflare. Questo ha rotto il CMS,
  perché git-gateway è un servizio Netlify. Ricostruito da zero:
  - pannello di gestione scritto da noi su Pages Functions, con login a
    password e salvataggio via API GitHub;
  - rimosso il widget Netlify Identity e la configurazione Decap;
  - `_headers` con CSP, HSTS, `noindex` su `/admin` e `/api`;
  - modulo contatti sostituito dai pulsanti di contatto diretto;
  - corretto un numero di ripiego nell'HTML rimasto a un vecchio `02`.

### In sospeso

1. **Portare l'impianto su `main`** e collegare Cloudflare Pages al
   repository. Finché `main` resta la versione Netlify di luglio, il sito
   pubblicato non ha nulla di tutto questo.
2. **Configurare le variabili su Cloudflare** — finché non è fatto, il pannello
   risponde "configurazione incompleta". Il sito pubblico funziona comunque.
   Istruzioni in `SETUP.md`. *Tocca a Stefano.*
3. **Inserire l'indirizzo email** dal pannello: è l'unico recapito ancora
   vuoto, quindi al momento il pulsante email non compare.
4. **Informativa privacy** — non più bloccante da quando il modulo non c'è più,
   ma resta opportuna.
5. **Font Google** caricati da `fonts.googleapis.com`, che riceve l'IP di ogni
   visitatore. Ospitarli sul sito chiuderebbe la questione.
6. Mancano `canonical` e `og:url`.
7. **Generazione alla build** dei testi dentro `index.html`, ripresa dal branch
   scartato: meglio per i motori di ricerca. Da valutare quando il resto è in
   piedi.

### Decisioni prese, da non rimettere in discussione senza motivo

- **Niente account GitHub per Sofia.** È il motivo per cui il pannello usa una
  password e non OAuth: sarebbe stato più semplice da scrivere ma inutilizzabile
  per lei.
- **Niente modulo di contatto.** Scelta di agosto 2026: meno attrito per chi
  scrive e nessun dato sanitario che transita da terzi.
- **Nessun dato di pazienti nel repository**, che è pubblico.

## Prima di iniziare a lavorare

Il lavoro si è già biforcato una volta perché due sessioni non sapevano l'una
dell'altra. Per non ripetere l'errore, all'inizio di ogni sessione:

```bash
git fetch origin && git branch -r        # quali rami esistono davvero
git log --oneline origin/main -5         # cosa c'e' su main adesso
```

Se compare un branch non citato in questo file, va esaminato **prima** di
scrivere codice, e questo file va aggiornato di conseguenza.

## Come verificare le modifiche

Non ci sono test automatici nel repository. Le verifiche si fanno così:

```bash
python3 -m http.server 8899     # poi aprire http://localhost:8899
```

Chromium e Playwright sono disponibili nell'ambiente remoto per controllare in
un browser vero che i link di contatto si costruiscano bene e che il pannello
si comporti come deve. Le API si provano simulando `fetch` verso GitHub, senza
toccare il repository reale.
