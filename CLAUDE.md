# Sito della Dott.ssa Sofia Tornaghi

> **Questo file è la memoria del progetto.** Va aggiornato alla fine di ogni
> sessione di lavoro: stato, decisioni prese, cose rimaste in sospeso. Serve a
> ripartire senza dover ricostruire il contesto dai commit.
>
> Ultimo aggiornamento: **26 ottobre 2026**, sera — tutto online; restano i punti di Sofia e i rami da cancellare

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
- **Indirizzo pubblico: `https://sofiatornaghi.com`**, registrato il 29
  settembre 2026 su Cloudflare Registrar e intestato a Sofia. `www` rimanda al
  dominio nudo con un redirect 301 che conserva percorso e query, e `http`
  passa a `https` da solo. Il `.it` **non e' stato preso**, ed era libero al 29
  settembre.
- **Hosting: Cloudflare Pages**, progetto `website-sofy`, raggiungibile anche
  su `https://website-sofy.pages.dev/`. Collegato al repository, si ricostruisce a
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
  Restano vivi il dominio e `website-sofy.pages.dev`, che Cloudflare tiene
  acceso e **non si puo' spegnere**: a dire ai motori di ricerca quale dei due
  conta ci pensa il `canonical` in `index.html`.
  ⚠️ Spegnendo GitHub Pages la CDN continua a servire il sito per una decina
  di minuti: un 200 subito dopo non vuol dire che l'operazione sia fallita. Si
  distingue dall'intestazione: `X-Cache: HIT` con `Age` basso è cache
  residua, `X-Cache: MISS` è la risposta vera dell'origine.
- **La Rate limiting rule su `/api/login` è attiva** dal 29 settembre, resa
  possibile dal dominio: il WAF funziona solo sui domini gestiti dall'account.
  Valori e verifica nel punto 4 di `SETUP.md`.
  ⚠️ Sul piano gratuito i valori sono i minimi concessi — 5 richieste ogni 10
  secondi, blocco di 10 secondi — quindi rallenta un attacco di tre ordini di
  grandezza ma non lo ferma. **La password di Sofia deve restare quella
  generata a caso**: è lei la difesa vera, la regola è la seconda linea.
- **Le email sono protette dallo spoofing** con tre record TXT (SPF, DMARC,
  DKIM vuoto): nessuno può scrivere fingendosi Sofia. Dettagli nel punto 6 di
  `SETUP.md`. ⚠️ Quei record **impediscono anche a lei di inviare** dal dominio,
  se un domani volesse un indirizzo suo.
- Il Worker `sofia-tornaghi` e la GitHub OAuth App, avanzi dell'impianto OAuth
  scartato, sono stati **cancellati** il 17 settembre 2026.
- **Il sito non contatta nessuno.** Verificato il 2 ottobre 2026 sul sito
  live e **di nuovo il 26 ottobre**, su home, `/privacy` e `/admin`, nel
  browser e con `curl` sulle intestazioni: zero richieste verso domini
  esterni, nessun cookie nemmeno lato server, niente storage, niente iframe,
  nessun tracciatore, nessun modulo, Cloudflare Web Analytics spento. I font
  stanno in `fonts/` e non si prendono piu' da Google. La CSP non autorizza
  nessuna origine esterna: `style-src` e `font-src` sono tornati a `'self'`.
  **L'informativa su `/privacy` dice proprio questo**: se un domani si
  aggiunge qualcosa che contatta terzi, va aggiornata anche lei.
  Due cose le mette Cloudflare da sola, e vanno sapute:
  - **lo script anti-spam per le email** (Email Address Obfuscation, acceso
    sul dominio): se trova un indirizzo email scritto nell'HTML lo
    sostituisce e aggiunge alla pagina uno script suo. Il 26 ottobre
    compariva su `/privacy`. Neutralizzato con i commenti `email_off`, vedi
    le convenzioni. Si puo' anche spegnere dal pannello Cloudflare del
    dominio; e' un'impostazione dell'account, quindi la tocca Stefano;
  - **l'intestazione NEL**, che chiede al browser di segnalare a Cloudflare i
    caricamenti falliti, mai quelli riusciti. Non risulta spegnibile sul piano
    gratuito, e comunque i dati vanno a Cloudflare, che li ha gia'.
- **Non c'e' una pagina 404.** Senza `404.html` Cloudflare Pages tratta il
  sito come un'applicazione a pagina singola e a ogni indirizzo che non esiste
  risponde 200 servendo la home. Il `canonical` evita il contenuto duplicato.
  Valutata il 26 ottobre e lasciata perdere: era nata per `/privacy`, che poi
  e' tornata.
