// Carica i contenuti dai file JSON e li inserisce nella pagina.
// Se un file non si carica, la pagina resta con i contenuti già presenti (fallback sicuro).
//
// IMPORTANTE: i testi statici in index.html devono restare uguali a quelli in
// content/site.json. Sono il fallback se il fetch fallisce o il JS è disattivato:
// se divergono, un visitatore può vedere dati sbagliati (es. il telefono).
(function () {

  // Costruisce un href dal valore di testo appena caricato.
  // Placeholder disponibili in data-href-tpl:
  //   {tel} solo cifre e +   {url} valore codificato per URL   {raw} valore grezzo
  function buildHref(tpl, value) {
    return tpl
      .replace('{tel}', value.replace(/[^\d+]/g, ''))
      .replace('{url}', encodeURIComponent(value))
      .replace('{raw}', value);
  }

  // Riallinea i dati strutturati (SEO) al telefono salvato nel pannello,
  // così una modifica dal CMS non lascia un numero vecchio nei risultati di ricerca.
  function syncDatiStrutturati(data) {
    var node = document.getElementById('dati-strutturati');
    if (!node || !data.telefono) return;
    try {
      var ld = JSON.parse(node.textContent);
      // In formato E.164 italiano il prefisso +39 precede il numero così com'è,
      // compreso lo zero iniziale dei fissi.
      var cifre = data.telefono.replace(/[^\d]/g, '');
      if (cifre) {
        ld.telephone = '+39' + cifre;
        node.textContent = JSON.stringify(ld);
      }
    } catch (e) {
      // Lascia i dati statici già presenti nella pagina
    }
  }

  // --- TESTI ---
  fetch('content/site.json')
    .then(function (r) {
      if (!r.ok) throw new Error('content non disponibile');
      return r.json();
    })
    .then(function (data) {
      document.querySelectorAll('[data-content]').forEach(function (el) {
        var key = el.getAttribute('data-content');
        var value = data[key];
        if (value === undefined || value === '') return;

        el.textContent = value;

        var tpl = el.getAttribute('data-href-tpl');
        if (tpl) el.setAttribute('href', buildHref(tpl, value));
      });
      syncDatiStrutturati(data);
    })
    .catch(function () {
      // Silenzioso: restano i testi statici della pagina
    });

  // --- FOTO ---
  fetch('content/foto.json')
    .then(function (r) {
      if (!r.ok) throw new Error('foto non disponibile');
      return r.json();
    })
    .then(function (data) {
      if (data.immagine) {
        document.querySelectorAll('[data-content-img]').forEach(function (el) {
          el.setAttribute('src', data.immagine);
        });
      }
    })
    .catch(function () {
      // Silenzioso: resta la foto statica della pagina
    });

})();
