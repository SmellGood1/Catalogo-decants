/*
 * core.js — Infraestructura compartida.
 *
 * Expone un único namespace global `SG` que concentra:
 *   - SG.$  / SG.$$         : selectores
 *   - SG.el / SG.text       : construcción de DOM sin innerHTML (anti-XSS)
 *   - SG.fragment           : construcción declarativa de subárboles
 *   - SG.audio.play(name)   : AudioContext único y reutilizable
 *   - SG.ua                 : flags de entorno (touch, inApp, reduceMotion)
 *   - SG.sha256Hex(str)     : hash async para validar promos sin exponerlos
 *   - SG.once(el, evt, fn)  : listener auto-removible
 *   - SG.onReady(fn)        : alternativa sin sobreescribir window.onload
 */
(function (global) {
  'use strict';

  var SG = global.SG || {};

  /* ── Selectores ────────────────────────────────────────────── */

  SG.$  = function (sel, root) { return (root || document).querySelector(sel); };
  SG.$$ = function (sel, root) { return (root || document).querySelectorAll(sel); };
  SG.byId = function (id) { return document.getElementById(id); };

  /* ── Construcción segura de DOM ─────────────────────────────── */

  function setAttrs(node, attrs) {
    if (!attrs) return;
    for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      var v = attrs[k];
      if (v === null || v === false || v === undefined) continue;
      if (k === 'class')        { node.className = v; }
      else if (k === 'dataset') { for (var d in v) { if (Object.prototype.hasOwnProperty.call(v, d)) node.dataset[d] = v[d]; } }
      else if (k === 'style' && typeof v === 'object') { for (var s in v) { if (Object.prototype.hasOwnProperty.call(v, s)) node.style[s] = v[s]; } }
      else if (k === 'text')    { node.textContent = v; }
      else if (k === 'html')    { /* bloqueado a propósito — usar text/fragment */ }
      else if (k.indexOf('on') === 0 && typeof v === 'function') { node.addEventListener(k.slice(2), v); }
      else { node.setAttribute(k, v); }
    }
  }

  function appendChildren(node, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c == null || c === false) continue;
      if (typeof c === 'string' || typeof c === 'number') {
        node.appendChild(document.createTextNode(String(c)));
      } else {
        node.appendChild(c);
      }
    }
  }

  /**
   * Crea un elemento con atributos y children de forma declarativa y segura.
   * Ejemplo: SG.el('div', { class: 'card' }, [ SG.el('h4', { text: p.name }) ])
   */
  SG.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    setAttrs(node, attrs);
    appendChildren(node, children);
    return node;
  };

  SG.text = function (s) {
    return document.createTextNode(s == null ? '' : String(s));
  };

  /* ── Flags de entorno ──────────────────────────────────────── */

  SG.ua = (function () {
    var nav = global.navigator || {};
    var u = nav.userAgent || '';
    var inApp = /Instagram|FBAN|FBAV|FB_IAB|Twitter|TikTok|BytedanceWebview|Snapchat|LinkedInApp|Pinterest|Line\/|WhatsApp|Telegram|Weibo|MicroMessenger|musical_ly/i.test(u);
    if (!inApp && /iPhone|iPad|iPod/i.test(u) && !/Safari/i.test(u)) inApp = true;
    return {
      isTouch: ('ontouchstart' in global),
      isInApp: inApp,
      reduceMotion: (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) || false
    };
  })();

  /* ── AudioContext reutilizable ─────────────────────────────── */

  SG.audio = (function () {
    var ctx = null;
    function getCtx() {
      if (ctx) return ctx;
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; }
      return ctx;
    }
    function resume() {
      var c = getCtx();
      if (c && c.state === 'suspended' && typeof c.resume === 'function') { c.resume(); }
      return c;
    }
    // Resumir en la primera interacción (requisito de autoplay policy)
    var resumeOnce = function () {
      resume();
      document.removeEventListener('pointerdown', resumeOnce, true);
      document.removeEventListener('keydown', resumeOnce, true);
    };
    document.addEventListener('pointerdown', resumeOnce, true);
    document.addEventListener('keydown', resumeOnce, true);

    return { ctx: getCtx, resume: resume };
  })();

  /* ── Hash SHA-256 (para validar promos sin exponer texto) ──── */

  SG.sha256Hex = function (str) {
    var crypto = global.crypto || global.msCrypto;
    if (!crypto || !crypto.subtle) {
      return Promise.reject(new Error('SubtleCrypto no disponible'));
    }
    var data = new TextEncoder().encode(String(str));
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      var view = new Uint8Array(buf);
      var out = '';
      for (var i = 0; i < view.length; i++) {
        var h = view[i].toString(16);
        out += h.length === 1 ? ('0' + h) : h;
      }
      return out;
    });
  };

  /* ── Helpers de eventos ────────────────────────────────────── */

  SG.once = function (target, event, handler, options) {
    var opts = typeof options === 'object' ? options : {};
    opts.once = true;
    target.addEventListener(event, handler, opts);
  };

  SG.onReady = function (fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  /* ── Debounce y rAF throttle ───────────────────────────────── */

  SG.debounce = function (fn, ms) {
    var t = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  };

  SG.rafThrottle = function (fn) {
    var ticking = false, lastArgs = null, lastCtx = null;
    return function () {
      lastArgs = arguments; lastCtx = this;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        fn.apply(lastCtx, lastArgs);
      });
    };
  };

  global.SG = SG;
})(window);
