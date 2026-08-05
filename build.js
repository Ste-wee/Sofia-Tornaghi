// Genera index.html a partire da templates/index.template.html + content/site.json.
//
// Va eseguito a ogni pubblicazione (Netlify lo fa da solo, vedi netlify.toml).
// Per farlo a mano: node build.js
//
// Perche' esiste: prima, i testi vivevano in due posti (l'HTML e il JSON del
// pannello) e bisognava tenerli allineati a mano. Ora l'HTML e' generato: c'e'
// un solo posto dove il testo vive davvero, il JSON, e l'HTML e' sempre il suo
// riflesso esatto. Questo permette anche a content/site.json di avere liste
// di lunghezza libera (aree, servizi, recensioni, credenziali): il pannello
// puo' aggiungere o togliere voci, e qui generiamo tante schede quante servono.
//
// Se un campo manca o un'icona non esiste, lo script si ferma con un errore
// chiaro (vedi in fondo) invece di generare una pagina con "undefined" scritto
// dentro. Netlify, quando la build fallisce, NON pubblica nulla di nuovo: il
// sito resta quello di prima. Un pannello compilato male non puo' quindi mai
// mandare il sito online rotto.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'index.template.html');
const DATA_PATH = path.join(ROOT, 'content', 'site.json');
const OUTPUT_PATH = path.join(ROOT, 'index.html');

// --- Libreria icone -------------------------------------------------------
// Ogni voce di una lista (aree, credenziali) sceglie un'icona per nome da qui,
// invece di incollare codice SVG nel pannello. Tutte condividono lo stesso
// stile (viewBox 24x24, tratto sottile) definito una volta sola in renderIcon.
const ICONS = {
  crescita: ['M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5'],
  cuore: ['M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'],
  gruppo: ['M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z'],
  bussola: ['M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'],
  persona: ['M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'],
  dialogo: ['M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z'],
  laurea: [
    'M12 14l9-5-9-5-9 5 9 5z',
    'M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
  ],
  libro: ['M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z'],
  edificio: ['M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z'],
};

function renderIcon(key, className) {
  const paths = ICONS[key];
  if (!paths) {
    throw new Error(
      'Icona sconosciuta: "' + key + '". Disponibili: ' + Object.keys(ICONS).join(', ')
    );
  }
  const pathTags = paths.map((d) => `<path d="${d}"/>`).join('\n      ');
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">\n      ${pathTags}\n    </svg>`;
}

// --- Motore di sostituzione -------------------------------------------------
// Legge un JSON annidato usando un percorso a punti: "servizi.lista.0.prezzo".
function get(obj, dottedPath) {
  return dottedPath.split('.').reduce((o, key) => (o == null ? undefined : o[key]), obj);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Il testo scritto dal pannello e' sempre trattato come testo, mai come HTML:
// cosi' Sofia non puo' rompere la pagina scrivendo per sbaglio un simbolo
// come < o &. Un "a capo" nel campo diventa pero' un <br> visivo.
function textOf(value) {
  return escapeHtml(value == null ? '' : value).split('\n').join('<br>');
}

// Sostituisce ogni {{percorso.al.campo}} nel template col valore preso dal
// JSON. Si ferma con un errore leggibile se un campo non esiste, invece di
// scrivere "undefined" nella pagina pubblicata.
function fillPlaceholders(html, data) {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, dottedPath) => {
    const value = get(data, dottedPath);
    if (value === undefined) {
      throw new Error('Campo mancante in content/site.json: "' + dottedPath + '"');
    }
    return textOf(value);
  });
}

// --- Schede generate dalle liste --------------------------------------------

function renderAreaCard(item) {
  return `      <div class="area-card">
        ${renderIcon(item.icona, 'area-icon')}
        <h3 class="area-title">${textOf(item.titolo)}</h3>
        <p class="area-desc">${textOf(item.desc)}</p>
      </div>`;
}

function renderServizio(item) {
  return `      <div class="service-item">
        <span class="service-name">${textOf(item.nome)}</span>
        <span class="service-price">${textOf(item.prezzo)}</span>
      </div>`;
}

function renderRecensione(item) {
  return `      <div class="review-card">
        <div class="stars" role="img" aria-label="Valutazione 5 stelle su 5">★★★★★</div>
        <p class="review-text">${textOf(item.testo)}</p>
        <div class="review-meta">${textOf(item.autore)}</div>
      </div>`;
}

function renderCredenziale(item) {
  return `          <div class="credential-item">
            ${renderIcon(item.icona, 'credential-icon')}
            <div class="credential-text">
              <div class="credential-label">${textOf(item.label)}</div>
              <div class="credential-value">${textOf(item.value)}</div>
            </div>
          </div>`;
}