- **Quanto resta in cache**, verificato il 2 ottobre: `/` e
  `content/site.json` hanno `max-age=0`, quindi **le modifiche di Sofia si
  vedono subito**. CSS, JS e font hanno `max-age=14400`, quattro ore: le
  modifiche al codice arriverebbero con ritardo a chi e' gia' passato, ed e'
  per questo che dal 26 ottobre i collegamenti a stile e script portano un
  `?v=` da cambiare a ogni modifica (vedi le convenzioni).
- **Ogni ramo diverso da `main` ha un'anteprima sua**, che Cloudflare Pages
  costruisce da sola a ogni push: `https://<ramo>.website-sofy.pages.dev/`, con
  le barre del nome trasformate in trattini (`demo/chi-sono` →
  `demo-chi-sono`). E' il "sito di test" su cui far vedere le modifiche prima
  di pubblicarle. Verificato il 26 ottobre:
  - **arriva con `X-Robots-Tag: noindex`**, messo da Cloudflare, quindi non
    finisce su Google come doppione;
  - **il pannello li' non funziona**, e va bene cosi': le cinque variabili
    esistono solo per la produzione, e se ci fossero un salvataggio fatto
    sull'anteprima scriverebbe su `main`, cioe' sul sito vero;
  - **i testi sono quelli del ramo**: se Sofia salva sul sito vero, l'anteprima
    non lo vede finche' non si riunisce `main` nel ramo;
  - **resta accesa finche' il ramo esiste**, anche dopo averlo unito.
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

**Recuperata il 26 ottobre, in altra forma:** l'idea di avere i testi veri
dentro `index.html` invece che solo nel browser. Il ramo scartato la
realizzava con un passo di build; qui la fa il pannello a ogni salvataggio,
cosi' la regola "niente build" resta in piedi. Dettagli in "Come funziona il
pannello".

Il branch `fix/audit-codice-e-ui` **può essere chiuso**: l'impianto scelto è su
`main` dall'8 agosto e quel che valeva la pena tenere è già stato portato via.

## Struttura

```
index.html          la pagina, con segnaposto data-content sui testi modificabili
privacy.html        l'informativa, servita su /privacy (Pages toglie il .html)
style.css           tutti gli stili
script.js           navbar, menu mobile, aree apribili, WhatsApp fisso
content-loader.js   carica i JSON nella pagina e costruisce i link di contatto
content/site.json   85 testi e recapiti modificabili dal pannello
content/foto.json   il nome del file della foto profilo
fonts/              i due caratteri del sito, ospitati qui e non presi da Google
admin/index.html    il pannello di gestione (login + editor)
functions/api/      login, logout, content, upload — Cloudflare Pages Functions
functions/_lib/     auth, github, schema, pagina — codice condiviso fra le API
_headers            CSP e intestazioni di sicurezza
SETUP.md            configurazione: variabili Cloudflare, token, recapiti
```

**Ordine delle sezioni nella pagina**, rivisto il 26 ottobre 2026:

> Chi sono → Aree di specializzazione → **Recensioni** →
> **Inizia il tuo percorso** → Servizi e tariffe → **Domande frequenti** →
> Contatti

Le domande frequenti, aggiunte il 26 ottobre, stanno dopo le tariffe perche'
molte nascono li': come si paga, se si detrae, quanto dura.

Letto di seguito: chi sono, cosa tratto, cosa dicono i pazienti, come
funziona, quanto costa, come scrivermi. Chi si riconosce in un'area sente
subito le recensioni, e solo dopo arrivano i dettagli operativi su sedute e
consenso informato, che interessano chi si e' gia' convinto.

"Inizia il tuo percorso" resta comunque **prima** delle tariffe e dei
contatti, dove era stato spostato il 17 settembre: in fondo alla pagina era
dettaglio per chi aveva gia' deciso, messo davanti a chi stava ancora
decidendo.

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
- **Il salvataggio aggiorna anche l'HTML delle pagine.** Dopo `site.json`,
  `functions/_lib/pagina.js` riscrive il testo dentro ogni segnaposto di
  `index.html` e `privacy.html` con il valore del pannello, compresa la
  classe `.testo-a-capo`. Prima quel testo restava quello scritto a mano: il
  26 ottobre **25 segnaposto su 60** dicevano ancora le versioni vecchie, fra
  cui la citazione accanto alla foto e tutti i titoli delle aree, e li vedeva
  chiunque leggesse la pagina senza eseguire il JavaScript — parte dei motori
  di ricerca, gli strumenti che fanno anteprime, chi ha una connessione lenta
  per il primo istante. `content-loader.js` resta, come rete di sicurezza.
  Cose da sapere:
  - **un salvataggio fa fino a tre commit**, uno per file, e quindi fino a tre
    ricostruzioni su Cloudflare. Se un file non cambia, il commit non si fa;
  - **se l'aggiornamento dell'HTML fallisce, Sofia riceve comunque "salvato"**:
    i suoi testi sono gia' in `site.json` e il sito li mostra. L'errore finisce
    nei log della funzione su Cloudflare, e il salvataggio successivo ripara,
    perche' riparte da tutti i valori;
  - **il testo dentro un segnaposto non va piu' scritto a mano**: al primo
    salvataggio verrebbe sostituito. Si cambia dal pannello;
  - **un segnaposto con altri tag dentro viene lasciato com'e'**, per non
    cancellare pezzi di pagina. Oggi non ce ne sono;
  - **prima di toccare `index.html` in locale, `git pull`**: ogni salvataggio
    di Sofia ora lo modifica sul remoto.
  Provato il 26 ottobre con node, con un GitHub simulato in memoria:
  salvataggio normale, salvataggio identico (nessun commit), GitHub che
  rifiuta la pagina, GitHub che rifiuta `site.json` (pagine non toccate),
  conflitto con una modifica arrivata nel frattempo (rifatto sui dati riletti,
  nessuna delle due persa). La pagina generata, aperta senza JavaScript,
  mostra 59 testi su 59 identici a quelli che mette il browser; il sessantesimo
  e' `contatti_intro`, vuoto nel pannello, che tiene il testo di ripiego come
  nel browser.

