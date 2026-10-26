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
      // Come nel browser: un campo vuoto lascia il testo di ripiego.
      if (typeof valori[chiave] !== 'string' || valori[chiave] === '') return intero;
      if (dentro.indexOf('<') !== -1) return intero;

      const valore = valori[chiave].replace(/\r\n/g, '\n');
      const testo = escapeHtml(valore).replace(/\n/g, aCapoDelFile);
      const nuovo = aggiornaClasse(apertura, valore.indexOf('\n') !== -1) + testo + chiusura;
      if (nuovo !== intero) cambiati++;
      return nuovo;
    }
  );
  return { html: risultato, cambiati: cambiati };
}
