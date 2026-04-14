/*
 * a11y.js — Controlador único de diálogos accesibles.
 *
 * Un solo pipeline maneja: modal de detalle, panel del carrito y confirm de
 * vaciado. Resuelve de forma consistente:
 *   · mover el foco al primer elemento interactivo al abrir
 *   · devolverlo al elemento que disparó la apertura al cerrar
 *   · atrapar Tab / Shift+Tab dentro del diálogo
 *   · cerrar con Escape (solo el diálogo tope)
 *   · bloquear el scroll del body una única vez por pila de diálogos
 */
(function (SG) {
  'use strict';

  var FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  var stack = []; // { el, opener, onClose, labelledBy }
  var keydownBound = false;

  function focusables(el) {
    var list = el.querySelectorAll(FOCUSABLE);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n.offsetParent !== null || n === document.activeElement) out.push(n);
    }
    return out;
  }

  function top() { return stack[stack.length - 1] || null; }

  function onKeydown(e) {
    var entry = top();
    if (!entry) return;

    if (e.key === 'Escape') {
      e.stopPropagation();
      close(entry.el);
      return;
    }

    if (e.key === 'Tab') {
      var nodes = focusables(entry.el);
      if (!nodes.length) { e.preventDefault(); return; }
      var first = nodes[0], last = nodes[nodes.length - 1];
      var active = document.activeElement;
      if (e.shiftKey && (active === first || !entry.el.contains(active))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  function bindOnce() {
    if (keydownBound) return;
    keydownBound = true;
    document.addEventListener('keydown', onKeydown, true);
  }

  function lockScroll() {
    if (stack.length === 0) {
      document.body.dataset._sgPrevOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    }
  }

  function unlockScroll() {
    if (stack.length === 0) {
      document.body.style.overflow = document.body.dataset._sgPrevOverflow || '';
      delete document.body.dataset._sgPrevOverflow;
    }
  }

  /**
   * Abre un diálogo. `opts`:
   *   · opener      → elemento al que devolver foco (default: activeElement)
   *   · onClose     → callback al cerrar
   *   · initialFocus→ selector o nodo al que enfocar primero
   */
  function open(el, opts) {
    if (!el) return;
    opts = opts || {};

    lockScroll();
    var opener = opts.opener || document.activeElement;
    stack.push({ el: el, opener: opener, onClose: opts.onClose || null });
    bindOnce();

    el.setAttribute('aria-hidden', 'false');

    // Foco inicial: respetar opts.initialFocus, si no, el primer foco lógico
    setTimeout(function () {
      var target = null;
      if (typeof opts.initialFocus === 'string') target = el.querySelector(opts.initialFocus);
      else if (opts.initialFocus && opts.initialFocus.focus) target = opts.initialFocus;
      if (!target) {
        var nodes = focusables(el);
        target = nodes[0] || el;
      }
      if (target && target.focus) target.focus({ preventScroll: true });
    }, 30);
  }

  function close(el) {
    var idx = -1;
    for (var i = stack.length - 1; i >= 0; i--) {
      if (stack[i].el === el) { idx = i; break; }
    }
    if (idx === -1) return;
    var entry = stack.splice(idx, 1)[0];

    el.setAttribute('aria-hidden', 'true');
    unlockScroll();

    if (entry.onClose) { try { entry.onClose(); } catch (e) {} }
    if (entry.opener && entry.opener.focus) {
      try { entry.opener.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function isOpen(el) {
    for (var i = 0; i < stack.length; i++) if (stack[i].el === el) return true;
    return false;
  }

  SG.modal = { open: open, close: close, isOpen: isOpen };
})(window.SG);