## Contatti

Non c'è un modulo da compilare. Ci sono pulsanti che aprono direttamente
WhatsApp, il programma di posta o il telefono del visitatore. Il sito **non
raccoglie nessun dato**, e questo è deliberato: i messaggi a una psicologa
ricadono facilmente nei dati sanitari dell'art. 9 GDPR, e non farli passare da
un fornitore terzo toglie il problema alla radice.

L'indirizzo dello studio e' un campo multiriga: piu' studi si scrivono uno per
riga. Compare nel riquadro in alto e nel piè di pagina. ⚠️ Compare anche nella
`meta description` in testa al documento, e li' e' scritto a mano: quella la
leggono i motori di ricerca prima che il JavaScript abbia girato, quindi non
puo' arrivare dal pannello. Se lo studio cambia, va aggiornata a mano.

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
- **Testo che arriva dal pannello: `overflow-wrap: anywhere`, non
  `break-word`.** Solo il primo influisce sul calcolo della larghezza minima,
  che dentro una griglia e' cio' che impedisce a una parola lunga di allargare
  la colonna. Confrontati il 29 settembre sugli stessi 58 campi: con
  `break-word` ne restavano rotti 32, con `anywhere` nessuno. Serve anche
  `min-width: 0` sui figli delle griglie, altrimenti la regola non basta.
- **I collegamenti interni si scrivono senza `.html`.** Cloudflare Pages serve
  `/privacy` e fa rispondere `/privacy.html` con un 308 verso di esso. Con la
  sola home non si notava; con la seconda pagina e' venuto fuori due volte, nel
  collegamento del piè di pagina e — piu' serio — nel `canonical`, che
  dichiarava un indirizzo che reindirizza.
- **Un indirizzo email scritto nell'HTML va fra `<!--email_off-->` e
  `<!--/email_off-->`**, altrimenti Cloudflare lo sostituisce col suo script
  anti-spam (vedi "Dove gira"). Vale anche per i testi di ripiego dentro i
  segnaposto, che sono quelli che Cloudflare vede: il valore che arriva dal
  pannello lo mette il JavaScript e Cloudflare non lo tocca.
- **Un campo che Sofia puo' lasciare vuoto porta `data-facoltativo` sul
  segnaposto.** Di norma un campo vuoto tiene il testo di ripiego; da quando
  il pannello scrive l'HTML, il ripiego puo' essere il valore che lei ha
  appena cancellato, che quindi resterebbe in pagina. Con l'attributo, sia
  `content-loader.js` sia `pagina.js` svuotano davvero. Oggi ce l'ha solo
  `contatti_intro`.
- **Cambiando `style.css`, `script.js` o `content-loader.js`, cambiare il
  `?v=` nei loro collegamenti**, in `index.html` e `privacy.html`. Quei file
  restano in cache quattro ore, la pagina no: il 26 ottobre, appena
  pubblicata la demo, un browser che era gia' passato mostrava la pagina nuova
  con script vecchi (pulsante WhatsApp fisso spento, aree che non si
  chiudevano), e con lo stile vecchio sarebbe stato peggio, onde e icone a
  piena grandezza. Il numero e' la data, piu' una lettera se nello stesso
  giorno si cambia due volte.
