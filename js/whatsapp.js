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
      var line = '• ' + p.nombre + ' — ' + p.ml + ' ml — $' + p.precio;
      if (p.comboItems && p.comboItems.length) {
        line += '\n   ' + p.comboItems.join(' · ');
      }
      return line + '\n';
    }
    if (p.isCompleto) {
      return '• ' + p.nombre + ' — frasco — $' + p.precio + '\n';
    }
    return '• ' + p.nombre + ' — ' + p.ml + ' ml — $' + p.precio + '\n';
  }

  function enviarPedido() {
    var nombreInput = byId('nombreCliente');
    var nombre = nombreInput.value.trim();

    if (!nombre) { mostrarToast('Escribe tu nombre', true); return; }
    if (!window.carrito.length) { mostrarToast('Tu carrito está vacío', true); return; }

    var texto = 'Hola ' + CONFIG.WA_CONTACT + ', soy ' + nombre + ' y me gustaría ordenar mi pedido:\n\n';
    window.carrito.forEach(function (p) { texto += _formatLine(p); });

    var b = SG.pricing.calculate(window.carrito, window._activePromo);

    texto += '\nTotal: $' + b.total;

    if (window._activePromo && window._activePromo.code) {
      window._markCodeUsed(window._activePromo.code);
    }

    window.open('https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(texto), '_blank');
  }

  window.enviarPedido = enviarPedido;
})(window.SG);
