// Comportamenti della navigazione. Ogni blocco controlla di aver trovato i
// propri elementi: se un giorno cambia un id nell'HTML, salta solo il pezzo
// interessato invece di interrompere l'esecuzione e portarsi dietro il resto.

// Bordo della barra di navigazione quando la pagina scorre
const nav = document.getElementById('navbar');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// Pulsante WhatsApp fisso: si fa da parte quando sarebbe di troppo, cioe'
// quando si vedono i pulsanti in cima, quello WhatsApp dei contatti o il piè
// di pagina, che coprirebbe. Si guardano i pulsanti e non le sezioni intere:
// osservando tutta la sezione contatti spariva gia' a meta' delle domande
// frequenti, proprio dove nasce la voglia di scrivere.
// Sparisce anche sulle tariffe: su telefono i prezzi sono allineati a destra,
// esattamente sotto il pulsante, che copriva proprio la cifra cercata.
const whatsappFisso = document.querySelector('.whatsapp-fisso');
if (whatsappFisso && 'IntersectionObserver' in window) {
  const zone = ['.hero-actions', '.services-list', '#contatti .contact-action.is-whatsapp', 'footer']
    .map((selettore) => document.querySelector(selettore))
    .filter(Boolean);
  const inVista = new Set();
  const osservatore = new IntersectionObserver((voci) => {
    voci.forEach((voce) => {
      if (voce.isIntersecting) inVista.add(voce.target);
      else inVista.delete(voce.target);
    });
    whatsappFisso.classList.toggle('fuori-scena', inVista.size > 0);
  });
  zone.forEach((zona) => osservatore.observe(zona));
}

// Menu a comparsa su mobile
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  const setMenu = (aperto) => {
    hamburger.classList.toggle('open', aperto);
    mobileMenu.classList.toggle('open', aperto);
    // Chi usa un lettore di schermo deve sapere se il menu è aperto o chiuso.
    hamburger.setAttribute('aria-expanded', String(aperto));
    // Blocca lo scorrimento della pagina dietro al menu a tutto schermo.
    document.body.style.overflow = aperto ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => {
    setMenu(!mobileMenu.classList.contains('open'));
  });

  // Chiudi il menu quando si sceglie una voce
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  // Esc chiude il menu: è la scorciatoia che ci si aspetta da tastiera.
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && mobileMenu.classList.contains('open')) {
      setMenu(false);
      hamburger.focus();
    }
  });
}
