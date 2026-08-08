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
- Dominio di prenotazione esterno: MioDottore.
- **Hosting: da decidere.** Vedi il capitolo *Decisione aperta* qui sotto: al
  momento esistono due impianti diversi su due branch diversi, e `main` è
  ancora fermo alla vecchia versione Netlify.

---

## ⚠️ Decisione aperta: due impianti in parallelo

**Nessuno dei due è su `main`.** `main` è ancora la versione Netlify di luglio,
con il CMS rotto. Prima di scrivere altro codice va deciso quale impianto
tenere, perché toccano gli stessi file in modi inconciliabili.

**Punto fermo dell'8 agosto:** il modulo di contatto non serve più, restano i
pulsanti diretti (WhatsApp, email, telefono). Vale qualunque impianto si
scelga, quindi Formspree esce di scena.

**Ancora da decidere:** dove ospitare e quale pannello usare. Stefano
preferirebbe restare su GitHub. Da tenere presente che **GitHub Pages non
esegue codice lato server**, e che *entrambe* le soluzioni di CMS ne hanno
bisogno: il nostro pannello per le API, Decap per il proxy OAuth del login.
Non esiste quindi la variante "solo GitHub Pages": serve comunque un secondo
servizio, oppure si sposta l'hosting su una piattaforma che esegue codice
(il repository resta su GitHub in ogni caso).

### Branch `fix/audit-codice-e-ui` (5 agosto)

- **GitHub Pages + GitHub Actions.** `index.html` viene *generato* da
  `content/site.json` a ogni push, tramite `build.js` e
  `templates/index.template.html`. Niente più caricamento dei testi a runtime:
  `content-loader.js` è stato eliminato.
- **CMS Decap** con backend `github` e un Cloudflare Worker per il login OAuth
  (`docs/cloudflare-worker-oauth.js`). Sofia entrerebbe **con un account
  GitHub**. Il Worker non è pubblicato: in `admin/config.yml` c'è ancora un
  segnaposto, quindi il login non funziona.
- **Modulo contatti su Formspree**, anche qui con l'ID segnaposto da sostituire.
- **Microsoft Clarity** attivo con ID reale `xxofk1n8l1`: registra le visite e
  le mappe di click. Da valutare: su un sito di psicologa serve un banner
  cookie, e il masking va tenuto su *Strict*.
- Aggiunge `favicon.svg`. Si porta ancora dietro `netlify.toml`.

### Branch `claude/dove-siamo-rimasti-nrsh36` (8 agosto, questo)

- **Cloudflare Pages + Pages Functions.** Nessuna build: `index.html` è statico
  e `content-loader.js` inserisce i testi nel browser.
- **Pannello scritto da noi**, login a password. Sofia **non ha bisogno di un
  account GitHub**. Funziona già, mancano solo le variabili su Cloudflare.
- **Nessun modulo**: pulsanti che aprono WhatsApp, email o telefono.
- `_headers` con CSP e intestazioni di sicurezza (funziona solo su Cloudflare).

### Cosa cambia scegliere l'uno o l'altro

| | `fix/audit-codice-e-ui` | `claude/dove-siamo-rimasti-nrsh36` |
|---|---|---|
| Hosting | GitHub Pages | Cloudflare Pages |
| Login di Sofia | account GitHub | password |
| Testi in pagina | generati alla build | caricati dal browser |
| Contatti | modulo Formspree | WhatsApp / email / telefono |
| Statistiche | Microsoft Clarity | nessuna |
| Pronto all'uso | no: Worker e ID Formspree mancanti | quasi: mancano le variabili |

I due branch riscrivono entrambi pesantemente `index.html` e `style.css`:
**non si fondono senza un lavoro di riconciliazione a mano.** Le parti
recuperabili dall'altro branch, qualunque sia la scelta, sono la favicon,
l'idea della build che protegge dai salvataggi malformati, e le correzioni di
accessibilità del primo commit.

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

0. **Scegliere quale dei due impianti tenere** e portarlo su `main`. Blocca
   tutto il resto: finché non è deciso, ogni riga scritta rischia di finire
   sul ramo che verrà abbandonato. *Tocca a Stefano.*

Se si prosegue con l'impianto Cloudflare:

1. **Configurare le variabili su Cloudflare** — finché non è fatto, il pannello
   risponde "configurazione incompleta". Il sito pubblico funziona comunque.
   Istruzioni in `SETUP.md`. *Tocca a Stefano.*
2. **Inserire l'indirizzo email** dal pannello: è l'unico recapito ancora
   vuoto, quindi al momento il pulsante email non compare.

In ogni caso, qualunque impianto si scelga:

3. **Informativa privacy** — non più bloccante da quando il modulo non c'è più,
   ma resta opportuna. Se si tiene Microsoft Clarity serve anche un banner
   cookie.
4. **Font Google** caricati da `fonts.googleapis.com`, che riceve l'IP di ogni
   visitatore. Ospitarli sul sito chiuderebbe la questione.
5. **Manca la favicon** (ce n'è una pronta sull'altro branch); mancano
   `canonical` e `og:url`.
6. `index.html` dice "tutte le **16** recensioni" con il numero scritto a mano,
   mentre `recensioni_num` è modificabile dal pannello: prima o poi divergono.
7. `script.js` non ha guardie sugli `id`: se uno cambia, l'errore blocca il
   resto del file, menu mobile compreso.

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
