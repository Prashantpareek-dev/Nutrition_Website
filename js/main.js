/* ==============================================
   SS Herbal India – Main JavaScript
   ============================================== */
'use strict';

let locoScroll = null; // Locomotive Scroll instance

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------
     0. LOCOMOTIVE SCROLL – Smooth Scrolling
  ------------------------------------------------ */
  const scrollContainer = document.querySelector('[data-scroll-container]');

  if (scrollContainer && typeof LocomotiveScroll !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    locoScroll = new LocomotiveScroll({
      el: scrollContainer,
      smooth: !prefersReducedMotion,
      multiplier: 1,
      lerp: 0.08,
      tablet: { smooth: true, breakpoint: 1024 },
      smartphone: { smooth: false },
    });

    // Delegate fade-up animations to Locomotive's viewport tracker
    scrollContainer.querySelectorAll('.fade-up').forEach(el => {
      el.setAttribute('data-scroll', '');
      el.setAttribute('data-scroll-class', 'in-view');
      el.setAttribute('data-scroll-offset', '10%, 0');
    });

    // Trigger counter animation via Locomotive's call event
    scrollContainer.querySelectorAll('[data-count]').forEach(el => {
      el.setAttribute('data-scroll', '');
      el.setAttribute('data-scroll-call', 'countUp');
      el.setAttribute('data-scroll-offset', '30%, 0');
    });

    locoScroll.on('call', (func, way, obj) => {
      if (func === 'countUp' && way === 'enter') {
        const el = obj.el;
        if (el.dataset.counted) return;
        el.dataset.counted = 'true';
        animateCounter(el);
      }
    });

    locoScroll.update();

    // Re-calculate height after all images/fonts have loaded
    window.addEventListener('load', () => locoScroll.update());
  }

  /* ------------------------------------------------
     1. STICKY HEADER + SCROLL-TO-TOP
  ------------------------------------------------ */
  const header    = document.querySelector('.header');
  const scrollBtn = document.querySelector('.scroll-top');

  const updateScrollUI = (y) => {
    if (header)    header.classList.toggle('scrolled', y > 60);
    if (scrollBtn) scrollBtn.classList.toggle('visible', y > 420);
  };

  if (locoScroll) {
    locoScroll.on('scroll', ({ scroll }) => updateScrollUI(scroll.y));
  } else {
    window.addEventListener('scroll', () => updateScrollUI(window.scrollY), { passive: true });
  }

  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      if (locoScroll) locoScroll.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------
     2. MOBILE NAVIGATION
  ------------------------------------------------ */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------
     3. ACTIVE NAV LINK HIGHLIGHTING
  ------------------------------------------------ */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ------------------------------------------------
     4. SCROLL ANIMATION – IO fallback (Locomotive handles it when active)
  ------------------------------------------------ */
  const fadeEls = document.querySelectorAll('.fade-up');

  if (!locoScroll && fadeEls.length > 0) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    fadeEls.forEach(el => io.observe(el));
  }

  /* ------------------------------------------------
     5. ANIMATED COUNTER – IO fallback (Locomotive handles it when active)
  ------------------------------------------------ */
  const counters = document.querySelectorAll('[data-count]');

  if (!locoScroll && counters.length > 0) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(c => cio.observe(c));
  }

  /* ------------------------------------------------
     HELPER: Counter animation (shared by section 0 & 5)
  ------------------------------------------------ */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const dur    = 1400; // ms
    const start  = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / dur, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------
     6. FAQ ACCORDION
  ------------------------------------------------ */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-q');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      faqItems.forEach(i => i.classList.remove('open'));
      // Toggle current
      if (!isOpen) item.classList.add('open');
    });

    // Keyboard accessibility
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });

    question.setAttribute('tabindex', '0');
    question.setAttribute('role', 'button');
  });

  /* ------------------------------------------------
     7. CONTACT FORM VALIDATION + PSEUDO-SUBMIT
  ------------------------------------------------ */
  const form = document.getElementById('contactForm');

  if (form) {
    const showError = (field) => {
      field.classList.add('error');
    };
    const clearError = (field) => {
      field.classList.remove('error');
    };

    // Real-time clear
    form.querySelectorAll('.form-control').forEach(f => {
      f.addEventListener('input', () => clearError(f));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;

      const name    = form.querySelector('#name');
      const email   = form.querySelector('#email');
      const phone   = form.querySelector('#phone');
      const message = form.querySelector('#message');

      [name, email, message].forEach(f => {
        if (f && !f.value.trim()) { showError(f); valid = false; }
        else if (f) clearError(f);
      });

      // Email format
      if (email && email.value.trim()) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email.value.trim())) { showError(email); valid = false; }
      }

      // Phone format (optional but if present validate basic digits)
      if (phone && phone.value.trim()) {
        const phoneRe = /^[0-9+\-\s()]{7,15}$/;
        if (!phoneRe.test(phone.value.trim())) { showError(phone); valid = false; }
      }

      if (valid) {
        // Simulate submission — in production, replace with fetch() to backend
        const btn = form.querySelector('.form-btn');
        if (btn) {
          btn.textContent = 'Sending…';
          btn.disabled = true;
        }

        setTimeout(() => {
          form.style.display = 'none';
          const success = document.getElementById('formSuccess');
          if (success) success.style.display = 'block';
        }, 800);
      }
    });
  }

  /* ------------------------------------------------
     8. HERO ENTRANCE ANIMATION
  ------------------------------------------------ */
  const heroText = document.querySelector('.hero-text');
  const heroImg  = document.querySelector('.hero-Image-wrap');

  const animateIn = (el, delay = 0) => {
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = 'translateY(32px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.85s cubic-bezier(0.4,0,0.2,1), transform 0.85s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, delay);
  };

  animateIn(heroText, 120);
  animateIn(heroImg, 300);

  /* ------------------------------------------------
     9. PAGE TRANSITION
  ------------------------------------------------ */
  const overlay = document.getElementById('pageTransition');

  // Fade out the overlay when this page has loaded
  if (overlay) {
    // Short rAF ensures paint has happened before removing the overlay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('ready');
      });
    });
  }

  // Intercept every internal same-origin link click
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    // Skip: external, anchor-only, mailto/tel, new-tab, or JS links
    if (
      !href ||
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.target === '_blank' ||
      link.hasAttribute('download') ||
      e.ctrlKey || e.metaKey || e.shiftKey
    ) return;

    e.preventDefault();

    if (!overlay) {
      window.location.href = href;
      return;
    }

    // Restart bar animation by cloning the fill element
    const fill = overlay.querySelector('.pt-bar-fill');
    if (fill) {
      const clone = fill.cloneNode(true);
      fill.parentNode.replaceChild(clone, fill);
    }

    // Show overlay
    overlay.classList.remove('ready');
    overlay.classList.add('leaving');

    // Navigate after the transition completes
    setTimeout(() => {
      window.location.href = href;
    }, 520);
  });

});
