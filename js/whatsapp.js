/*
 * whatsapp.js — Armado del mensaje y apertura de wa.me.
 * La lógica de precios y descuentos es la misma que ve el usuario en el panel:
 * siempre proviene de SG.pricing.calculate, nunca se recalcula aquí.
 */
(function (SG) {
  'use strict';

  var byId = SG.byId;

  function _formatLine(p) {
    if (p.isCombo) {
      var line = '• ' + p.nombre + '\n';
      line += '   ' + p.ml + ' ml c/u — $' + p.precio + '\n';
      if (p.comboItems && p.comboItems.length) {
        p.comboItems.forEach(function (item) {
          line += '   · ' + item + '\n';
        });
      }
      return line + '\n';
    }
    if (p.isCompleto) {
      return '• ' + p.nombre + '\n   Frasco completo — $' + p.precio + '\n\n';
    }
    return '• ' + p.nombre + '\n   ' + p.ml + ' ml — $' + p.precio + '\n\n';
  }

  function enviarPedido() {
    var nombreInput = byId('nombreCliente');
    var nombre = nombreInput.value.trim();

    if (!nombre) { mostrarToast('Escribe tu nombre', true); return; }
    if (!window.carrito.length) { mostrarToast('Tu carrito está vacío', true); return; }

    var texto = 'Hola ' + CONFIG.WA_CONTACT + ', soy ' + nombre + ' y me gustaría hacer mi pedido.\n\n';
    texto += '━━━━━━━━━━━━\n';
    texto += 'MI PEDIDO\n';
    texto += '━━━━━━━━━━━━\n\n';
    window.carrito.forEach(function (p) { texto += _formatLine(p); });

    var b = SG.pricing.calculate(window.carrito, window._activePromo);

    texto += '━━━━━━━━━━━━\n';
    if (b.totalDiscount > 0) {
      texto += 'Subtotal: $' + b.subtotal + '\n';
      if (b.volumeDiscount > 0) {
        texto += 'Descuento ' + b.tierCurrent.percent + '% (volumen): -$' + b.volumeDiscount + '\n';
      }
      if (b.promoDiscount > 0) {
        texto += 'Código promo (' + window._activePromo.percent + '%): -$' + b.promoDiscount + '\n';
      }
      texto += 'Total: $' + b.total;
    } else {
      texto += 'Total: $' + b.total;
    }

    if (window._activePromo && window._activePromo.code) {
      window._markCodeUsed(window._activePromo.code);
    }

    window.open('https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(texto), '_blank');
  }

  window.enviarPedido = enviarPedido;
})(window.SG);
