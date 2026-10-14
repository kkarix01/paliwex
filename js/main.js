/* Paliwex — main.js (bez zależności) */

/* ==========================================================================
   KONFIGURACJA — tu zmieniasz adres formularza i mapy
   ========================================================================== */
const CONFIG = {
  // Adres wdrożonej aplikacji Google Apps Script (kończy się na /exec).
  // Puste = formularz nie wysyła danych i informuje o tym użytkownika. Instrukcja: README.md, sekcja 3.
  formEndpoint: '',

  // Adres mapy w iframe. Możesz go zastąpić kodem z Map Google: Udostępnij → Umieść mapę → wartość atrybutu src.
  mapEmbedUrl: 'https://www.google.com/maps?q=Sierpecka+12,+09-317+Lutocin&hl=pl&z=15&output=embed',

  carouselInterval: 5000,
  fallbackPhone: '605 302 448',
  fallbackPhoneHref: 'tel:+48605302448',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onVisible(el, callback, rootMargin = '200px') {
  if (!('IntersectionObserver' in window)) { callback(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); callback(); }
  }, { rootMargin });
  io.observe(el);
}

/* Rok w stopce ------------------------------------------------------------- */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* Nagłówek: cień po przewinięciu ------------------------------------------ */
(() => {
  const header = document.getElementById('site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

/* Menu mobilne ------------------------------------------------------------- */
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.visually-hidden').textContent = open ? 'Zamknij menu' : 'Menu';
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setOpen(false);
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
})();

/* Aktywna pozycja menu na stronie głównej (scrollspy) --------------------- */
(() => {
  const links = [...document.querySelectorAll('.site-nav__link[data-section]')];
  const sections = links.map((l) => document.getElementById(l.dataset.section)).filter(Boolean);
  // Na podstronach aktywna pozycja jest ustawiona w HTML
  if (!document.getElementById('start') || !('IntersectionObserver' in window)) return;

  const setActive = (id) => {
    links.forEach((l) => {
      const active = l.dataset.section === id;
      l.classList.toggle('is-active', active);
      if (active) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current');
    });
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => io.observe(s));
})();

/* Delikatne pojawianie się elementów -------------------------------------- */
(() => {
  const items = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el) => io.observe(el));
})();

/* Mapa (ładowana, gdy zbliża się do ekranu) ------------------------------- */
document.querySelectorAll('[data-map]').forEach((box) => {
  if (!CONFIG.mapEmbedUrl) return;
  onVisible(box, () => {
    const iframe = document.createElement('iframe');
    iframe.src = CONFIG.mapEmbedUrl;
    iframe.title = 'Mapa dojazdu: Paliwex, Sierpecka 12, 09-317 Lutocin';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    box.appendChild(iframe);
  }, '400px');
});

/* Film --------------------------------------------------------------------- */
document.querySelectorAll('.promo-video').forEach((video) => {
  const tile = video.closest('.media-tile');
  const fallback = tile.querySelector('.media-tile__fallback');
  const toggle = tile.querySelector('.video-toggle');
  let userPaused = reduceMotion;

  const showFallback = () => {
    video.hidden = true;
    toggle.hidden = true;
    if (fallback) fallback.hidden = false;
  };

  const syncButton = () => {
    const paused = video.paused;
    toggle.setAttribute('aria-label', paused ? 'Odtwórz film' : 'Zatrzymaj film');
    toggle.querySelector('use').setAttribute('href', `/assets/icons/sprite.svg#${paused ? 'i-play' : 'i-pause'}`);
  };

  const tryPlay = () => video.play().catch(() => { syncButton(); });

  video.addEventListener('error', showFallback);
  video.addEventListener('play', syncButton);
  video.addEventListener('pause', syncButton);

  toggle.addEventListener('click', () => {
    if (video.paused) { userPaused = false; tryPlay(); } else { userPaused = true; video.pause(); }
  });

  onVisible(tile, () => {
    const source = document.createElement('source');
    source.src = video.dataset.src;
    source.type = 'video/mp4';
    source.addEventListener('error', showFallback);
    video.appendChild(source);
    video.load();
    toggle.hidden = false;
    syncButton();

    // Odtwarzaj tylko, gdy film jest widoczny (oszczędza baterię i transfer)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !userPaused) tryPlay();
        else if (!e.isIntersecting && !video.paused) video.pause();
      }, { threshold: 0.25 }).observe(tile);
    } else if (!userPaused) {
      tryPlay();
    }
  }, '300px');
});

