// Carica i contenuti dai file JSON e li inserisce nella pagina.
// Se un file non si carica, la pagina resta con i contenuti già presenti (fallback sicuro).
(function () {

  // --- TESTI ---
  fetch('content/site.json')
    .then(function (r) {
      if (!r.ok) throw new Error('content non disponibile');
      return r.json();
    })
    .then(function (data) {
      // textContent e non innerHTML: quello che arriva dal pannello viene
      // sempre mostrato come testo, mai interpretato come HTML.
      document.querySelectorAll('[data-content]').forEach(function (el) {
        var key = el.getAttribute('data-content');
        if (data[key] !== undefined && data[key] !== '') {
          el.textContent = data[key];
        }
      });

      // Campi di modulo il cui valore è configurabile (es. la chiave Web3Forms).
      document.querySelectorAll('[data-content-value]').forEach(function (el) {
        var key = el.getAttribute('data-content-value');
        if (typeof data[key] === 'string' && data[key] !== '') {
          el.value = data[key];
        }
      });
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
      // Solo percorsi relativi interni: un valore che punta a un altro sito
      // o a uno schema strano viene ignorato e resta la foto della pagina.
      var path = data.immagine;
      if (typeof path !== 'string' || path === '') return;
      if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.indexOf('//') === 0) return;

      document.querySelectorAll('[data-content-img]').forEach(function (el) {
        el.setAttribute('src', path);
      });
    })
    .catch(function () {
      // Silenzioso: resta la foto statica della pagina
    });

})();
