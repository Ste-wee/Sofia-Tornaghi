// Scroll navbar border
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    // Tiene allineati classi, stato ARIA ed etichetta: chi usa uno screen reader
    // deve sapere se il menu è aperto, non solo vederlo.
    function setMenu(open) {
      hamburger.classList.toggle('open', open);
      mobileMenu.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    hamburger.addEventListener('click', () => {
      setMenu(!mobileMenu.classList.contains('open'));
    });

    // Chiudi menu al click su un link
    document.querySelectorAll('.nav-mobile-menu a').forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });

    // Chiudi menu con Esc e riporta il focus sul pulsante
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        setMenu(false);
        hamburger.focus();
      }
    });