/* Karuzela zdjęć ----------------------------------------------------------- */
document.querySelectorAll('[data-carousel]').forEach((root) => {
  const track = root.querySelector('.carousel__track');
  const slides = [...track.children];
  const bar = root.querySelector('.carousel__bar');
  const pauseBtn = root.querySelector('.carousel__pause');
  let index = 0;
  let timer = null;
  let stopped = reduceMotion;  // zatrzymane przez użytkownika lub preferencje systemowe
  let hovering = false;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel__dot';
    dot.setAttribute('aria-label', `Zdjęcie ${i + 1} z ${slides.length}`);
    dot.addEventListener('click', () => { goTo(i); restart(); });
    bar.appendChild(dot);
    return dot;
  });

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((s, n) => {
      const current = n === index;
      s.setAttribute('aria-hidden', String(!current));
      s.inert = !current;
    });
    dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
  }

  function start() {
    clearInterval(timer);
    if (stopped || hovering || document.hidden) return;
    timer = setInterval(() => goTo(index + 1), CONFIG.carouselInterval);
  }
  function restart() { start(); }

  function setStopped(value) {
    stopped = value;
    pauseBtn.setAttribute('aria-label', stopped ? 'Wznów automatyczne przewijanie' : 'Zatrzymaj automatyczne przewijanie');
    pauseBtn.querySelector('use').setAttribute('href', `/assets/icons/sprite.svg#${stopped ? 'i-play' : 'i-pause'}`);
    start();
  }

  root.querySelector('.carousel__btn--prev').addEventListener('click', () => { goTo(index - 1); restart(); });
  root.querySelector('.carousel__btn--next').addEventListener('click', () => { goTo(index + 1); restart(); });
  pauseBtn.addEventListener('click', () => setStopped(!stopped));

  // Wstrzymanie, gdy użytkownik wskazuje karuzelę lub porusza się w niej klawiaturą
  root.addEventListener('mouseenter', () => { hovering = true; start(); });
  root.addEventListener('mouseleave', () => { hovering = false; start(); });
  root.addEventListener('focusin', () => { hovering = true; start(); });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) { hovering = false; start(); } });
  document.addEventListener('visibilitychange', start);

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { goTo(index - 1); restart(); }
    if (e.key === 'ArrowRight') { goTo(index + 1); restart(); }
  });

  // Przesuwanie palcem
  let startX = null;
  root.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') startX = e.clientX; });
  root.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { goTo(index + (dx < 0 ? 1 : -1)); restart(); }
  });
  root.addEventListener('pointercancel', () => { startX = null; });

  goTo(0);
  setStopped(stopped);
});

/* Wybór produktu z karty oferty → pole "Produkt" w formularzu -------------- */
(() => {
  const KEY = 'paliwex-product';
  const select = document.getElementById('f-product');
  const apply = (value) => {
    if (select && value && [...select.options].some((o) => o.value === value || o.text === value)) select.value = value;
  };

  document.querySelectorAll('[data-product]').forEach((link) => {
    link.addEventListener('click', () => {
      try { sessionStorage.setItem(KEY, link.dataset.product); } catch (_) { /* tryb prywatny */ }
      apply(link.dataset.product);
    });
  });

  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && select) { apply(saved); sessionStorage.removeItem(KEY); }
  } catch (_) { /* brak dostępu do sessionStorage */ }
})();

