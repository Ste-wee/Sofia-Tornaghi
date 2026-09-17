# Sito della Dott.ssa Sofia Tornaghi

> **Questo file è la memoria del progetto.** Va aggiornato alla fine di ogni
> sessione di lavoro: stato, decisioni prese, cose rimaste in sospeso. Serve a
> ripartire senza dover ricostruire il contesto dai commit.
>
> Ultimo aggiornamento: **17 settembre 2026** — pulizie e riordino della pagina

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
- **Hosting: Cloudflare Pages**, progetto `website-sofy`, su
  `https://website-sofy.pages.dev/`. Collegato al repository, si ricostruisce a
  ogni push su `main`. È l'unica delle piattaforme provate che esegue
  `functions/api/`, quindi **il pannello funziona solo qui**.
  Verificato il 24 agosto 2026: login, lettura da GitHub e salvataggio
  funzionano davvero — il commit `613bacd` è stato fatto dal pannello. Anche
  `_headers` viene applicato: le intestazioni di sicurezza arrivano al
  visitatore.
  ⚠️ Il nome `website-sofy` **non è rinominabile**: su Pages il sottodominio è
  fissato alla creazione. Per cambiarlo va rifatto il progetto da zero,
  variabili comprese.
- **Nessuna copia di troppo**, verificato con `curl` il 17 settembre 2026:
  GitHub Pages spento (404 dall'origine, non dalla cache) e Netlify cancellato.
  `website-sofy.pages.dev` è l'unico indirizzo vivo.
  ⚠️ Spegnendo GitHub Pages la CDN continua a servire il sito per una decina
  di minuti: un 200 subito dopo non vuol dire che l'operazione sia fallita. Si
  distingue dall'intestazione: `X-Cache: HIT` con `Age` basso è cache
  residua, `X-Cache: MISS` è la risposta vera dell'origine.
- Non esiste ancora un dominio proprio: l'indirizzo pubblico è quello
  `pages.dev`. **Conseguenza concreta:** la Rate limiting rule su `/api/login`
  non è configurabile, perché il WAF di Cloudflare funziona solo sui domini
  gestiti dall'account. Finché è così il pannello è protetto dalla sola
  password, che quindi **deve restare quella generata a caso** e non una
  memorizzabile.
- Il Worker `sofia-tornaghi` e la GitHub OAuth App, avanzi dell'impianto OAuth
  scartato, sono stati **cancellati** il 17 settembre 2026.
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
Per una cinquantina di campi fissi e una foto è sovradimensionato.

### Cosa è stato recuperato dal branch scartato

`favicon.svg`, le correzioni di accessibilità (SVG decorative nascoste ai
lettori di schermo, stato del menu annunciato, foto in cima caricata subito),
il numero di recensioni non più scritto a mano nell'HTML, e un refuso nei
testi pubblicati (*"ceh"* → *"che"* in `area5_desc`).

**Non ancora recuperato, ma valido:** l'idea di generare `index.html` dai
contenuti alla build invece di popolarlo nel browser. I testi finirebbero
dentro la pagina, il che è meglio per i motori di ricerca e per chi ha una
connessione lenta. Applicabile in seguito senza rifare nulla.

Il branch `fix/audit-codice-e-ui` **può essere chiuso**: l'impianto scelto è su
`main` dall'8 agosto e quel che valeva la pena tenere è già stato portato via.

## Struttura

```
index.html          la pagina, con segnaposto data-content sui testi modificabili
style.css           tutti gli stili
script.js           navbar e menu mobile
content-loader.js   carica i JSON nella pagina e costruisce i link di contatto
content/site.json   49 testi e recapiti modificabili dal pannello
content/foto.json   il nome del file della foto profilo
admin/index.html    il pannello di gestione (login + editor)
functions/api/      login, logout, content, upload — Cloudflare Pages Functions
functions/_lib/     auth, github, schema — codice condiviso fra le API
_headers            CSP e intestazioni di sicurezza
SETUP.md            configurazione: variabili Cloudflare, token, recapiti
```

**Ordine delle sezioni nella pagina**, deciso il 17 settembre 2026:

> Chi sono → Aree di specializzazione → **Inizia il tuo percorso** →
> Recensioni → Servizi e tariffe → Contatti

Letto di seguito: chi sono, cosa tratto, come funziona, cosa dicono i
pazienti, quanto costa, come scrivermi. "Inizia il tuo percorso" sta li'
perche' risponde alla domanda che nasce subito dopo le aree — *mi ci
riconosco, e adesso come funziona?* — e non in fondo, dove arrivava a chi
aveva gia' deciso.

Le sezioni alternano sfondo avorio e grigio (`section.alt`). **Inserendone o
togliendone una va risistemata l'alternanza su tutte quelle che seguono**,
altrimenti due sezioni adiacenti dello stesso colore si fondono.

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

Il numero **si formatta al momento di mostrarlo**, non nel pannello: se Sofia
lo scrive tutto attaccato viene spezzato 3-3-4, se ci mette gia' degli spazi
si lascia com'e'. Solo sui cellulari italiani — sui fissi la lunghezza del
prefisso cambia da citta' a citta' e raggrupparli male si noterebbe. Il numero
su cui si chiama resta comunque il formato internazionale completo nell'href.

## Convenzioni

- **Italiano ovunque**: interfaccia, commenti nel codice, messaggi di commit.
- Niente framework, niente dipendenze, niente passo di build. Il sito deve
  restare apribile e modificabile a mano.
- I contenuti finiscono in pagina con `textContent`, mai `innerHTML`.
- **Griglie a due colonne: `repeat(2, 1fr)` più il ritorno a una sola nel
  blocco `@media (max-width: 768px)`.** È così che funzionano gia'
  `.services-list` e `.areas-grid`, e conviene seguirle invece di
  inventare ogni volta.
  `auto-fit` con `minmax` va bene solo quando il numero di colonne puo'
  davvero variare — due blocchi di testo che si impilano, per dire. Su un
  contenuto di quattro elementi che vanno divisi in parti uguali, su schermo
  largo ne affianca tre e lascia il quarto spaiato.
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
  - corretto un numero di ripiego nell'HTML rimasto a un vecchio `02`;
  - **unito su `main`** con la PR #2, insieme a favicon, correzioni di
    accessibilità e il refuso *"ceh"* → *"che"* recuperati dal ramo scartato.
- **9 agosto 2026** — la biforcazione si è ripresentata: una sessione è
  ripartita da `fix/audit-codice-e-ui` senza fare `git fetch`, e ha portato
  Stefano a creare per niente un Worker Cloudflare per OAuth e una GitHub
  OAuth App, oltre a un account Formspree. **Roba da buttare: il pannello usa
  una password, non OAuth, e il modulo di contatto non esiste più.** Il locale
  è stato riallineato a `main` e il branch non serve più a nulla.
  Poi, rileggendo il codice unito con la PR #2, corretti quattro difetti:
  - `writeJsonFile` prometteva di non sovrascrivere le modifiche altrui ma
    faceva l'opposto (contenuto calcolato una volta sola, prima del ciclo di
    riprova); ora l'unione si rifà sui dati riletti;
  - il conflitto 409 si riconosceva cercando la stringa nel messaggio d'errore,
    che include il corpo restituito da GitHub; ora si guarda lo stato;
  - le foto sostituite non venivano mai cancellate;
  - `font-src` senza `'self'` avrebbe bloccato i font una volta ospitati in
    casa (vedi le cose in sospeso, "Font Google").

  Sciolto anche il dubbio su chi pubblica il sito: **è GitHub Pages** (dettagli
  in "Dove gira"). Confermata la scelta di tenere il pannello, quindi il
  trasloco su Cloudflare Pages diventa obbligatorio e non piu' rinviabile: le
  due cose non possono coesistere.