- **Soglie diverse dai 768px solo con un motivo scritto.** Il percorso a
  tappe usa 1100px: sotto, quattro colonne scenderebbero sotto i 200px.
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

  Infine, controllando che Sofia potesse ancora modificare tutto:
  - **il campo `indirizzo` era rimasto orfano.** Togliendo il blocco
    ripetitivo era sparito l'unico segnaposto che lo usava, mentre
    l'indirizzo restava scritto a mano nel riquadro in alto e nel piè di
    pagina: lei avrebbe potuto cambiarlo, salvare, e non vedere succedere
    niente. Ricollegati entrambi i punti.
  - **`indirizzo` e' diventato multiriga**, cosi' si possono avere piu'
    studi scrivendone uno per riga. Sfrutta la stessa macchina degli a capo
    messa in piedi la mattina, quindi non e' costato codice nuovo e non pone
    un limite al numero di studi — a differenza di un campo "indirizzo2".

- **29 settembre 2026** — **il sito ha il suo dominio ed è messo in sicurezza.**
  `sofiatornaghi.com` registrato su Cloudflare Registrar e intestato a Sofia,
  agganciato al progetto Pages, con `www` che rimanda al dominio nudo
  conservando percorso e query.
  Chiusi di conseguenza due punti in sospeso da agosto:
  - **`canonical` e `og:url`**, che aspettavano l'indirizzo definitivo per
    poter essere scritti. Con l'occasione corretto `og:image`, che puntava a un
    percorso relativo: chi condivideva il link su WhatsApp vedeva un'anteprima
    **senza foto**, perché quei tag li leggono i server di Meta, dove un
    percorso relativo non significa niente.
  - **La Rate limiting rule** su `/api/login`, provata davvero e non solo
    configurata: quindici richieste di fila, le prime sei passano, dalla settima
    Cloudflare risponde 429. Verificato anche che il blocco si sciolga da solo,
    perché uno che restasse attaccato chiuderebbe fuori Sofia.
  Aggiunti tre record TXT contro lo spoofing delle email.
  Due limiti del piano gratuito, scoperti sul campo e da mettere in conto:
  **il periodo della Rate limiting rule si puo' impostare solo a 10 secondi** e
  **la durata del blocco pure** — gli intervalli piu' lunghi sono a pagamento.

  Nella stessa giornata, rileggendo la pagina con i testi definitivi di Sofia:
  **ventisette testi visibili non erano modificabili da lei**, e tre dicevano
  gia' cose sbagliate o le avrebbero dette a breve.
  - **La citazione accanto alla foto** conteneva ancora una vecchia versione
    della biografia, rimasta indietro quando Sofia ha riscritto i testi il 24
    agosto: in cima si leggeva una cosa, in "Chi sono" un'altra. Ora e' un
    campo suo. ⚠️ **Il testo non e' stato toccato: tocca a lei riscriverlo.**
  - **Il prezzo compariva due volte**, scritto a mano nella scheda in alto e
    modificabile nelle tariffe. Ora la scheda legge la stessa tariffa, e
    l'etichetta e' passata da "Seduta individuale" a "Primo colloquio" perche'
    le tariffe **non sono tutte uguali** — la somministrazione test e' a 70 € —
    e con l'etichetta generica il riquadro poteva mentire.
  - **Le credenziali** dicevano "(2023 – in corso)" e "psicoterapeuta in
    formazione". Sofia e' specializzanda: il giorno in cui si specializza
    sbagliavano tutte insieme, proprio quando avrebbe voluto dirlo. Ora sono
    sue, insieme al riquadro dell'approccio e al terzo paragrafo della bio.
  - **Le sei sezioni** avevano tre intestazioni diverse. Ora tutte occhiello
    piu' titolo: servizi prende "Quanto costa", contatti riprende l'occhiello e
    il titolo diventa "Scrivimi".
  I campi passano da 49 a 62. Tutti i valori nuovi sono quelli che la pagina
  gia' mostrava: niente riscritto, solo reso modificabile.

  Infine, **la pagina non reggeva testi imprevisti.** Provati tutti i 58
  segnaposto uno alla volta, a 375px e 1440px: una parola lunga senza spazi —
  un indirizzo email incollato, un link — faceva sfondare il margine in **40
  campi su 58** su telefono, e i due numeri della scheda in alto si rompevano
  anche con una frase normale. Risolto con `overflow-wrap: anywhere` sul body
  piu' `min-width: 0` sui figli delle griglie che ospitano testo suo.

- **2 ottobre 2026** — **i font sono ospitati sul sito: adesso non esce piu'
  niente dal browser di chi visita.**
  Partiti da una domanda di Stefano — a cosa e' agganciato il sito, serve
  un'informativa? — e verificato invece di rispondere a memoria: nessun
  cookie, nessun localStorage, nessun tracciatore, nessun modulo. **Una sola
  richiesta esterna**, a `fonts.googleapis.com`, che tirava dentro quattro file
  da `fonts.gstatic.com` e consegnava a Google l'indirizzo IP di ogni
  visitatore. Era l'unico aggancio a un terzo, e l'unico motivo per cui
  l'informativa avrebbe dovuto parlare di trasferimenti a societa' esterne.
  Scaricati solo i pesi davvero in uso, **contati sulla pagina renderizzata**:
  cinque, non otto. Cormorant 500 e il corsivo 400 venivano scaricati da sempre
  e non comparivano da nessuna parte. Tenuti gli `unicode-range` originali,
  quindi il file latin-ext si scarica solo se serve: per una pagina italiana il
  browser prende circa 197 KB, gli stessi di prima, ma dalla stessa connessione
  del sito invece che da due domini Google.
  Verificato sul sito live che tutti e cinque i caratteri vengano davvero usati
  e non sostituiti da ripieghi di sistema, misurando la larghezza di una stessa
  frase e confrontandola con quella di un font inesistente.

