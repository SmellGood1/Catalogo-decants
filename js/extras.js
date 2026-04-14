/*
 * extras.js — Secciones auxiliares y efectos visuales del sitio.
 *   · Catálogo de frascos completos
 *   · Combos
 *   · Destacados (bestsellers)
 *   · Hero particles + parallax
 *   · Card tilt 3D + glare overlay
 *   · Botones magnéticos (scope acotado, rAF throttled)
 *   · Count-up animado
 *   · Announcement bar, scroll-top, scroll reveal
 *   · Easter egg "smell"
 */
(function (SG) {
  'use strict';

  var el = SG.el, byId = SG.byId;
  var rafThrottle = SG.rafThrottle;

  /* ── Catálogo Completos ─────────────────────────────────────── */

  function completoCardClass(p) {
    return 'card revealed' + (p.proximo ? ' proximo' : '') + (p.agotado ? ' agotado' : '');
  }

  function buildCompletoImg(p) {
    var img = el('img', {
      src: p.img || 'assets/favicon.svg',
      alt: p.name || '',
      loading: 'lazy'
    });
    img.addEventListener('error', function () {
      img.style.opacity = '0.3';
      img.src = 'assets/favicon.svg';
    }, { once: true });
    return img;
  }

  function buildCompletoTop(p) {
    var top = el('div', { class: 'card-top' });
    if (p.agotado) {
      top.appendChild(el('div', { class: 'agotado-label', text: 'Agotado' }));
    } else if (p.proximo) {
      top.appendChild(el('span', {
        class: 'soon-label' + (p.muyPronto ? ' muy-pronto-label' : ''),
        text: p.muyPronto ? 'Muy pronto' : 'Próximamente'
      }));
    } else {
      if (p.conc) top.appendChild(el('span', { class: 'pill', text: p.conc }));
      if (p.ml)   top.appendChild(el('span', { class: 'pill', text: p.ml + ' ml' }));
    }
    return top;
  }

  function buildCompletoBottom(p) {
    var wrap = document.createDocumentFragment();
    if (p.agotado) {
      var bottom = el('div', { class: 'bottom' });
      bottom.appendChild(el('div', { class: 'starting' }, [ el('span', { text: 'Agotado' }) ]));
      if (p.link) {
        bottom.appendChild(el('a', {
          href: p.link, target: '_blank', rel: 'noopener noreferrer',
          class: 'small-btn agotado-link', text: 'Fragrantica'
        }));
      }
      wrap.appendChild(bottom);
      return wrap;
    }

    if (p.entrega && !p.proximo) {
      wrap.appendChild(el('div', { class: 'entrega-label', text: '📦 ' + p.entrega }));
    }
    var bottomOk = el('div', { class: 'bottom' }, [
      el('div', { class: 'starting' }, [
        el('span', { text: 'Frasco completo' }),
        el('strong', { text: '$' + (p.price || 0) })
      ])
    ]);
    if (!p.proximo) bottomOk.appendChild(el('button', { class: 'small-btn', type: 'button', text: 'Ver' }));
    wrap.appendChild(bottomOk);
    return wrap;
  }

  function renderCompletos() {
    var container = byId('catalogoCompletos');
    if (!container || !window.COMPLETOS) return;

    var casas = Object.keys(window.COMPLETOS);
    if (!casas.length) {
      container.textContent = '';
      container.appendChild(el('p', {
        style: { textAlign: 'center', color: 'var(--muted)', padding: '3rem 1rem' },
        text: 'Próximamente — estamos preparando esta sección.'
      }));
      return;
    }

    container.textContent = '';
    var has = Object.prototype.hasOwnProperty;

    casas.forEach(function (casa) {
      if (!has.call(window.COMPLETOS, casa)) return;

      var title = el('div', { class: 'house-title revealed' }, [
        el('h3', { text: casa }),
        el('div', { class: 'house-line' })
      ]);
      title.style.opacity = '1';
      title.style.transform = 'none';
      container.appendChild(title);

      var grid = el('div', { class: 'grid' });
      window.COMPLETOS[casa].forEach(function (p) {
        var card = el('article', { class: completoCardClass(p) });
        card.style.opacity = '1';
        card.style.transform = 'none';
        card.appendChild(buildCompletoTop(p));
        card.appendChild(el('div', { class: 'card-img-wrap' }, [ buildCompletoImg(p) ]));
        card.appendChild(el('div', { class: 'card-content' }, [
          el('h4', { text: p.name }),
          el('div', { class: 'brand', text: casa }),
          buildCompletoBottom(p)
        ]));

        if (!p.proximo && !p.agotado) {
          card.addEventListener('click', function () {
            var perfumeConCasa = {};
            for (var k in p) { if (has.call(p, k)) perfumeConCasa[k] = p[k]; }
            perfumeConCasa.casa = casa;
            perfumeConCasa.isCompleto = true;
            verPerfume(perfumeConCasa);
          });
        }
        grid.appendChild(card);
      });
      container.appendChild(grid);
    });
  }

  /* ── Combos ──────────────────────────────────────────────────── */

  function sumAtMl(perfumes, ml) {
    return perfumes.reduce(function (s, p) { return s + (p.prices[ml] || 0); }, 0);
  }

  function buildPriceTag(ml, orig, comboPrice, isActive) {
    return el('div', {
      class: 'combo-price-tag' + (isActive ? ' active' : ''),
      dataset: { ml: String(ml), orig: String(orig) }
    }, [
      el('span',   { text: ml + 'ml' }),
      el('s',      { text: '$' + orig }),
      el('strong', { text: '$' + comboPrice })
    ]);
  }

  function buildComboCard(combo, perfumes) {
    var card = el('article', { class: 'combo-card' });

    var savingsEl = el('span', { class: 'combo-savings', text: 'Ahorras $' + (sumAtMl(perfumes, 5) - combo.prices[5]) });
    card.appendChild(el('div', { class: 'combo-header' }, [
      el('h3', { text: combo.name }),
      savingsEl
    ]));

    var perfumesRow = el('div', { class: 'combo-perfumes' });
    perfumes.forEach(function (p, i) {
      if (i > 0) perfumesRow.appendChild(el('span', { class: 'combo-plus', text: '+' }));
      perfumesRow.appendChild(el('div', { class: 'combo-perfume' }, [
        el('img', { src: p.img || 'assets/favicon.svg', alt: p.name, loading: 'lazy' }),
        el('span', { class: 'combo-perfume-name', text: p.name }),
        el('span', { class: 'combo-perfume-brand', text: p.casa })
      ]));
    });
    card.appendChild(perfumesRow);

    var prices = el('div', { class: 'combo-prices' });
    [2, 5, 10].forEach(function (ml) {
      prices.appendChild(buildPriceTag(ml, sumAtMl(perfumes, ml), combo.prices[ml], ml === 5));
    });
    var addBtn = el('button', { class: 'btn btn-primary combo-add-btn', type: 'button', text: 'Añadir combo' });
    card.appendChild(el('div', { class: 'combo-footer' }, [ prices, addBtn ]));

    card.addEventListener('click', function (e) {
      var tag = e.target.closest('.combo-price-tag');
      if (!tag) return;
      SG.$$('.combo-price-tag', card).forEach(function (t) { t.classList.remove('active'); });
      tag.classList.add('active');
      var ml = Number(tag.dataset.ml);
      var s = sumAtMl(perfumes, ml) - combo.prices[ml];
      savingsEl.textContent = 'Ahorras $' + s;
      savingsEl.style.display = s <= 0 ? 'none' : '';
    });

    addBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var activeTag = SG.$('.combo-price-tag.active', card);
      var ml = Number(activeTag.dataset.ml);
      window.agregarComboAlCarrito(combo, perfumes, ml);
    });

    if (combo.video) card.dataset.video = 'assets/' + combo.video;
    return card;
  }

  function renderCombos() {
    var container = byId('combosContainer');
    if (!container || !window.COMBOS || !window.PERFUMES) return;

    var combos = window.COMBOS.filter(function (c) { return !c.agotado; });
    if (!combos.length) {
      var section = container.closest('.combos-section');
      if (section) section.style.display = 'none';
      return;
    }

    container.textContent = '';
    combos.forEach(function (combo) {
      var perfumes = combo.codes.map(findPerfumeByCode).filter(Boolean);
      if (perfumes.length < 3) return;
      container.appendChild(buildComboCard(combo, perfumes));
    });
  }

  /* ── Destacados (bestsellers) ─────────────────────────────────── */

  function buildBestsellerCard(item, index) {
    var p = item.perfume, casa = item.casa;
    var card = el('article', { class: 'bestseller-card', tabindex: '0', role: 'button', 'aria-label': 'Ver ' + (p.name || '') });
    card.appendChild(el('span', { class: 'bestseller-rank', text: '#' + (index + 1) }));
    card.appendChild(el('div', { class: 'bestseller-badge', text: 'Bestseller' }));
    card.appendChild(el('div', { class: 'bs-img-wrap' }, [
      el('img', { src: p.img || 'assets/favicon.svg', alt: p.name, loading: 'lazy' })
    ]));
    card.appendChild(el('div', { class: 'bestseller-content' }, [
      el('div', { class: 'bs-brand', text: casa }),
      el('h4', { text: p.name }),
      el('div', { class: 'bs-conc', text: p.conc || '\u00A0' }),
      el('div', { class: 'bestseller-bottom' }, [
        el('div', { class: 'bs-price' }, [
          el('span', { text: 'Desde' }),
          el('strong', { text: '$' + p.prices[2] })
        ]),
        el('span', { class: 'bs-cta', text: 'Ver' })
      ])
    ]));

    var open = function () {
      var perfumeConCasa = {};
      for (var k in p) { if (Object.prototype.hasOwnProperty.call(p, k)) perfumeConCasa[k] = p[k]; }
      perfumeConCasa.casa = casa;
      verPerfume(perfumeConCasa);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    return card;
  }

  function renderDestacados() {
    var container = byId('destacados');
    if (!container || !window.PERFUMES) return;

    var destacados = [];
    var has = Object.prototype.hasOwnProperty;
    for (var casa in window.PERFUMES) {
      if (!has.call(window.PERFUMES, casa)) continue;
      window.PERFUMES[casa].forEach(function (p) {
        if (p.destacado && !p.proximo) destacados.push({ perfume: p, casa: casa });
      });
    }

    destacados.sort(function (a, b) {
      return (a.perfume.ranking || 999) - (b.perfume.ranking || 999);
    });

    if (!destacados.length) {
      var section = container.closest('.bestsellers-section');
      if (section) section.style.display = 'none';
      return;
    }

    container.textContent = '';
    destacados.forEach(function (item, i) {
      container.appendChild(buildBestsellerCard(item, i));
    });

    initBestsellersAutoScroll(container);
  }

  function initBestsellersAutoScroll(trackEl) {
    var wrapper = trackEl.closest('.bestsellers-wrapper');
    if (!wrapper) return;

    var SCROLL_SPEED = 0.5; // px por frame (~30px/s a 60fps)
    var rafId = null;
    var rewinding = false;
    var resumeTimer = null;

    function step() {
      var max = wrapper.scrollWidth - wrapper.clientWidth;
      if (wrapper.scrollLeft >= max - 1) {
        rewind();
        return;
      }
      wrapper.scrollLeft += SCROLL_SPEED;
      rafId = requestAnimationFrame(step);
    }

    function rewind() {
      rewinding = true;
      cancelAnimationFrame(rafId);
      rafId = null;

      var startPos = wrapper.scrollLeft;
      var startTime = 0;
      var duration = 1200;

      function frame(t) {
        if (!startTime) startTime = t;
        var progress = Math.min((t - startTime) / duration, 1);
        var ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        wrapper.scrollLeft = startPos * (1 - ease);
        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          wrapper.scrollLeft = 0;
          rewinding = false;
          resumeTimer = setTimeout(start, 800);
        }
      }
      requestAnimationFrame(frame);
    }

    function start() {
      if (rafId || rewinding) return;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      cancelAnimationFrame(rafId);
      rafId = null;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(start, 4000);
    }

    wrapper.addEventListener('pointerdown', stop);
    wrapper.addEventListener('wheel', stop, { passive: true });

    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        setTimeout(start, 2000);
      }
    }, { threshold: 0.3 });
    obs.observe(wrapper);
  }

  /* ── Hero particles ──────────────────────────────────────────── */

  function initHeroParticles() {
    var hero = SG.$('.hero');
    if (!hero) return;

    var count = 20;
    for (var i = 0; i < count; i++) {
      var size = 2 + Math.random() * 3;
      var duration = 6 + Math.random() * 8;
      var delay = Math.random() * duration;
      var drift = (Math.random() - 0.5) * 80;
      var maxOpacity = 0.2 + Math.random() * 0.35;

      var particle = el('div', { class: 'hero-particle' });
      particle.style.width = particle.style.height = size + 'px';
      particle.style.left = (Math.random() * 100) + '%';
      particle.style.bottom = -(Math.random() * 20) + '%';
      particle.style.setProperty('--duration', duration + 's');
      particle.style.setProperty('--delay', '-' + delay + 's');
      particle.style.setProperty('--drift', drift + 'px');
      particle.style.setProperty('--max-opacity', maxOpacity);
      hero.appendChild(particle);
    }
  }

  /* ── Hero parallax ───────────────────────────────────────────── */

  function initHeroParallax() {
    var hero = SG.$('.hero');
    if (!hero) return;
    var onScroll = rafThrottle(function () {
      var scrollY = window.scrollY;
      var heroH = hero.offsetHeight;
      if (scrollY <= heroH) {
        hero.style.backgroundPositionY = 'calc(50% + ' + (scrollY * 0.3) + 'px)';
      }
    });
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Card tilt + glare (observer único) ───────────────────────── */

  function _resetCardTilt(card) {
    card.classList.remove('tilt-active');
    card.style.transition = 'transform .4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow .4s ease, border-color .4s ease';
    card.style.transform = '';
    setTimeout(function () { card.style.transition = ''; }, 400);
  }

  function initCardTilt() {
    var container = byId('catalogo');
    if (!container) return;

    var onMove = rafThrottle(function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top)  / rect.height;

      card.classList.add('tilt-active');
      card.style.transform =
        'perspective(600px) rotateX(' + ((0.5 - y) * 16) + 'deg) rotateY(' + ((x - 0.5) * 16) + 'deg) scale(1.02)';

      var glare = card.querySelector('.tilt-glare');
      if (glare) {
        glare.style.background =
          'radial-gradient(circle at ' + (x * 100) + '% ' + (y * 100) + '%, rgba(255,255,255,0.15), transparent 60%)';
      }
    });

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', function (e) {
      var card = e.target.closest('.card');
      if (card) _resetCardTilt(card);
    }, true);
    container.addEventListener('mouseout', function (e) {
      var card = e.target.closest('.card');
      var related = e.relatedTarget;
      if (card && (!related || !card.contains(related))) _resetCardTilt(card);
    });
  }

  /* ── Observer unificado para catálogo (glare + scroll reveal) ── */

  function _injectGlareOverlays(root) {
    SG.$$('.card:not(.glare-injected)', root).forEach(function (card) {
      card.appendChild(el('div', { class: 'tilt-glare' }));
      card.classList.add('glare-injected');
    });
  }

  function initCatalogObserver() {
    var catalogo = byId('catalogo');
    if (!catalogo) return;

    _injectGlareOverlays(catalogo);

    var pending = [];
    function collectPending() {
      pending = [];
      SG.$$('.house-title:not(.revealed)', catalogo).forEach(function (t) { pending.push(t); });
      SG.$$('.card:not(.revealed)',        catalogo).forEach(function (c) { pending.push(c); });
    }

    var observer = new IntersectionObserver(function (entries) {
      var visible = [];
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { visible.push(entry.target); observer.unobserve(entry.target); }
      });
      visible.forEach(function (el, i) {
        el.style.setProperty('--delay', (i * 0.07) + 's');
        el.classList.add('revealed');
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    function observeAll() {
      collectPending();
      pending.forEach(function (el) { observer.observe(el); });
    }
    observeAll();

    var mo = new MutationObserver(function () {
      _injectGlareOverlays(catalogo);
      observeAll();
    });
    mo.observe(catalogo, { childList: true, subtree: true });
  }

  /* ── Magnetic buttons (con scope, rAF y delegación) ──────────── */

  function initMagneticButtons() {
    if (SG.ua.isTouch) return;

    var SELECTORS = '.btn, .full-btn, .small-btn, .filter-pill, .cart-btn, .scroll-top-btn, .cerrarX, .qty-btn';
    var MAX_DISTANCE = 80; // px — rango útil en el que un botón puede atraer el cursor
    var tracked = new Set();

    function resetAll() {
      tracked.forEach(function (btn) {
        if (btn.style.transform) {
          btn.style.transform = '';
          btn.style.transition = 'transform .4s cubic-bezier(.25,.46,.45,.94)';
        }
      });
      tracked.clear();
    }

    var onMove = rafThrottle(function (e) {
      var ex = e.clientX, ey = e.clientY;
      // Limitar a los botones dentro del viewport visible + cerca del cursor
      var vw = window.innerWidth, vh = window.innerHeight;
      if (ex < 0 || ex > vw || ey < 0 || ey > vh) { resetAll(); return; }

      var nodes = document.querySelectorAll(SELECTORS);
      var stillTracked = new Set();

      for (var i = 0; i < nodes.length; i++) {
        var btn = nodes[i];
        var rect = btn.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        // Descarte rápido por rectángulo expandido — evita Math.sqrt en la mayoría
        if (ex < rect.left - MAX_DISTANCE || ex > rect.right  + MAX_DISTANCE ||
            ey < rect.top  - MAX_DISTANCE || ey > rect.bottom + MAX_DISTANCE) {
          if (tracked.has(btn)) {
            btn.style.transform = '';
            btn.style.transition = 'transform .4s cubic-bezier(.25,.46,.45,.94)';
          }
          continue;
        }

        var cx = rect.left + rect.width / 2;
        var cy = rect.top  + rect.height / 2;
        var distX = ex - cx, distY = ey - cy;
        var dist = Math.sqrt(distX * distX + distY * distY);
        var radius = Math.max(rect.width, rect.height) * 0.5;

        if (dist < radius) {
          var pull = 1 - (dist / radius);
          btn.style.transform = 'translate(' + (distX * pull * 0.3) + 'px,' + (distY * pull * 0.3) + 'px)';
          btn.style.transition = 'transform .2s ease';
          stillTracked.add(btn);
        } else if (tracked.has(btn)) {
          btn.style.transform = '';
          btn.style.transition = 'transform .4s cubic-bezier(.25,.46,.45,.94)';
        }
      }
      tracked = stillTracked;
    });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', resetAll);
  }

  /* ── Count-up ────────────────────────────────────────────────── */

  function initCountUp() {
    var counters = SG.$$('.count-up');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var elCounter = entry.target;
        var target = Number(elCounter.dataset.target);
        var duration = 1500;
        var startTime = null;

        function animate(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          elCounter.textContent = Math.floor(eased * target);
          if (progress < 1) requestAnimationFrame(animate);
          else elCounter.textContent = target;
        }
        requestAnimationFrame(animate);
        observer.unobserve(elCounter);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (c) { observer.observe(c); });
  }

  /* ── Announcement bar ────────────────────────────────────────── */

  function initAnnouncementBar() {
    var bar = SG.$('.announcement-bar');
    if (!bar) return;
    var onScroll = rafThrottle(function () {
      bar.classList.toggle('hidden', window.scrollY > 80);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Scroll top ──────────────────────────────────────────────── */

  function initScrollTop() {
    var btn = byId('btnScrollTop');
    if (!btn) return;

    var onScroll = rafThrottle(function () {
      btn.classList.toggle('show', window.scrollY > 600);
    });
    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', function () {
      var currentY = window.scrollY;
      var impulso = Math.min(80, currentY * 0.08);
      window.scrollTo({ top: currentY + impulso, behavior: 'smooth' });

      setTimeout(function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        var onArrival = function () {
          if (window.scrollY === 0) {
            window.removeEventListener('scroll', onArrival);
            var main = SG.$('main') || document.body;
            main.style.transition = 'transform .25s cubic-bezier(.34,1.56,.64,1)';
            main.style.transform = 'translateY(18px)';
            setTimeout(function () {
              main.style.transform = 'translateY(0)';
              setTimeout(function () {
                main.style.transition = '';
                main.style.transform = '';
              }, 250);
            }, 120);
          }
        };
        window.addEventListener('scroll', onArrival);
      }, 200);
    });
  }

  /* ── Easter egg "smell" → lluvia de gotas ────────────────────── */

  function _triggerDropletRain() {
    var count = 25;
    var container = el('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10000;overflow:hidden;';
    document.body.appendChild(container);

    for (var i = 0; i < count; i++) {
      var drop = el('div', { class: 'ee-droplet' });
      drop.style.left = (Math.random() * 100) + '%';
      drop.style.setProperty('--ee-delay', (Math.random() * 1.2) + 's');
      drop.style.setProperty('--fall-duration', (2 + Math.random() * 1.5) + 's');
      drop.style.setProperty('--ee-sway', ((Math.random() - 0.5) * 80) + 'px');
      drop.style.setProperty('--ee-rotate', ((Math.random() - 0.5) * 120) + 'deg');
      container.appendChild(drop);
    }
    setTimeout(function () { container.remove(); }, 4700);
  }

  function initEasterEgg() {
    var sequence = 'smell';
    var buffer = '';
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      buffer += e.key.toLowerCase();
      if (buffer.length > sequence.length) buffer = buffer.slice(-sequence.length);
      if (buffer === sequence) { buffer = ''; _triggerDropletRain(); }
    });
  }

  /* ── Scroll con impulso + rebote elástico (reusable) ──────────── */

  function scrollToWithBounce(target) {
    if (!target) return;
    var currentY = window.scrollY;
    var targetY = target.getBoundingClientRect().top + currentY;
    var goingDown = currentY < targetY;
    var impulso = goingDown ? Math.max(0, currentY - 80) : currentY + 80;
    window.scrollTo({ top: impulso, behavior: 'smooth' });

    setTimeout(function () {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var onScroll = function () {
        var rect = target.getBoundingClientRect();
        if (Math.abs(rect.top) < 5) {
          window.removeEventListener('scroll', onScroll);
          var main = SG.$('main') || document.body;
          main.style.transition = 'transform .25s cubic-bezier(.34,1.56,.64,1)';
          main.style.transform = 'translateY(18px)';
          setTimeout(function () {
            main.style.transform = 'translateY(0)';
            setTimeout(function () {
              main.style.transition = '';
              main.style.transform = '';
            }, 250);
          }, 120);
        }
      };
      window.addEventListener('scroll', onScroll);
    }, 200);
  }

  /* ── Exposición pública ──────────────────────────────────────── */

  window.renderCompletos   = renderCompletos;
  window.renderCombos      = renderCombos;
  window.renderDestacados  = renderDestacados;

  SG.ui = {
    initHeroParticles: initHeroParticles,
    initHeroParallax:  initHeroParallax,
    initCardTilt:      initCardTilt,
    initCatalogObserver: initCatalogObserver,
    initMagneticButtons: initMagneticButtons,
    initCountUp:       initCountUp,
    initAnnouncementBar: initAnnouncementBar,
    initScrollTop:     initScrollTop,
    initEasterEgg:     initEasterEgg,
    scrollToWithBounce: scrollToWithBounce
  };
})(window.SG);