// Link telefono/mappa: costruiti dal valore vero (contatti.telefono,
// contatti.indirizzo), non scritti a parte — cambiano automaticamente se
// Sofia aggiorna quei campi dal pannello.
function renderMapsLink(indirizzo) {
  const href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(indirizzo);
  return `<a class="contact-value contact-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${textOf(indirizzo)}</a>`;
}

function renderTelLink(telefono) {
  const cifre = telefono.replace(/[^\d+]/g, '');
  return `<a class="contact-value contact-link" href="tel:${escapeHtml(cifre)}">${textOf(telefono)}</a>`;
}

// Dati strutturati (SEO) generati dai dati veri, cosi' non possono mai
// mostrare un telefono o un indirizzo diverso da quello scritto in pagina.
function renderJsonLd(data) {
  const cifre = data.contatti.telefono.replace(/[^\d]/g, '');
  const prezzi = data.servizi.lista.map((s) => parseFloat(String(s.prezzo).replace(/[^\d.]/g, ''))).filter((n) => !isNaN(n));
  const min = prezzi.length ? Math.min(...prezzi) : null;
  const max = prezzi.length ? Math.max(...prezzi) : null;

  // L'indirizzo e' un unico campo di testo libero nel pannello ("via, città
  // CAP"). Il CAP (5 cifre) si estrae in modo affidabile con una regex; la
  // via è la parte prima della prima virgola, con l'indirizzo intero come
  // ripiego se per qualche motivo la virgola non c'è.
  const cap = (data.contatti.indirizzo.match(/\b\d{5}\b/) || [])[0];
  const via = data.contatti.indirizzo.split(',')[0].trim() || data.contatti.indirizzo;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Psychologist',
    name: data.generale.nav_brand,
    description: "Psicologa a Milano. Supporto clinico per preadolescenti, adolescenti e giovani adulti, con competenza specifica nei Disturbi della Nutrizione e dell'Alimentazione.",
    image: 'foto-professionale.jpg',
    telephone: '+39' + cifre,
    priceRange: min !== null ? `${min}–${max} €` : undefined,
    currenciesAccepted: 'EUR',
    // schema.org si aspetta un elenco separato da virgole: il pannello usa
    // "·" per leggibilita' visiva, qui lo normalizziamo.
    paymentAccepted: data.contatti.metodiPagamento.split('·').map((s) => s.trim()).join(', '),
    knowsLanguage: 'it',
    address: {
      '@type': 'PostalAddress',
      streetAddress: via,
      postalCode: cap,
      addressLocality: 'Milano',
      addressRegion: 'MI',
      addressCountry: 'IT',
    },
    areaServed: { '@type': 'City', name: 'Milano' },
    availableService: data.servizi.lista.map((s) => ({ '@type': 'MedicalTherapy', name: s.nome })),
  };

  return `<script type="application/ld+json" id="dati-strutturati">\n${JSON.stringify(ld, null, 2)}\n</script>`;
}

// --- Generazione -------------------------------------------------------

function build() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Prima le liste (producono markup che a sua volta non deve essere
  // ripassato dal sostitutore di {{...}}), poi i segnaposto singoli.
  html = html.replace('<!--AREA_CARDS-->', data.aree.lista.map(renderAreaCard).join('\n\n'));
  html = html.replace('<!--SERVICE_ITEMS-->', data.servizi.lista.map(renderServizio).join('\n'));
  html = html.replace('<!--REVIEW_CARDS-->', data.recensioni.lista.map(renderRecensione).join('\n\n'));
  html = html.replace('<!--CREDENTIAL_ITEMS-->', data.chiSono.credenziali.map(renderCredenziale).join('\n\n'));
  html = html.replace('<!--MAPS_LINK-->', renderMapsLink(data.contatti.indirizzo));
  html = html.replace('<!--TEL_LINK-->', renderTelLink(data.contatti.telefono));
  html = html.replace('<!--JSON_LD-->', renderJsonLd(data));

  html = fillPlaceholders(html, data);

  html = '<!-- Pagina generata automaticamente da build.js — NON MODIFICARE A MANO.\n     Per cambiare un testo usa il pannello (/admin/) o content/site.json,\n     poi rigenera con: node build.js -->\n' + html;

  fs.writeFileSync(OUTPUT_PATH, html);
  console.log('index.html generato da templates/index.template.html + content/site.json');
}

try {
  build();
} catch (err) {
  console.error('Build fallita: ' + err.message);
  process.exit(1);
}
