/* CİNAR — navigation drawer, scroll effects, reveals, counters, FAQ, testimonials, contact form */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  root.classList.add('ready');
  if (reduceMotion || !hasIO) root.classList.add('reveal-off');

  /* ---------- Navigation drawer ---------- */
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  const menu = $('#nav-menu');
  const backdrop = $('.nav__backdrop');

  const setMenu = (open, returnFocus = false) => {
    if (!nav || !toggle || !menu) return;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (open) {
      const first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    } else if (returnFocus) {
      toggle.focus({ preventScroll: true });
    }
  };

  if (nav && toggle && menu) {
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    if (backdrop) backdrop.addEventListener('click', () => setMenu(false));
    $$('a', menu).forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
    });
    const desktop = window.matchMedia('(min-width: 1025px)');
    const onChange = event => { if (event.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* ---------- Scroll state: nav shadow, progress bar, back-to-top ---------- */
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);

  const toTop = $('.to-top');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    if (nav) nav.classList.toggle('is-scrolled', y > 8);
    progress.style.setProperty('--p', max > 0 ? Math.min(y / max, 1).toFixed(4) : '0');
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Scroll reveal ---------- */
  if (hasIO && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        revealObserver.unobserve(el);
        // Once the entrance has played, drop the attribute so hover styles take over cleanly.
        const delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
        setTimeout(() => el.removeAttribute('data-reveal'), delay + 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(el => revealObserver.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const formatCount = (value, suffix) => Math.round(value).toLocaleString('en-US') + suffix;
  const counters = $$('[data-count]');

  if (counters.length) {
    if (reduceMotion || !hasIO) {
      counters.forEach(el => { el.textContent = formatCount(+el.dataset.count, el.dataset.suffix || ''); });
    } else {
      const run = el => {
        const end = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        const duration = 1700;
        const start = performance.now();
        const step = now => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = formatCount(end * eased, suffix);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      const countObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);
          run(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(el => {
        el.textContent = formatCount(0, el.dataset.suffix || '');
        countObserver.observe(el);
      });
    }
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq').forEach(faq => {
    const button = $('.faq__q', faq);
    if (!button) return;
    button.addEventListener('click', () => {
      const open = faq.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Hero pointer parallax (mouse devices only) ---------- */
  const hero = $('.hero');
  if (hero && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
      hero.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--px', '0');
      hero.style.setProperty('--py', '0');
    });
  }

  /* ---------- Testimonials slider (Swiper is loaded on the home page only) ---------- */
  if (window.Swiper && $('.mySwiper')) {
    new window.Swiper('.mySwiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      grabCursor: true,
      loop: true,
      autoplay: reduceMotion ? false : { delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: '.swiper-pagination', clickable: true },
      breakpoints: {
        700: { slidesPerView: 2, spaceBetween: 24 },
        1100: { slidesPerView: 3, spaceBetween: 24 }
      }
    });
  }

  /* ---------- Contact form (submits to Formspree without leaving the page) ---------- */
  const form = $('.contact__form');
  if (form && window.fetch && window.FormData) {
    const status = $('.form__status', form);
    const button = $('button[type="submit"]', form);
    const label = $('.btn__label', form);
    const idleText = label ? label.textContent : '';

    const setStatus = (type, message) => {
      if (!status) return;
      status.className = 'form__status is-' + type;
      status.textContent = message;
    };

    form.addEventListener('submit', async event => {
      event.preventDefault();
      setStatus('', '');
      button.classList.add('is-loading');
      button.disabled = true;
      if (label) label.textContent = 'Sending…';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (response.ok) {
          form.reset();
          setStatus('success', 'Message sent. We will reply to your email address soon.');
        } else {
          let message = 'The message was not sent. Please try again.';
          try {
            const data = await response.json();
            if (data && data.errors) message = data.errors.map(item => item.message).join(' ');
          } catch (e) { /* keep default message */ }
          setStatus('error', message);
        }
      } catch (e) {
        setStatus('error', 'The message was not sent. Check your connection and try again.');
      } finally {
        button.classList.remove('is-loading');
        button.disabled = false;
        if (label) label.textContent = idleText;
      }
    });
  }
})();