- **12, 16 e 21 ottobre 2026** — **Sofia ha usato il pannello da sola**, sette
  salvataggi in tre giornate, senza che nessuno la aiutasse. Ha riscritto i
  tre paragrafi della biografia e soprattutto **la citazione accanto alla
  foto**, che era il punto 1 delle cose in sospeso: al posto del vecchio testo
  ora c'e' *"Se continui a fare la stessa cosa, vivrai sempre la stessa
  storia"*. E' la prova che l'impianto funziona per chi doveva usarlo.

- **26 ottobre 2026** — la giornata piu' lunga finora. In breve, nell'ordine:
  recensioni prima del percorso e stelle dorate; informativa privacy scritta,
  tolta e rimessa; il pannello che scrive i testi anche dentro l'HTML; numero
  d'Albo, partita IVA e Codice deontologico nel piè di pagina; domande
  frequenti, percorso a tappe, aree apribili, mappe, WhatsApp fisso e dati
  per Google, presi guardando i siti di cinque colleghe; "Chi sono"
  riordinata; piè di pagina su telefono; `?v=` contro la cache. Tutto online
  alla sera, ultimo commit `9910848`. Il dettaglio segue.

  **Le recensioni passano prima di "Inizia il tuo
  percorso"**, su richiesta di Stefano. Risistemata l'alternanza degli sfondi
  come sempre quando si tocca l'ordine, e verificato che non restino due
  sezioni adiacenti dello stesso colore. Aggiornato anche il commento sopra la
  sezione, che spiegava la sua posizione dicendo "subito dopo le aree": adesso
  in mezzo ci sono le recensioni.
  Le stelle delle recensioni passano da `--sand` a **`--oro` #C9A227**, messo
  fra i colori della palette invece che scritto dentro la regola.

  Poi, **scritta la bozza dell'informativa privacy**: nuova pagina
  `privacy.html`, servita su `/privacy`. Riusa la
  grafica del sito e carica `content-loader.js`, quindi indirizzo ed email
  arrivano dal pannello: se Sofia cambia studio l'informativa si aggiorna con
  il resto invece di restare indietro a dire il falso.
  Il contenuto si appoggia a cio' che era stato verificato il 2 ottobre —
  nessun cookie, nessun tracciatore, nessuna richiesta esterna — e dichiara
  anche cio' che le informative "non raccogliamo niente" spesso tacciono: il
  server registra comunque i dati tecnici di connessione, indirizzo IP
  compreso, perche' senza non potrebbe consegnare le pagine.
  ⚠️ **E' una bozza, non un documento validato.** Tre punti restano da
  riempire e sono marcati con `.da-completare`, un riquadro volutamente
  vistoso. Vedi le cose in sospeso.

  In serata, **l'informativa e' stata tolta**, per scelta di Stefano. Prima
  di decidere si e' ricontrollato tutto il sito pubblicato, nel browser e con
  `curl` sulle intestazioni: nessuna richiesta a domini esterni, nessun
  cookie nemmeno lato server, niente storage, niente iframe, niente moduli,
  Cloudflare Web Analytics spento. Le uniche due aggiunte di Cloudflare
  erano lo script anti-spam per le email, che compariva **solo** su
  `/privacy` perche' li' l'email era scritta nell'HTML, e l'intestazione
  NEL, che fa segnalare a Cloudflare solo i caricamenti falliti. Con la
  pagina se ne va anche lo script.
  Prima ancora era stato chiuso il riquadro su Cloudflare con le fonti
  ufficiali (accordo sul trattamento richiamato dalle condizioni self-serve,
  Data Privacy Framework, nessun termine di conservazione pubblicato): il
  testo e' nel commit `e693eb9`, da cui si riparte se si torna indietro.

  Poco dopo Stefano ci ha ripensato: **l'informativa torna, ed e' collegata
  dal piè di pagina.** Ripresa da `e693eb9`, con i due buchi rimasti chiusi
  cosi':
  - **Albo e partita IVA**: riquadro tolto. Per l'art. 13 GDPR basta
    l'identita' del titolare con i recapiti, che c'erano gia'. I due numeri si
    aggiungono quando Sofia li da', qui e nel piè di pagina;
  - **messaggi di chi non inizia un percorso**: non usati per altro e
    cancellati quando non servono piu' a rispondere; per chi lo inizia vale
    cio' che Sofia consegna in studio. ⚠️ **E' un impegno scritto a nome di
    Sofia senza averglielo chiesto**: va confermato con lei.
  Lo stile `.da-completare` non e' tornato, perche' non serve piu'.
  L'email nell'HTML ora sta fra `<!--email_off-->` e `<!--/email_off-->`:
  sono i commenti che Cloudflare riconosce per non aggiungere il suo script
  anti-spam, che era l'unica cosa estranea comparsa sulla pagina.

  Infine, **i testi veri finiscono dentro l'HTML**: il pannello, quando Sofia
  salva, aggiorna anche i segnaposto di `index.html` e `privacy.html`. Era il
  punto "generazione alla build" delle cose in sospeso, risolto senza passo
  di build. Riallineati subito anche i 26 segnaposto rimasti indietro, senza
  aspettare il prossimo salvataggio. Dettagli in "Come funziona il pannello".

  In serata, **numero d'Albo e partita IVA sul sito**, nel piè di pagina della
  home e dell'informativa, insieme al collegamento al Codice deontologico sul
  sito del CNOP: sono i dati che chiedono l'art. 7 del D.Lgs. 70/2003 (ordine e
  numero di iscrizione, titolo, norme professionali e dove consultarle) e la
  norma IVA sulla home page, letti su Normattiva. Sezione A, n. 26648, P.IVA
  14520970964, controllata con la cifra di controllo prima di pubblicarla.
  Nell'informativa compaiono anche fra i dati del titolare.
  ⚠️ **Sono scritti a mano e non stanno nel pannello**, apposta: non cambiano,
  e un campo svuotato per sbaglio farebbe sparire un obbligo di legge. Il
  giorno in cui Sofia si specializza cambia il titolo, e va cambiato qui.
  Il collegamento al Codice deontologico e' stato tolto e poi **rimesso** in
  giornata, su decisione di Stefano. La pagina del CNOP risponde 403 a
  `curl`: e' una protezione contro le richieste automatiche, nel browser si
  apre.
  Corretto anche un refuso nel testo di Sofia sulle sedute, *"ci che"* →
  *"ciò che"*, su richiesta di Stefano.

  Per finire, **pubblicata la demo nata guardando i siti di cinque colleghe**
  (Amandolesi, Funaro, Menescalchi, Venturi, Calzi), costruita sul ramo
  `demo/spunti-colleghe` e provata su un'anteprima di Cloudflare Pages prima
  di unirla:
  - **Domande frequenti**, sezione nuova dopo le tariffe: sei domande in
    `<details>`, che si aprono senza JavaScript e stanno tutte nell'HTML.
    ⚠️ **Testi scritti da Stefano e Claude, pubblicati senza che Sofia li
    abbia letti**: vedi le cose in sospeso.
  - **"Inizia il tuo percorso" diventa un percorso a quattro tappe**, fatto
    solo dei due testi di Sofia sul consenso e sulle sedute, divisi alle righe
    dove lei andava a capo e senza titoli. I tre casi della consegna (in
    presenza, online, minorenni) sono riquadri con icona, divisi ai due punti.
    Controllato con un programma che ricomposti diano il testo di partenza
    carattere per carattere. Da 1100px le tappe si affiancano lungo un'onda
    tratteggiata; sotto, in colonna con la linea a sinistra. Erano state
    provate anche quattro tappe con titoli e testi scritti da noi, e il
    carosello come le recensioni: scartati, i primi perche' inventati, il
    secondo perche' nasconde le tappe pratiche.
  - **Aree di lavoro su telefono come le domande frequenti**: sei titoli con
    icona, il testo si apre toccandoli. Su schermo largo restano aperte.
  - **L'indirizzo apre Google Maps**, nella scheda in alto e nel piè di
    pagina: un link e non una mappa incorporata, che caricherebbe Google a
    ogni visita. L'informativa lo elenca fra i pulsanti.
  - **Pulsante WhatsApp fisso su telefono**, che si nasconde quando si vedono
    i pulsanti in cima, le tariffe (copriva i prezzi), il WhatsApp dei
    contatti e il piè di pagina.
  - **Dati strutturati per Google** (`application/ld+json` in testa a
    `index.html`): scritti a mano come la `meta description`, senza telefono.
  - Il pulsante "Prenota un primo colloquio" accanto al titolo del percorso
    c'e' da PC e tablet, non su telefono dove c'e' gia' quello fisso.
  - **I campi passano da 62 a 83.** `percorso_consenso` e `percorso_sedute`
    non esistono piu': al loro posto `tappa1_testo` ... `tappa4_testo` e
    `consegna1_etichetta`/`consegna1_testo` ... `consegna3_*`.
  Lungo la strada corretto un difetto del riempimento dell'HTML fatto la
  mattina: un campo facoltativo svuotato avrebbe lasciato in pagina il valore
  vecchio. Ora esiste `data-facoltativo` (vedi le convenzioni).

  Ultima della giornata, **"Chi sono" riordinata**, sempre senza aggiungere
  parole e provata prima sull'anteprima del ramo `demo/chi-sono`:
  - **la frase d'apertura di Sofia in evidenza** ("Ciao, sono la dott.ssa…"),
    nel carattere dei titoli: i sei paragrafi grigi tutti uguali erano un
    muro;
  - **"Se senti che questo è il momento giusto, puoi iniziare da qui..."
    diventa un collegamento** alla sezione "Inizia il tuo percorso": diceva
    "da qui" senza portare da nessuna parte;
  - **l'approccio passa a destra** come quinta scheda sotto le credenziali,
    con il bordo verde: prima era grigio su grigio. Da PC la colonna di
    destra segue la lettura (`position: sticky`) finche' il testo a sinistra
    non finisce; prima le credenziali si fermavano a 499px contro 981px di
    testo, ora 626 contro 890.
  Per l'apertura e l'invito, `bio_p1` e `bio_p3` sono divisi alla riga vuota
  che Sofia aveva lasciato: nascono `bio_intro` e `bio_invito`, e i campi
  passano da 83 a 85. Ricomposti danno il testo di partenza.

  E infine **il piè di pagina su telefono**, dal ramo `demo/piede-mobile`: i
  dati legali andavano a capo a meta' ("sez." da una parte, "A, n. 26648"
  dall'altra, "Codice deontologico" spezzato) e i cinque collegamenti in
  colonna prendevano mezzo schermo. Ora ogni dato e' un elemento suo: da PC
  restano in riga coi puntini, su telefono uno per riga, e gli spazi
  indivisibili (`&nbsp;`) tengono insieme "sez. A", "n. 26648" e la partita
  IVA. I collegamenti su telefono stanno su due colonne.
  ⚠️ Visto che le anteprime restano accese, Stefano ne ha aperta una vecchia
  credendola nuova: un motivo in piu' per cancellare i rami gia' uniti.