/* Formularz zapytania ofertowego ------------------------------------------ */
document.querySelectorAll('[data-quote-form]').forEach((form) => {
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');
  const label = submit.querySelector('[data-label]');
  const renderedAt = Date.now();

  const MESSAGES = {
    valueMissing: 'To pole jest wymagane.',
    typeMismatch: 'Wpisz poprawny adres e-mail.',
    patternMismatch: 'Wpisz poprawny numer telefonu.',
    consent: 'Zgoda jest wymagana, abyśmy mogli odpowiedzieć na zapytanie.',
  };

  const contactLine = `Zadzwoń: <a href="${CONFIG.fallbackPhoneHref}">${CONFIG.fallbackPhone}</a> lub napisz: <a href="mailto:oldakowski.grzegorz@wp.pl">oldakowski.grzegorz@wp.pl</a>.`;

  function showStatus(type, html) {
    status.className = `form-status form-status--${type}`;
    status.innerHTML = html;
    status.hidden = false;
  }

  function validateField(input) {
    const field = input.closest('.field');
    if (!field) return true;
    const error = field.querySelector('.field__error');
    let message = '';
    const v = input.validity;
    if (!v.valid) {
      if (input.type === 'checkbox') message = MESSAGES.consent;
      else if (v.valueMissing) message = MESSAGES.valueMissing;
      else if (v.typeMismatch) message = MESSAGES.typeMismatch;
      else if (v.patternMismatch) message = MESSAGES.patternMismatch;
      else message = 'Sprawdź to pole.';
    }
    field.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) {
      if (!error.id) error.id = `${input.id || input.name}-error`;
      input.setAttribute('aria-describedby', error.id);
      error.textContent = message;
    }
    return !message;
  }

  const inputs = [...form.querySelectorAll('input, select, textarea')].filter((el) => el.name !== 'website');
  inputs.forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.closest('.is-invalid')) validateField(el); });
    el.addEventListener('change', () => { if (el.closest('.is-invalid')) validateField(el); });
  });

  function setSending(sending) {
    submit.disabled = sending;
    form.setAttribute('aria-busy', String(sending));
    label.textContent = sending ? 'Wysyłanie…' : 'Wyślij zapytanie';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;

    const firstInvalid = inputs.map((el) => (validateField(el) ? null : el)).find(Boolean);
    if (firstInvalid) {
      firstInvalid.focus();
      showStatus('error', 'Uzupełnij zaznaczone pola i spróbuj ponownie.');
      return;
    }

    // Honeypot lub zbyt szybkie wysłanie = najpewniej bot. Nie wysyłamy, nie pokazujemy sukcesu.
    if (form.elements.website.value || Date.now() - renderedAt < 3000) {
      showStatus('error', `Nie udało się wysłać formularza. ${contactLine}`);
      return;
    }

    if (!CONFIG.formEndpoint) {
      showStatus('info', `Formularz online jest w trakcie konfiguracji i nie wysyła jeszcze wiadomości. ${contactLine}`);
      return;
    }

    const data = new URLSearchParams(new FormData(form));
    data.set('page', window.location.pathname);
    data.set('elapsed_ms', String(Date.now() - renderedAt));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    setSending(true);

    try {
      // Treść jako application/x-www-form-urlencoded = "prosty" request CORS, który Apps Script obsługuje bez preflight
      const res = await fetch(CONFIG.formEndpoint, { method: 'POST', body: data, signal: controller.signal });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.ok !== true) throw new Error((json && json.error) || `HTTP ${res.status}`);

      form.reset();
      inputs.forEach((el) => { el.closest('.field')?.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); });
      showStatus('success', 'Dziękujemy! Zapytanie zostało wysłane. Skontaktujemy się z Tobą najszybciej, jak to możliwe.');
    } catch (err) {
      console.error('Wysyłka formularza nie powiodła się:', err);
      const reason = err.name === 'AbortError' ? 'Serwer nie odpowiedział w wyznaczonym czasie.' : 'Wystąpił błąd podczas wysyłania.';
      showStatus('error', `${reason} Twoje dane nie zostały wysłane. Spróbuj ponownie za chwilę. ${contactLine}`);
    } finally {
      clearTimeout(timeout);
      setSending(false);
    }
  });
});
