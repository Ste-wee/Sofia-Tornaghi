// Riscrive i testi di ripiego dentro le pagine con i valori del pannello.
//
// Le pagine si riempiono nel browser con content-loader.js, ma chi legge
// l'HTML senza eseguire il JavaScript — parte dei motori di ricerca, gli
// strumenti che fanno anteprime, chi ha una connessione lenta per il primo
// istante — vede il testo scritto dentro il segnaposto. Senza questo passo
// quel testo restava quello del giorno in cui era stato scritto a mano, e
// ogni salvataggio di Sofia lo allontanava di piu' da quello vero.
//
// Codice senza dipendenze dal runtime di Cloudflare, cosi' si prova anche
// con node sul proprio computer.

export const PAGINE = ['index.html', 'privacy.html'];

// Come textContent nel browser: il valore finisce in pagina come testo,
// mai interpretato come HTML.
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// La stessa regola di content-loader.js: la classe c'e' solo quando il testo
// va davvero a capo. Va anche tolta, perche' il valore precedente poteva
// averne bisogno e quello nuovo no.
function aggiornaClasse(apertura, aCapo) {
  const match = apertura.match(/\sclass="([^"]*)"/);
  const classi = (match ? match[1] : '').split(/\s+/).filter(function (c) {
    return c && c !== 'testo-a-capo';
  });
  if (aCapo) classi.push('testo-a-capo');

  if (match) {
    return classi.length
      ? apertura.replace(match[0], ' class="' + classi.join(' ') + '"')
      : apertura.replace(match[0], '');
  }
  return classi.length ? apertura.replace(/>$/, ' class="' + classi.join(' ') + '">') : apertura;
}

// --- L'INDIRIZZO NELL'INTESTAZIONE ---
//
// La descrizione per i motori di ricerca e i dati strutturati per Google
// stanno in testa alla pagina, dove i segnaposto non arrivano. Finche' erano
// scritti a mano, il cambio di studio del 26 ottobre li aveva lasciati su
// Viale Gran Sasso per un mese. Ora si ricavano dal campo "indirizzo".

// Una riga per studio, come la scrive Sofia nel pannello. La citta' e' dopo
// l'ultima virgola ("Corso Lodi 24, Milano"); senza virgola, dopo l'ultimo
// numero civico ("Corso Lodi 24 Milano"). Il CAP, se c'e', si stacca dalla
// citta'. Una riga in cui la citta' non si riconosce rende nullo tutto:
// meglio lasciare la descrizione di prima che scriverne una zoppa.
export function studiDa(indirizzo) {
  const righe = String(indirizzo || '').split(/\r?\n/).map(function (r) { return r.trim(); })
    .filter(function (r) { return r !== ''; });
  const studi = righe.map(function (riga) {
    let via, resto;
    const virgola = riga.lastIndexOf(',');
    if (virgola !== -1) {
      via = riga.slice(0, virgola).trim();
      resto = riga.slice(virgola + 1).trim();
    } else {
      const m = riga.match(/^(.*\d+[a-zA-Z]?(?:\/\w+)?)\s+(\D.*)$/);
      if (!m) return null;
      via = m[1].trim();
      resto = m[2].trim();
    }
    const cap = (resto.match(/\b\d{5}\b/) || [''])[0];
    const citta = resto.replace(cap, '').replace(/\s+/g, ' ').trim();
    if (!via || !citta) return null;
    return { riga: riga, via: via, citta: citta, cap: cap };
  });
  return studi.length && studi.every(Boolean) ? studi : [];
}

// "a", "a e b", "a, b e c"
function elenco(parti) {
  if (parti.length < 2) return parti.join('');
  return parti.slice(0, -1).join(', ') + ' e ' + parti[parti.length - 1];
}

function senzaDoppioni(parti) {
  return parti.filter(function (p, i) { return parti.indexOf(p) === i; });
}