### In sospeso

1. **Far leggere a Sofia i testi della demo che non ha scritto lei**, e che
   sono online dal 26 ottobre: le sei domande frequenti. In particolare
   *"Per ogni seduta ricevi la fattura"* e la detrazione al 19% con
   pagamento tracciabile, e *"io sono psicologa e psicoterapeuta in
   formazione"* nella differenza fra le due figure, su cui l'Ordine e'
   attento. Si correggono dal pannello, gruppo "Domande frequenti".
2. **Far confermare a Sofia l'informativa**, in particolare la frase sui
   messaggi di chi non inizia un percorso, che promette di cancellarli. E'
   l'unica parte scritta senza sapere come lavora davvero. ⚠️ **La forma
   giuridica non e' stata validata da nessuno di competente**: se c'e' chi
   ha preparato l'informativa dello studio, conviene farla vedere a quella
   persona.
3. **Verificare il primo salvataggio vero di Sofia** dopo il 26 ottobre: nella
   storia di GitHub devono comparire, oltre a "Aggiorna i testi del sito dal
   pannello", i commit "Allinea index.html ai testi del pannello" e, se
   cambia l'indirizzo o l'email, quello di `privacy.html`. Le prove sono
   state fatte con un GitHub simulato: il token vero non e' mai stato usato
   per scrivere `index.html`, e se non avesse il permesso su quel file
   l'errore sarebbe solo nei log.
