/*
 * app.js — Orquestación: arranca el render, el gateway, los listeners globales
 * y los efectos visuales. Toda la lógica pesada vive en los módulos dedicados.
 */
(function (SG) {
  'use strict';

  var byId = SG.byId, $ = SG.$;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ── Efecto ráfaga de palabras en el hero ───────────────────── */

  function _initHeroWordShuffle(elementId) {
    var elNode = byId(elementId);
    if (!elNode) return;

    var colors = ['#ff6bcb', '#48dbfb', '#ff4d4d', '#2ecc71', '#f9ca24', '#6c5ce7', '#fd79a8', '#00cec9', '#e17055', '#ffeaa7', '#a29bfe', '#55efc4', '#fdcb6e', '#e84393'];
    var fonts = ['"Courier New", monospace', 'Georgia, serif', 'Impact, sans-serif', '"Comic Sans MS", cursive', '"Arial Black", sans-serif', '"Times New Roman", serif', '"Trebuchet MS", sans-serif', 'Verdana, sans-serif', '"Lucida Console", monospace', 'Garamond, serif', 'Palatino, serif', '"Brush Script MT", cursive', 'Copperplate, serif', 'Futura, sans-serif'];
    var running = false;

    elNode.style.cursor = 'pointer';

    elNode.addEventListener('click', function () {
      if (running) return;
      running = true;

      var rect = elNode.getBoundingClientRect();
      elNode.style.color = 'transparent';
      elNode.style.textShadow = 'none';

      var clone = SG.el('span', { id: 'heroWordClone', text: elNode.textContent });
      clone.style.left = (rect.left + window.scrollX) + 'px';
      clone.style.top = (rect.top + window.scrollY) + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      clone.style.lineHeight = rect.height + 'px';
      clone.style.fontSize = getComputedStyle(elNode).fontSize;
      clone.style.fontWeight = getComputedStyle(elNode).fontWeight;
      clone.style.display = 'flex';
      clone.style.alignItems = 'center';
      clone.style.justifyContent = 'center';
      document.body.appendChild(clone);

      var count = 0, total = 16;
      function step() {
        if (count >= total) {
          elNode.style.color = '';
          elNode.style.textShadow = '';
          clone.remove();
          running = false;
          return;
        }
        var ci = Math.floor(Math.random() * colors.length);
        var fi = Math.floor(Math.random() * fonts.length);
        clone.style.color = colors[ci];
        clone.style.textShadow = '0 0 24px ' + colors[ci];
        clone.style.fontFamily = fonts[fi];
        clone.style.fontStyle = Math.random() > 0.5 ? 'italic' : 'normal';
        count++;
        var delay = count < total * 0.5 ? 50 : 50 + Math.pow(count - total * 0.5, 2) * 8;
        setTimeout(step, delay);
      }
      step();
    });
  }

  /* ── Videos de fondo en combos (lazy, solo fuera de webviews in-app) */

  var _comboObservers = new WeakMap();

  function _mountVideo(card) {
    if (card.querySelector('.combo-video')) return;
    var vid = document.createElement('video');
    vid.className = 'combo-video';
    vid.autoplay = true;
    vid.muted = true;
    vid.defaultMuted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.controls = false;
    vid.preload = 'metadata';
    vid.setAttribute('playsinline', '');
    vid.setAttribute('muted', '');
    vid.src = card.dataset.video;
    card.insertBefore(vid, card.firstChild);
  }

  function _activateComboVideos(root) {
    if (SG.ua.isInApp) return;
    var cards = SG.$$('.combo-card[data-video]', root);
    if (!cards.length) return;

    var obs = _comboObservers.get(root);
    if (!obs) {
      obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          _mountVideo(entry.target);
          obs.unobserve(entry.target);
        });
      }, { rootMargin: '200px 0px' });
      _comboObservers.set(root, obs);
    }

    // Reobservar solo cards aún no montadas (idempotente)
    cards.forEach(function (card) {
      if (card.querySelector('.combo-video')) return;
      obs.observe(card);
    });
  }

  function _removeComboVideos(root) {
    var obs = _comboObservers.get(root);
    if (obs) { obs.disconnect(); _comboObservers.delete(root); }
    SG.$$('.combo-video', root).forEach(function (v) {
      v.pause();
      v.removeAttribute('src');
      v.load();
      v.remove();
    });
  }

  /* ── Boot ────────────────────────────────────────────────────── */

  // Fachada defensiva: si extras.js no cargó, los efectos son no-ops.
  var ui = SG.ui || {};
  function runEffect(name) {
    var fn = ui[name];
    if (typeof fn === 'function') fn();
  }

  SG.onReady(function () {
    _loadCart();
    renderCarrito();

    // Carga de catálogos — cada hoja falla independiente: una rota no tumba las otras.
    function showError(target, err) {
      if (!target) return;
      target.textContent = '';
      var detail = (err && err.message) ? err.message : 'Verifica tu conexión a internet e intenta de nuevo.';
      var box = SG.el('div', { style: { textAlign: 'center', padding: '3rem 1rem' } }, [
        SG.el('div', { style: { fontSize: '48px', marginBottom: '16px' }, text: '⚠️' }),
        SG.el('h3', { style: { color: 'var(--text)', marginBottom: '8px' }, text: 'No se pudo cargar el catálogo' }),
        SG.el('p', { style: { color: 'var(--muted)', marginBottom: '20px', maxWidth: '520px', margin: '0 auto 20px' }, text: detail }),
        SG.el('button', {
          class: 'btn btn-primary', type: 'button',
          style: { display: 'inline-block' },
          text: 'Reintentar',
          onclick: function () { location.reload(); }
        })
      ]);
      target.appendChild(box);
    }

    var pDecants = loadPerfumesFromSheets().then(function () {
      renderCatalogo();
      if (typeof renderDestacados === 'function') renderDestacados();

      var countCasas = byId('countCasas');
      var countFragancias = byId('countFragancias');
      if (countCasas) countCasas.setAttribute('data-target', Object.keys(PERFUMES).length);
      if (countFragancias) {
        var total = 0;
        var has = Object.prototype.hasOwnProperty;
        for (var casa in PERFUMES) {
          if (has.call(PERFUMES, casa)) total += PERFUMES[casa].length;
        }
        countFragancias.setAttribute('data-target', total);
      }
    }).catch(function (err) {
      showError(byId('catalogo'), err);
      if (window.console && console.error) console.error('[decants]', err);
    });

    var pCompletos = loadCompletosFromSheets().then(function () {
      if (typeof renderCompletos === 'function') renderCompletos();
    }).catch(function (err) {
      showError(byId('catalogoCompletos'), err);
      if (window.console && console.error) console.error('[completos]', err);
    });

    // Combos dependen de PERFUMES para resolver los códigos, por eso se encadenan tras decants.
    var pCombos = Promise.all([pDecants, loadCombosFromSheets()]).then(function () {
      if (typeof renderCombos === 'function') renderCombos();
    }).catch(function (err) {
      if (window.console && console.error) console.error('[combos]', err);
    });

    Promise.all([pDecants, pCompletos, pCombos]).then(function () {
      runEffect('initCountUp');
      runEffect('initCatalogObserver');
      // Si el usuario ya entró al sitio antes de que resolvieran sheets,
      // reobservar combos ahora que las cards existen.
      if (siteDecants && !siteDecants.classList.contains('site-hidden')) {
        _activateComboVideos(siteDecants);
      }
      window.scrollTo(0, 0);
    });

    // Efectos hero
    _initHeroWordShuffle('heroWord');
    _initHeroWordShuffle('heroWordCompletos');

    runEffect('initScrollTop');
    runEffect('initAnnouncementBar');
    runEffect('initHeroParticles');
    runEffect('initHeroParallax');
    runEffect('initCardTilt');
    runEffect('initMagneticButtons');
    runEffect('initEasterEgg');

    /* Explorar catálogo con impulso */
    var btnExplorar = $('a[href="#catalogoSection"]');
    if (btnExplorar) {
      btnExplorar.addEventListener('click', function (e) {
        e.preventDefault();
        if (ui.scrollToWithBounce) ui.scrollToWithBounce(byId('catalogoSection'));
      });
    }

    /* Gateway */
    var gateway = byId('gateway');
    var siteDecants = byId('siteDecants');
    var siteCompletos = byId('siteCompletos');
    var doorDecants = byId('doorDecants');
    var doorCompletos = byId('doorCompletos');
    var overlay = byId('gatewayOverlay');

    function spawnDust(rect, isGold) {
      var count = 50;
      var baseColor = isGold ? [212, 175, 55] : [168, 130, 255];
      for (var i = 0; i < count; i++) {
        var size = 2 + Math.random() * 4;
        var p = SG.el('div', { class: 'dust-particle' });
        p.style.left = (rect.left + Math.random() * rect.width) + 'px';
        p.style.top  = (rect.top  + Math.random() * rect.height) + 'px';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        var alpha = 0.3 + Math.random() * 0.5;
        p.style.background = 'rgba(' + baseColor[0] + ',' + baseColor[1] + ',' + baseColor[2] + ',' + alpha + ')';
        p.style.boxShadow = '0 0 ' + (size * 2) + 'px rgba(' + baseColor[0] + ',' + baseColor[1] + ',' + baseColor[2] + ',.2)';
        p.style.setProperty('--dust-x', ((Math.random() - 0.5) * 120) + 'px');
        p.style.setProperty('--dust-y', (-20 - Math.random() * 80) + 'px');
        p.style.setProperty('--dust-dur', (1.5 + Math.random() * 1) + 's');
        p.style.setProperty('--dust-delay', (Math.random() * 0.8) + 's');
        document.body.appendChild(p);
      }
      setTimeout(function () {
        SG.$$('.dust-particle').forEach(function (el) { el.remove(); });
      }, 3500);
    }

    // Mantener aria-hidden sincronizado con el estado visual — un solo helper.
    // Además actualiza el destino del skip-link para que siempre apunte al main visible.
    var skipLink = byId('skipLink');
    function setSiteVisible(zone, visible) {
      zone.classList.toggle('site-hidden', !visible);
      zone.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible && skipLink) {
        var mainEl = zone.querySelector('main[id]');
        if (mainEl) skipLink.setAttribute('href', '#' + mainEl.id);
        skipLink.hidden = false;
      }
    }

    // En el estado "gateway" no hay main útil; ocultar skip-link hasta que el usuario elija.
    if (gateway && gateway.style.display !== 'none' && skipLink) {
      skipLink.hidden = true;
    }

    function enterSite(siteToShow, clickedDoor) {
      var isGold = !clickedDoor.classList.contains('door-completos');
      gateway.classList.add('launching');
      clickedDoor.classList.add('door-selected');

      setTimeout(function () { spawnDust(clickedDoor.getBoundingClientRect(), isGold); }, 500);
      setTimeout(function () { clickedDoor.classList.add('door-dissolving'); }, 700);
      setTimeout(function () { overlay.classList.add('active'); }, 1200);
      setTimeout(function () {
        gateway.style.display = 'none';
        setSiteVisible(siteToShow, true);
        window.scrollTo(0, 0);
        _activateComboVideos(siteToShow);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { overlay.classList.remove('active'); });
        });
      }, 2000);
      setTimeout(function () {
        gateway.classList.remove('launching');
        clickedDoor.classList.remove('door-selected', 'door-dissolving');
      }, 2800);
    }

    function backToGateway() {
      var from = siteDecants.classList.contains('site-hidden') ? siteCompletos : siteDecants;
      overlay.classList.add('switch-active');
      _removeComboVideos(from);
      setTimeout(function () {
        setSiteVisible(from, false);
        gateway.style.display = '';
        gateway.classList.remove('gateway-exit');
        if (skipLink) skipLink.hidden = true;
        requestAnimationFrame(function () { overlay.classList.remove('switch-active'); });
      }, 380);
    }

    function switchSite(from, to) {
      _removeComboVideos(from);
      overlay.classList.add('switch-active');
      setTimeout(function () { setSiteVisible(from, false); }, 380);
      setTimeout(function () {
        setSiteVisible(to, true);
        _activateComboVideos(to);
        overlay.classList.remove('switch-active');
      }, 420);
    }

    if (doorDecants)   doorDecants.addEventListener('click', function () { enterSite(siteDecants, doorDecants); });
    if (doorCompletos) doorCompletos.addEventListener('click', function () { enterSite(siteCompletos, doorCompletos); });

    var btnBackToGateway = byId('btnBackToGateway');
    var btnBackToGatewayDecants = byId('btnBackToGatewayDecants');
    if (btnBackToGateway) btnBackToGateway.addEventListener('click', backToGateway);
    if (btnBackToGatewayDecants) btnBackToGatewayDecants.addEventListener('click', backToGateway);

    var btnGoToCompletos = byId('btnGoToCompletos');
    var btnGoToDecants2  = byId('btnGoToDecants2');
    var btnGoToDecants3  = byId('btnGoToDecants3');
    var btnCartCompletos = byId('btnCartCompletos');

    if (btnGoToCompletos) btnGoToCompletos.addEventListener('click', function () { switchSite(siteDecants, siteCompletos); });
    if (btnGoToDecants2)  btnGoToDecants2.addEventListener('click',  function () { switchSite(siteCompletos, siteDecants); });
    if (btnGoToDecants3)  btnGoToDecants3.addEventListener('click',  function () { switchSite(siteCompletos, siteDecants); });
    if (btnCartCompletos) btnCartCompletos.addEventListener('click', toggleCarrito);

    var btnVerCatCompletos = $('a[href="#completosCatalogo"]');
    if (btnVerCatCompletos) {
      btnVerCatCompletos.addEventListener('click', function (e) {
        e.preventDefault();
        byId('completosCatalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    SG.$$('.logo-text').forEach(function (logo) {
      logo.addEventListener('click', function (e) { e.preventDefault(); backToGateway(); });
    });

    /* Buscador con debounce */
    var buscador = byId('buscador');
    if (buscador) {
      var applySearch = SG.debounce(function (value) { renderCatalogo(value); }, 200);
      buscador.addEventListener('input', function (e) {
        applySearch(e.target.value);
        if (e.target.value.length === 1) {
          if (ui.scrollToWithBounce) ui.scrollToWithBounce(byId('catalogoSection'));
        }
      });
    }

    /* Botón flotante de WhatsApp */
    SG.$$('.wa-float').forEach(function (el) {
      el.href = 'https://wa.me/' + CONFIG.WA_NUMBER + '?text=' +
        encodeURIComponent('Hola ' + CONFIG.WA_CONTACT + ', vi tu catálogo y me gustaría más información 👋');
    });

    /* UI — Nav y hero */
    var btnToggleCartNav = byId('btnToggleCartNav');
    var btnToggleCartHero = byId('btnToggleCartHero');
    var cartOverlay = byId('cartOverlay');
    var btnCerrarCarrito = byId('btnCerrarCarrito');

    if (btnToggleCartNav)  btnToggleCartNav.addEventListener('click', toggleCarrito);
    if (btnToggleCartHero) btnToggleCartHero.addEventListener('click', toggleCarrito);
    if (cartOverlay)       cartOverlay.addEventListener('click', toggleCarrito);
    if (btnCerrarCarrito)  btnCerrarCarrito.addEventListener('click', toggleCarrito);

    /* Botones del carrito */
    var btnVaciarCarrito = byId('btnVaciarCarrito');
    var btnEnviarPedido  = byId('btnEnviarPedido');
    if (btnVaciarCarrito) btnVaciarCarrito.addEventListener('click', vaciarCarrito);
    if (btnEnviarPedido)  btnEnviarPedido.addEventListener('click', enviarPedido);

    var btnApplyPromo = byId('btnApplyPromo');
    if (btnApplyPromo) btnApplyPromo.addEventListener('click', applyPromoCode);
    var promoInput = byId('promoInput');
    if (promoInput) promoInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyPromoCode();
    });

    /* Modal detalle */
    var detalleWrapper = byId('detalle');
    var detalleBox     = byId('detalleBox');
    var btnCerrarX     = byId('btnCerrarX');
    var mlSelect       = byId('ml');
    var btnAddCart     = byId('btnAddCart');
    var btnCerrarDetalle = byId('btnCerrarDetalle');

    if (detalleWrapper) detalleWrapper.addEventListener('click', function (e) {
      if (e.target === detalleWrapper) cerrarDetalle();
    });
    if (detalleBox) detalleBox.addEventListener('click', function (e) { e.stopPropagation(); });

    /* Spray sonoro + animación en la imagen */
    var dImg = byId('dImg');
    if (dImg) {
      dImg.style.cursor = 'pointer';
      var _sprayCount = 0, _sprayTimer = null;
      dImg.addEventListener('click', function () {
        _sprayCount++;
        clearTimeout(_sprayTimer);
        _sprayTimer = setTimeout(function () { _sprayCount = 0; }, 800);

        if (_sprayCount >= 7) {
          _sprayCount = 0;
          SG.fx.playExplosion();
          dImg.classList.remove('spray-tap');
          dImg.classList.add('spray-explode');
          SG.fx.breakGlass(dImg);
          setTimeout(function () { dImg.classList.remove('spray-explode'); }, 800);
          return;
        }
        SG.fx.playSpray();
        dImg.classList.remove('spray-tap');
        void dImg.offsetWidth;
        dImg.classList.add('spray-tap');
        setTimeout(function () { dImg.classList.remove('spray-tap'); }, 400);
      });
    }

    /* Anillos de agua al click en la concentración */
    var dConc = byId('dConc');
    if (dConc) {
      dConc.addEventListener('click', function (e) {
        var rect = dConc.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var size = Math.max(rect.width, rect.height);

        dConc.classList.remove('water-wobble');
        void dConc.offsetWidth;
        dConc.classList.add('water-wobble');

        for (var i = 0; i < 4; i++) {
          var ring = SG.el('span', { class: 'water-ring' });
          ring.style.width = ring.style.height = size + 'px';
          ring.style.left = (x - size / 2) + 'px';
          ring.style.top  = (y - size / 2) + 'px';
          dConc.appendChild(ring);
        }

        setTimeout(function () {
          SG.$$('.water-ring', dConc).forEach(function (r) { r.remove(); });
          dConc.classList.remove('water-wobble');
        }, 1300);
      });
    }

    if (btnCerrarX)       btnCerrarX.addEventListener('click',       function () { cerrarDetalle(); });
    if (mlSelect)         mlSelect.addEventListener('change',       actualizarPrecioModal);
    if (btnAddCart)       btnAddCart.addEventListener('click',       addCarrito);
    if (btnCerrarDetalle) btnCerrarDetalle.addEventListener('click', function () { cerrarDetalle(); });

    /* Delegación del carrito */
    var listaCarrito = byId('listaCarrito');
    if (listaCarrito) {
      listaCarrito.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        if (btn.classList.contains('qty-btn')) {
          var action = btn.dataset.action;
          if (action === 'increment') {
            incrementar(btn.dataset.nombre, Number(btn.dataset.ml));
          } else if (action === 'decrement') {
            decrementar(btn.dataset.ids.split(',').map(Number));
          }
        } else if (btn.classList.contains('cart-remove')) {
          eliminar(btn.dataset.ids.split(',').map(Number));
        }
      });
    }

    /* Header opaco al hacer scroll */
    var allHeaders = SG.$$('header');
    var onScrollHeader = SG.rafThrottle(function () {
      var scrolled = window.scrollY > 50;
      allHeaders.forEach(function (h) { h.classList.toggle('scrolled', scrolled); });
    });
    window.addEventListener('scroll', onScrollHeader, { passive: true });

    /* Scroll reveal (elementos .reveal que no son del catálogo) */
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    SG.$$('.reveal').forEach(function (el) { revealObs.observe(el); });
  });

  /* Reset de hash al cargar sin tocar el listener window.onload */
  window.addEventListener('load', function () {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo(0, 0);
  });
})(window.SG);