function decodificaAttributo(testo) {
  return testo.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function codificaAttributo(testo) {
  return testo.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Le <meta> con data-modello: il testo e' quello scritto a mano nel modello,
// con {citta}, {studi} e {indirizzi} riempiti dagli studi.
function aggiornaDescrizioni(html, studi) {
  const sostituzioni = {
    citta: elenco(senzaDoppioni(studi.map(function (s) { return s.citta; }))),
    studi: studi.length === 1 ? 'Studio' : 'Studi',
    indirizzi: elenco(studi.map(function (s) { return s.via + ', ' + s.citta; }))
  };
  return html.replace(/<meta\b[^>]*\bdata-modello="([^"]*)"[^>]*>/g, function (tag, modello) {
    const testo = decodificaAttributo(modello).replace(/\{(citta|studi|indirizzi)\}/g, function (m, nome) {
      return sostituzioni[nome];
    });
    return tag.replace(/\scontent="[^"]*"/, ' content="' + codificaAttributo(testo) + '"');
  });
}

// I dati strutturati: indirizzo del primo studio, una sede per ogni studio
// quando sono piu' d'uno, e le citta' servite. Il resto resta com'e'.
function aggiornaDatiStrutturati(html, studi, aCapoDelFile) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, function (intero, apre, json, chiude) {
    let dati;
    try { dati = JSON.parse(json); } catch (e) { return intero; }
    const indirizzo = function (s) {
      const a = { '@type': 'PostalAddress', streetAddress: s.via };
      if (s.cap) a.postalCode = s.cap;
      a.addressLocality = s.citta;
      a.addressCountry = 'IT';
      return a;
    };
    dati.address = indirizzo(studi[0]);
    if (studi.length > 1) {
      dati.location = studi.map(function (s) { return { '@type': 'Place', address: indirizzo(s) }; });
    } else {
      delete dati.location;
    }
    const citta = senzaDoppioni(studi.map(function (s) { return s.citta; }));
    dati.areaServed = citta.length === 1 ? citta[0] : citta;
    // "<" scritto come <: un indirizzo che contenesse "</script>" non
    // deve poter chiudere il blocco e iniettare codice nella pagina.
    const testo = JSON.stringify(dati, null, 2).replace(/</g, '\\u003c')
      .split('\n').map(function (r) { return '  ' + r; }).join(aCapoDelFile);
    return apre + aCapoDelFile + testo + aCapoDelFile + '  ' + chiude;
  });
}

// Restituisce l'HTML con i segnaposto riempiti, e quanti ne ha cambiati.
//
// Si lavora sul testo invece che su un albero DOM perche' i segnaposto sono
// tutti elementi semplici, senza altri tag dentro. Se un giorno uno ne
// contenesse, viene lasciato com'e': meglio un testo di ripiego vecchio che
// un pezzo di pagina cancellato.
export function riempiPagina(html, valori) {
  // Gli a capo del testo seguono quelli del file, altrimenti un HTML scritto
  // con a capo Windows si ritrova con righe miste a ogni salvataggio.
  const aCapoDelFile = html.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  let cambiati = 0;
  const risultato = html.replace(
    /(<(\w+)\b[^>]*\bdata-content="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    function (intero, apertura, tag, chiave, dentro, chiusura) {
      if (typeof valori[chiave] !== 'string') return intero;
      if (dentro.indexOf('<') !== -1) return intero;

      // Come nel browser: un campo vuoto lascia il testo di ripiego, tranne
      // quelli segnati come facoltativi, che vanno svuotati. Senza questa
      // eccezione un titolo scritto e poi cancellato resterebbe in pagina,
      // perche' il ripiego e' proprio il valore scritto qui l'ultima volta.
      if (valori[chiave] === '') {
        if (!/\sdata-facoltativo[\s>=]/.test(apertura)) return intero;
        const svuotato = aggiornaClasse(apertura, false) + chiusura;
        if (svuotato !== intero) cambiati++;
        return svuotato;
      }

      const valore = valori[chiave].replace(/\r\n/g, '\n');
      const testo = escapeHtml(valore).replace(/\n/g, aCapoDelFile);
      const nuovo = aggiornaClasse(apertura, valore.indexOf('\n') !== -1) + testo + chiusura;
      if (nuovo !== intero) cambiati++;
      return nuovo;
    }
  );

  const studi = studiDa(valori.indirizzo);
  if (!studi.length) return { html: risultato, cambiati: cambiati };
  const conIntestazione = aggiornaDatiStrutturati(aggiornaDescrizioni(risultato, studi), studi, aCapoDelFile);
  if (conIntestazione !== risultato) cambiati++;
  return { html: conIntestazione, cambiati: cambiati };
}
