// Carica i contenuti dai file JSON e li inserisce nella pagina.
// Se un file non si carica, la pagina resta con i contenuti già presenti (fallback sicuro).
(function () {

  // --- RECAPITI ---

  // Riduce un numero scritto in un modo qualsiasi al formato internazionale
  // senza segni: "+39 335 166 5278", "335 1665278" e "0039 3351665278"
  // finiscono tutti su "393351665278".
  function toInternational(raw) {
    var value = String(raw).replace(/[^\d+]/g, '');
    var declaresPrefix = value.charAt(0) === '+';

    value = value.replace(/\D/g, '');
    if (!declaresPrefix && value.indexOf('00') === 0) value = value.slice(2);

    // Numero italiano scritto senza prefisso internazionale: i cellulari
    // iniziano per 3, i fissi per 0 e nel formato internazionale lo zero
    // iniziale si conserva (+39 02 ...).
    var italianNational = /^[03]/.test(value) && value.length >= 9 && value.length <= 11;
    if (!declaresPrefix && italianNational) {
      value = '39' + value;
    }
    return value;
  }

  function looksLikePhoneNumber(value) {
    return value.length >= 11 && value.length <= 15;
  }

  function looksLikeEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function activate(element, href, noteText) {
    element.setAttribute('href', href);
    element.removeAttribute('hidden');

    var note = element.querySelector('[data-contact-action-value]');
    if (note && noteText) note.textContent = noteText;
  }

  function find(action) {
    return document.querySelector('[data-contact-action="' + action + '"]');
  }

  // Ogni pulsante compare solo se il recapito corrispondente è configurato:
  // meglio un pulsante in meno che un pulsante che non porta da nessuna parte.
  function buildContactActions(data) {
    var email = typeof data.email === 'string' ? data.email.trim() : '';
    var phoneRaw = typeof data.telefono === 'string' ? data.telefono.trim() : '';
    var whatsappRaw = typeof data.whatsapp === 'string' ? data.whatsapp.trim() : '';

    // EMAIL
    var emailButton = find('email');
    if (emailButton && looksLikeEmail(email)) {
      activate(
        emailButton,
        'mailto:' + email + '?subject=' + encodeURIComponent('Richiesta di informazioni dal sito'),
        email
      );
    }

    // TELEFONO
    var phone = toInternational(phoneRaw);
    var phoneButton = find('telefono');
    if (phoneButton && looksLikePhoneNumber(phone)) {
      activate(phoneButton, 'tel:+' + phone, phoneRaw);
    }

    // WHATSAPP — se non è indicato un numero dedicato si riusa quello di
    // telefono, ma solo quando è un cellulare italiano: su un fisso
    // WhatsApp non esiste e il pulsante porterebbe a una pagina di errore.
    var whatsapp = toInternational(whatsappRaw);
    if (!whatsapp && /^393/.test(phone)) whatsapp = phone;

    var whatsappButton = find('whatsapp');
    if (whatsappButton && looksLikePhoneNumber(whatsapp)) {
      var testo = typeof data.whatsapp_messaggio === 'string' ? data.whatsapp_messaggio.trim() : '';
      var href = 'https://wa.me/' + whatsapp;
      if (testo) href += '?text=' + encodeURIComponent(testo);
      activate(whatsappButton, href, null);
    }
  }

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

      buildContactActions(data);
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