4. **Cancellare i rami gia' uniti**, che restano sul remoto con la loro
   anteprima accesa (con `noindex`, quindi innocua):
   `demo/spunti-colleghe`, `demo/chi-sono`, `demo/piede-mobile`,
   `claude/dove-siamo-rimasti-nrsh36`, `claude/memoria-progetto`. Tutti
   interamente dentro `main`. Claude non ha il permesso di cancellare rami
   remoti: va fatto da Stefano con `git push origin --delete <ramo>`.
   Le anteprime vecchie confondono: il 26 ottobre ne e' stata aperta una
   credendola quella nuova.

### Decisioni prese, da non rimettere in discussione senza motivo

- **Niente account GitHub per Sofia.** È il motivo per cui il pannello usa una
  password e non OAuth: sarebbe stato più semplice da scrivere ma inutilizzabile
  per lei.
- **Niente modulo di contatto.** Scelta di agosto 2026: meno attrito per chi
  scrive e nessun dato sanitario che transita da terzi.
- **Nessun dato di pazienti nel repository**, che è pubblico.
- **L'informativa privacy c'e'.** Il 26 ottobre 2026 e' stata tolta e
  rimessa nella stessa giornata. Per l'art. 13 GDPR e' dovuta comunque,
  perche' l'IP che Cloudflare registra a ogni visita e' un dato personale di
  cui Sofia e' titolare. Il rischio di non averla era basso, ma il lavoro per
  averla era gia' fatto. ⚠️ **Se si aggiunge qualcosa che contatta terzi o
  raccoglie dati — statistiche, un modulo, un video incorporato, un font o
  uno script preso da fuori — l'informativa va aggiornata**, perche' oggi
  dice che non succede.
