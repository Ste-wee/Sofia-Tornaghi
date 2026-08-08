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
