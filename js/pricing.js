/*
 * pricing.js — Motor único de precios y descuentos.
 *
 * Todas las reglas de negocio monetarias viven aquí. cart.js lo usa para
 * pintar el panel y whatsapp.js para armar el mensaje: ambos ven los mismos
 * números siempre.
 *
 * Dependencias: window.CONFIG (VOLUME_TIERS, MAX_COMBINED_DISCOUNT, PROMO_CODES)
 */
(function (SG) {
  'use strict';

  function cloneTiersSorted() {
    var tiers = (window.CONFIG && CONFIG.VOLUME_TIERS) || [];
    return tiers.slice().sort(function (a, b) { return a.threshold - b.threshold; });
  }

  function pickVolumeTier(decantsSubtotal, tiers) {
    var current = null, next = tiers[0] || null;
    for (var i = 0; i < tiers.length; i++) {
      if (decantsSubtotal >= tiers[i].threshold) {
        current = tiers[i];
        next = tiers[i + 1] || null;
      }
    }
    return { current: current, next: next };
  }

  function sumCart(cart) {
    var subtotal = 0, decantsSubtotal = 0;
    for (var i = 0; i < cart.length; i++) {
      var it = cart[i];
      subtotal += it.precio;
      if (!it.isCompleto) decantsSubtotal += it.precio;
    }
    return { subtotal: subtotal, decantsSubtotal: decantsSubtotal };
  }

  /**
   * Dado un carrito y una promo activa (puede ser null) calcula un breakdown
   * completo. No muta nada. Todos los descuentos se aplican sobre decants.
   */
  function calculate(cart, activePromo) {
    var sums = sumCart(cart || []);
    var tiers = cloneTiersSorted();
    var tier = pickVolumeTier(sums.decantsSubtotal, tiers);

    var volumeDiscount = tier.current
      ? Math.round(sums.decantsSubtotal * tier.current.percent / 100)
      : 0;

    var promoDiscount = (activePromo && sums.decantsSubtotal > 0)
      ? Math.round(sums.decantsSubtotal * activePromo.percent / 100)
      : 0;

    // Cap combinado: proteger el margen ante stacking de códigos + volumen.
    // Distinguir 0 (sin descuentos permitidos) de no-configurado (sin cap).
    var rawMax = window.CONFIG ? CONFIG.MAX_COMBINED_DISCOUNT : undefined;
    var maxCombined = (rawMax === undefined || rawMax === null || isNaN(Number(rawMax))) ? 100 : Number(rawMax);
    var cap = Math.round(sums.decantsSubtotal * maxCombined / 100);
    var rawTotal = volumeDiscount + promoDiscount;
    var capped = rawTotal > cap;
    var totalDiscount = capped ? cap : rawTotal;

    // Si toca capar, recortamos primero el promo (lo variable), luego volumen
    if (capped) {
      var overflow = rawTotal - cap;
      if (promoDiscount >= overflow) {
        promoDiscount -= overflow;
      } else {
        overflow -= promoDiscount;
        promoDiscount = 0;
        volumeDiscount = Math.max(0, volumeDiscount - overflow);
      }
    }

    return {
      subtotal: sums.subtotal,
      decantsSubtotal: sums.decantsSubtotal,
      tierCurrent: tier.current,
      tierNext: tier.next,
      volumeDiscount: volumeDiscount,
      promoDiscount: promoDiscount,
      totalDiscount: totalDiscount,
      total: Math.max(0, sums.subtotal - totalDiscount),
      capped: capped
    };
  }

  /**
   * Valida un código que escribió el usuario contra los hashes almacenados.
   * Resuelve con `{ percent, expires, code }` si es válido, o null si no.
   * No marca como usado — el llamador decide cuándo persistir.
   */
  function validatePromo(code) {
    var clean = String(code || '').trim().toUpperCase();
    if (!clean) return Promise.resolve(null);
    var map = (window.CONFIG && CONFIG.PROMO_CODES) || {};
    return SG.sha256Hex(clean).then(function (hash) {
      var found = map[hash];
      if (!found) return null;
      return { percent: found.percent, expires: found.expires || null, code: clean };
    });
  }

  SG.pricing = {
    calculate: calculate,
    validatePromo: validatePromo
  };
})(window.SG);