- **Niente dominio `.it`.** Deciso da Stefano il 26 ottobre 2026, dopo averlo
  valutato due volte. Era libero e sarebbe servito solo a due cose: intercettare
  chi sente il nome a voce e digita `.it` per istinto, e impedire che qualcun
  altro registri il nome di Sofia. Nessuna delle due e' stata ritenuta
  sufficiente. Il sito su `.com` funziona ed e' quello che va dato in giro.

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

**Prima di dire che un deploy e' fallito, chiedere al server cosa serve
davvero.** Il 2 ottobre i font sembravano rotti — il browser non vedeva
nessuna regola `@font-face` — e invece il server serviva il file giusto: era
la cache del browser, `max-age=14400`, che teneva il CSS vecchio per quattro
ore. Un `curl` sul file lo avrebbe detto subito. E' successo **tre volte**
che una cache facesse sembrare rotta una cosa che funziona: GitHub Pages a
settembre, i font il 2 ottobre, lo stile di `/privacy` il 26 ottobre.
**Lo stato della propria finestra non e' lo stato del sito.** Nel browser si
forza la versione nuova cambiando l'indirizzo del foglio di stile con un
`?v=` qualunque.

**Dopo aver cambiato il CSS o aggiunto campi, provare i testi imprevisti.**
Riempire ogni segnaposto, uno alla volta, con una frase lunga e con una parola
senza spazi, e guardare se `document.scrollWidth` supera la larghezza della
finestra. **Va fatto a 375px**: da PC quasi tutto regge comunque, e il 29
settembre erano 2 campi rotti da PC contro 40 su telefono. Il segnale da
guardare e' solo lo scorrimento orizzontale della pagina: la giostra delle
recensioni sfora di proposito e falsa ogni altro controllo.

**Dopo aver tolto pezzi di pagina, confrontare i segnaposto con lo schema.**
È il controllo che ha scoperto il campo `indirizzo` rimasto orfano, e non si
vede guardando il sito: l'indirizzo era lì, giusto, solo che era diventato
immutabile. Si scopre il giorno in cui serve cambiarlo.

```bash
# i data-content nella pagina contro i campi in functions/_lib/schema.js:
# nessuno dei due elenchi deve contenere qualcosa che manca all'altro,
# a parte telefono/email/whatsapp/whatsapp_messaggio, che non riempiono un
# segnaposto ma servono a costruire i pulsanti di contatto.
```


```bash
python3 -m http.server 8899     # poi aprire http://localhost:8899
```

⚠️ Sul PC di Stefano (Windows) `python` e' solo il segnaposto del Microsoft
Store ed esce con errore 49. Il 26 ottobre si e' usato un server di poche
righe in node; ancora meglio, per far vedere una modifica a qualcuno, un ramo
con la sua anteprima su Cloudflare (vedi "Dove gira").

Chromium e Playwright sono disponibili nell'ambiente remoto per controllare in
un browser vero che i link di contatto si costruiscano bene e che il pannello
si comporti come deve. Le API si provano simulando `fetch` verso GitHub, senza
toccare il repository reale: il 26 ottobre si e' fatto con un GitHub finto in
memoria al posto di `fetch`, importando `functions/api/content.js` da node,
con un cookie di sessione creato da `createSessionToken`.

**Per una modifica che divide o sposta testi di Sofia, controllare che
ricomposti diano il testo di partenza carattere per carattere.** E' cosi' che
sono stati divisi il percorso a tappe e "Chi sono": con un programma che
rimette insieme i pezzi e si ferma se anche un solo carattere e' diverso.
Sofia ha chiesto di non aggiungere parole sue: e' il solo modo di
dimostrarlo.

**Il browser integrato di Claude Code inganna in due modi**, scoperti il 26
ottobre:
- **quando il suo pannello e' nascosto, la pagina non viene ridisegnata**, e
  con lei si fermano `IntersectionObserver` e i timer legati al disegno: il
  pulsante WhatsApp fisso sembrava non sparire mai. Fare uno scatto della
  pagina a ogni passo la costringe a ridisegnarsi;
- **gli scatti a larghezza telefono possono tagliare il bordo destro**: i
  prezzi sembravano spariti. Le misure prese con `getBoundingClientRect`
  dicono il vero, lo scatto no.
