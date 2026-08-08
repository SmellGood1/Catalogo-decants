/*
 * spotlight.js — Revelación cinematográfica de un producto destacado
 * (hoy: Notre Dame Notte di Natale, Filippo Sorcinelli) al entrar a Decants.
 *
 * Autocontenido y aditivo: no toca modal.js/cart.js. Reutiliza
 * findPerfumeByCode() (sheets.js), verPerfume() (modal.js) y SG.modal
 * (a11y.js) tal cual existen — "Descubrir" abre la ficha real del producto.
 *
 * Se muestra una sola vez por sesión de pestaña (sessionStorage), 1.5s
 * después de que la zona de Decants queda visible.
 */
(function (SG) {
  'use strict';

  var el = SG.el, byId = SG.byId;
  var SESSION_KEY = 'sg_spotlight_44_seen';
  var CODIGO = '44';
  var triggered = false;

  function alreadySeen() {
    try { return !!sessionStorage.getItem(SESSION_KEY); } catch (e) { return false; }
  }

  function markSeen() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
  }

  function build(perfume) {
    var overlay = el('div', {
      id: 'spotlightOverlay', class: 'spotlight-overlay',
      role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'spotlightTitle', 'aria-hidden': 'true'
    }, [
      el('div', { class: 'spotlight-glow spotlight-glow-1' }),
      el('div', { class: 'spotlight-glow spotlight-glow-2' }),
      el('div', { class: 'spotlight-box', id: 'spotlightBox' }, [
        el('button', { id: 'spotlightClose', class: 'spotlight-close', type: 'button', 'aria-label': 'Cerrar', text: '×' }),
        el('div', { class: 'spotlight-imgwrap' }, [
          el('img', { src: perfume.img || 'assets/favicon.svg', alt: perfume.name || '' })
        ]),
        el('div', { class: 'spotlight-content' }, [
          el('span', { class: 'spotlight-kicker', text: 'Pieza exclusiva de la colección' }),
          el('div', { class: 'spotlight-brand', text: perfume.casa || '' }),
          el('h2', { id: 'spotlightTitle', text: perfume.name || '' }),
          el('p', {
            text: 'Alta perfumería de autor: incienso, ámbar y chocolate en una edición ' +
                   'limitada de ' + (perfume.casa || 'Filippo Sorcinelli') + '. Una sola pieza, ' +
                   'fuera de lo convencional.'
          }),
          el('button', { id: 'spotlightCta', class: 'btn btn-primary spotlight-cta', type: 'button', text: 'Descubrir' })
        ])
      ])
    ]);
    document.body.appendChild(overlay);
    return overlay;
  }

  function open(perfume) {
    var overlay = byId('spotlightOverlay') || build(perfume);

    overlay.style.display = 'flex';
    overlay.offsetHeight; // reflow para que la transición corra
    overlay.classList.remove('closing');
    overlay.classList.add('show');

    function close() {
      SG.modal.close(overlay);
    }

    SG.modal.open(overlay, {
      initialFocus: '#spotlightCta',
      onClose: function () {
        overlay.classList.add('closing');
        overlay.classList.remove('show');
        setTimeout(function () {
          overlay.classList.remove('closing');
          overlay.style.display = 'none';
        }, 500);
      }
    });

    var closeBtn = byId('spotlightClose');
    if (closeBtn) closeBtn.onclick = close;
    overlay.onclick = function (e) { if (e.target === overlay) close(); };

    var cta = byId('spotlightCta');
    if (cta) cta.onclick = function () {
      close();
      if (typeof verPerfume === 'function') {
        setTimeout(function () { verPerfume(perfume); }, 480);
      }
    };
  }

  function showForDecants() {
    if (triggered || alreadySeen()) return;

    setTimeout(function () {
      if (triggered || alreadySeen()) return;

      var perfume = (typeof findPerfumeByCode === 'function') ? findPerfumeByCode(CODIGO) : null;
      if (!perfume) return; // datos aún no listos o producto ya no existe: no forzar nada

      triggered = true;
      markSeen();
      open(perfume);
    }, 1500);
  }

  SG.spotlight = { showForDecants: showForDecants };
})(window.SG);
