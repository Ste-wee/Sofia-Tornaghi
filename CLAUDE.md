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

- **Hosting: Cloudflare Pages.** Deploy automatico dal branch `main`.
- **Repository: `Ste-wee/Sofia-Tornaghi`, pubblico.** Conta: qui non deve mai
  finire nulla di riservato, in particolare nessun messaggio di pazienti.
- Dominio di prenotazione esterno: MioDottore.

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
- **Agosto 2026** — passaggio da Netlify a Cloudflare. Questo ha rotto il CMS,
  perché git-gateway è un servizio Netlify. Ricostruito da zero:
  - pannello di gestione scritto da noi su Pages Functions, con login a
    password e salvataggio via API GitHub;
  - rimosso il widget Netlify Identity e la configurazione Decap;
  - `_headers` con CSP, HSTS, `noindex` su `/admin` e `/api`;
  - modulo contatti sostituito dai pulsanti di contatto diretto;
  - corretto un numero di ripiego nell'HTML rimasto a un vecchio `02`.

### In sospeso

1. **Configurare le variabili su Cloudflare** — finché non è fatto, il pannello
   risponde "configurazione incompleta". Il sito pubblico funziona comunque.
   Istruzioni in `SETUP.md`. *Tocca a Stefano.*
2. **Inserire l'indirizzo email** dal pannello: è l'unico recapito ancora
   vuoto, quindi al momento il pulsante email non compare.
3. **Informativa privacy** — non più bloccante da quando il modulo non c'è più,
   ma resta opportuna.
4. **Font Google** caricati da `fonts.googleapis.com`, che riceve l'IP di ogni
   visitatore. Ospitarli sul sito chiuderebbe la questione.
5. **Manca la favicon**; mancano `canonical` e `og:url`.
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

## Come verificare le modifiche

Non ci sono test automatici nel repository. Le verifiche si fanno così:

```bash
python3 -m http.server 8899     # poi aprire http://localhost:8899
```

Chromium e Playwright sono disponibili nell'ambiente remoto per controllare in
un browser vero che i link di contatto si costruiscano bene e che il pannello
si comporti come deve. Le API si provano simulando `fetch` verso GitHub, senza
toccare il repository reale.
