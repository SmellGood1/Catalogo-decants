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
      var line = '\u2022 ' + p.nombre + ' - ' + p.ml + ' ml c/u ($' + p.precio + ')\n';
      if (p.comboItems && p.comboItems.length) {
        line += '   (' + p.comboItems.join(', ') + ')\n';
      }
      return line;
    }
    if (p.isCompleto) {
      return '\u2022 ' + p.nombre + ' - Frasco completo ($' + p.precio + ')\n';
    }
    return '\u2022 ' + p.nombre + ' - ' + p.ml + ' ml ($' + p.precio + ')\n';
  }

  function enviarPedido() {
    var nombreInput = byId('nombreCliente');
    var nombre = nombreInput.value.trim();

    if (!nombre) { mostrarToast('Escribe tu nombre', true); return; }
    if (!window.carrito.length) { mostrarToast('Tu carrito está vacío', true); return; }

    var texto = 'Hola ' + CONFIG.WA_CONTACT + ', soy ' + nombre + ' y me gustaría hacer mi pedido.\n\n';
    window.carrito.forEach(function (p) { texto += _formatLine(p); });

    var b = SG.pricing.calculate(window.carrito, window._activePromo);

    if (b.totalDiscount > 0) {
      texto += '\nSubtotal: $' + b.subtotal;
      if (b.volumeDiscount > 0) {
        texto += '\nDescuento ' + b.tierCurrent.percent + '% (volumen): -$' + b.volumeDiscount;
      }
      if (b.promoDiscount > 0) {
        texto += '\nCódigo promo (' + window._activePromo.percent + '%): -$' + b.promoDiscount;
      }
      texto += '\nTotal de mi pedido: $' + b.total;
    } else {
      texto += '\nTotal de mi pedido: $' + b.total;
    }

    if (window._activePromo && window._activePromo.code) {
      window._markCodeUsed(window._activePromo.code);
    }

    window.open('https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(texto), '_blank');
  }

  window.enviarPedido = enviarPedido;
})(window.SG);
