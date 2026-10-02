# Sito della Dott.ssa Sofia Tornaghi

> **Questo file è la memoria del progetto.** Va aggiornato alla fine di ogni
> sessione di lavoro: stato, decisioni prese, cose rimaste in sospeso. Serve a
> ripartire senza dover ricostruire il contesto dai commit.
>
> Ultimo aggiornamento: **2 ottobre 2026** — font in casa, nessuna richiesta esterna

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
  live: zero richieste verso domini esterni, nessun cookie, nessun
  localStorage, nessun tracciatore, nessun modulo. I font stanno in `fonts/` e
  non si prendono piu' da Google. La CSP non autorizza piu' nessuna origine
  esterna: `style-src` e `font-src` sono tornati a `'self'`.
- **Quanto resta in cache**, verificato il 2 ottobre: `/` e
  `content/site.json` hanno `max-age=0`, quindi **le modifiche di Sofia si
  vedono subito**. CSS, JS e font hanno `max-age=14400`, quattro ore: le
  modifiche al codice arrivano con ritardo a chi e' gia' passato.
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
content/site.json   62 testi e recapiti modificabili dal pannello
content/foto.json   il nome del file della foto profilo
fonts/              i due caratteri del sito, ospitati qui e non presi da Google
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

### In sospeso

1. **La citazione accanto alla foto va riscritta da Sofia.** Dal 29 settembre
   e' un campo del pannello ("Frase nel riquadro con la foto"), ma dentro c'e'
   ancora il testo vecchio: quello che lei aveva sostituito il 24 agosto nella
   biografia e che qui era rimasto indietro. Finche' non la riscrive, il sito
   dice due cose diverse su di lei. Non l'abbiamo cambiata noi perche' e' la
   frase in cui si presenta.
2. **Informativa privacy.** Dal 2 ottobre il sito **non contatta piu' nessuno**
   e non raccoglie niente, quindi l'informativa deve descrivere un'assenza, non
   un rapporto con terzi: molto piu' semplice da far scrivere e da mantenere
   vera. Resta comunque opportuna, perche' il sito e' la vetrina di un'attivita'
   sanitaria e Sofia e' titolare del trattamento per i dati dei suoi pazienti.
   ⚠️ **Non e' una valutazione tecnica: serve qualcuno di competente.** Sofia
   ha gia' un'informativa per lo studio — nel sito parla del consenso informato
   che manda ai pazienti — quindi conviene far derivare quella del sito dalla
   stessa persona che ha preparato l'altra.
3. **Generazione alla build** dei testi dentro `index.html`, ripresa dal branch
   scartato: meglio per i motori di ricerca. Da valutare quando il resto è in
   piedi.
4. **Il dominio `.it`**, libero al 29 settembre 2026 e non preso. Non serve al
   sito, ma chi sente il nome a voce tende a digitare `.it` e oggi non trova
   niente. Se preso, va solo fatto rimandare al `.com` — **non agganciato a
   Pages**, altrimenti si ricrea il contenuto duplicato.
5. **Inoltro delle email** (Cloudflare Email Routing, gratuito). Oggi la posta
   verso `@sofiatornaghi.com` rimbalza: un paziente che tirasse a indovinare
   `info@sofiatornaghi.com` non riceverebbe risposta e non se ne accorgerebbe.
   Valutato il 29 settembre e rimandato. Attivarlo cambia il record SPF.

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

**Prima di dire che un deploy e' fallito, chiedere al server cosa serve
davvero.** Il 2 ottobre i font sembravano rotti — il browser non vedeva
nessuna regola `@font-face` — e invece il server serviva il file giusto: era
la cache del browser, `max-age=14400`, che teneva il CSS vecchio per quattro
ore. Un `curl` sul file lo avrebbe detto subito. E' la seconda volta che una
cache fa sembrare rotta una cosa che funziona: la prima fu GitHub Pages a
settembre. **Lo stato della propria finestra non e' lo stato del sito.**

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

Chromium e Playwright sono disponibili nell'ambiente remoto per controllare in
un browser vero che i link di contatto si costruiscano bene e che il pannello
si comporti come deve. Le API si provano simulando `fetch` verso GitHub, senza
toccare il repository reale.