- **24 agosto 2026** — **trasloco completato: il pannello funziona.** Creato il
  progetto Cloudflare Pages `website-sofy`, configurate le cinque variabili,
  verificata l'intera catena: login, lettura dei contenuti da GitHub e
  salvataggio. Il commit `613bacd` è stato fatto da Sofia dal pannello, quindi
  anche il permesso di scrittura del token è provato.
  Netlify cancellato. Restano accesi GitHub Pages (da spegnere) e il Worker
  OAuth inutile (da cancellare).
  Due cose imparate, che valgono per il futuro:
  - **la GET su `/api/login` non dice niente**: risponde 200 servendo la home,
    perché quando la funzione non gestisce il metodo Cloudflare ripiega sui
    file statici. La prova che le Functions girano è un **POST**, che deve
    tornare JSON;
  - **il nome di un progetto Pages non si cambia**: il sottodominio è fissato
    alla creazione.

- **17 settembre 2026** — pulizie e riordino della pagina, tutte cose emerse
  guardandola insieme a Stefano schermo per schermo.
  - **Gli a capo di Sofia venivano ignorati.** Aveva scritto testi su piu'
    righe, con un titoletto e tre punti elenco sul consenso informato: in HTML
    un a capo vale come uno spazio, e in `style.css` non c'era nulla che lo
    prevedesse. Il blocco dei contatti era un muro da 1598 px. Ora
    `content-loader.js` mette la classe `.testo-a-capo` quando il testo ne
    contiene, e solo allora.
  - **Tolte le informazioni ripetute dai contatti.** Delle quattro voci con
    icona, indirizzo, telefono e "consulenze online" erano gia' scritti
    altrove — l'indirizzo compariva quattro volte. L'unica che stava solo li'
    erano i metodi di pagamento, spostati sotto le tariffe (dove la domanda
    nasce) e resi modificabili dal pannello.
  - **Tolte due didascalie** sotto i pulsanti: dicevano cose di natura diversa
    dalle altre due, che mostrano il recapito.
  - **Barra in alto allineata al piè di pagina**: Contatti al posto di
    Recensioni.
  - **Nuova sezione "Inizia il tuo percorso"** fra le aree e le recensioni.
    La sezione contatti resta con i soli pulsanti, su colonna unica.
  - **Numero di telefono leggibile**, formattato al momento di mostrarlo.
  Chiusi anche i due punti in sospeso di agosto: GitHub Pages spento, Worker
  OAuth e GitHub OAuth App cancellati. L'email l'aveva gia' messa Sofia.

  Poi, guardando il risultato da PC, due sezioni si sono rivelate mal
  distribuite sulla larghezza:
  - **"Inizia il tuo percorso"** era una colonna di testo da 560px con 641px
    di bianco accanto. Ora due colonne, divise dove Sofia aveva gia' lasciato
    una riga vuota: le sedute da una parte, il consenso informato dall'altra.
    I campi diventano `percorso_sedute` e `percorso_consenso`.
  - **I contatti** erano l'unica sezione incolonnata al centro. Ora i quattro
    pulsanti stanno su due colonne, e il titolo si allinea a quello delle
    altre sezioni. Come effetto collaterale i pulsanti sulla stessa riga si
    pareggiano in altezza, il che chiude lo scarto 63/75px lasciato aperto
    dalla rimozione delle didascalie.

### In sospeso

1. **Registrare un dominio proprio**, da scegliere insieme a Sofia. Due motivi:
   l'indirizzo attuale contiene il nome utente GitHub di Stefano e non il suo,
   e **senza un dominio gestito dall'account non è configurabile la Rate
   limiting rule** su `/api/login` (punto 4 di `SETUP.md`), che è l'unica
   difesa contro i tentativi di password in parallelo.
   ⚠️ Finché il dominio non c'è, la password di Sofia **deve restare quella
   generata a caso**: è ciò che tiene in piedi la sicurezza del pannello al
   posto della regola mancante.
2. Mancano `canonical` e `og:url`.
3. **Informativa privacy** — non più bloccante da quando il modulo non c'è più,
   ma resta opportuna.
4. **Font Google** caricati da `fonts.googleapis.com`, che riceve l'IP di ogni
   visitatore. Ospitarli sul sito chiuderebbe la questione. La CSP è già stata
   sistemata per accoglierli (`font-src 'self'`).
5. **Generazione alla build** dei testi dentro `index.html`, ripresa dal branch
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

Il lavoro si è già biforcato **due volte** perché una sessione è ripartita
dallo stato locale senza guardare il remoto. La seconda volta è costato a
Stefano il tempo di creare un Worker OAuth, una GitHub OAuth App e un account
Formspree che non servivano a niente. Non è un passaggio formale: è la prima
cosa da fare, prima di leggere qualsiasi file.

```bash
git fetch origin && git branch -r        # quali rami esistono davvero
git log --oneline origin/main -5         # cosa c'e' su main adesso
git status                               # su che ramo siamo, e quanto e' vecchio
```

Se il ramo locale è indietro rispetto a `origin/main`, **allinearsi prima di
toccare qualsiasi cosa**: quello che c'è sul disco può descrivere un impianto
che è già stato scartato. Se compare un branch non citato in questo file, va
esaminato **prima** di scrivere codice, e questo file va aggiornato di
conseguenza.

## Come verificare le modifiche

Non ci sono test automatici nel repository. Le verifiche si fanno così:

```bash
python3 -m http.server 8899     # poi aprire http://localhost:8899
```

Chromium e Playwright sono disponibili nell'ambiente remoto per controllare in
un browser vero che i link di contatto si costruiscano bene e che il pannello
si comporti come deve. Le API si provano simulando `fetch` verso GitHub, senza
toccare il repository reale.
