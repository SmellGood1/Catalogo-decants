function enviarPedido() {
  var nombreInput = document.getElementById('nombreCliente');
  var nombre = nombreInput.value.trim();

  if (!nombre) {
    mostrarToast('Escribe tu nombre', true);
    return;
  }

  if (!carrito.length) {
    mostrarToast('Tu carrito está vacío', true);
    return;
  }

  var total = 0;
  var totalDecants = 0;
  var hasDecants = false;
  var hasCompletos = false;

  var texto = 'Hola ' + CONFIG.WA_CONTACT + ', soy ' + nombre + ' y me gustaría hacer mi pedido.\n\n';

  carrito.forEach(function(p) {
    if (p.isCombo) {
      texto += '\u2022 ' + p.nombre + ' - ' + p.ml + ' ml c/u ($' + p.precio + ')\n';
      if (p.comboItems) {
        texto += '   (' + p.comboItems.join(', ') + ')\n';
      }
      totalDecants += p.precio;
    } else if (p.isCompleto) {
      texto += '\u2022 ' + p.nombre + ' - Frasco completo ($' + p.precio + ')\n';
    } else {
      texto += '\u2022 ' + p.nombre + ' - ' + p.ml + ' ml ($' + p.precio + ')\n';
      totalDecants += p.precio;
    }
    total += p.precio;
  });

  // Descuento escalonado solo sobre decants
  var TIERS = [
    { threshold: 500, percent: 10 },
    { threshold: 800, percent: 15 },
    { threshold: 1200, percent: 20 }
  ];

  var descuento = 0;
  var tierPercent = 0;
  for (var t = 0; t < TIERS.length; t++) {
    if (totalDecants >= TIERS[t].threshold) {
      tierPercent = TIERS[t].percent;
    }
  }

  if (tierPercent > 0) {
    descuento = Math.round(totalDecants * tierPercent / 100);
  }

  // Código promo
  var promoDescuento = 0;
  if (_activePromo && totalDecants > 0) {
    promoDescuento = Math.round(totalDecants * _activePromo.percent / 100);
  }

  var descuentoTotal = descuento + promoDescuento;

  if (descuentoTotal > 0) {
    texto += '\nSubtotal: $' + total;
    if (descuento > 0) texto += '\nDescuento ' + tierPercent + '% (volumen): -$' + descuento;
    if (promoDescuento > 0) texto += '\nCódigo promo (' + _activePromo.percent + '%): -$' + promoDescuento;
    texto += '\nTotal de mi pedido: $' + (total - descuentoTotal);
  } else {
    texto += '\nTotal de mi pedido: $' + total;
  }

  // Marcar código como usado al enviar
  if (_activePromo && _activePromo.code) {
    _markCodeUsed(_activePromo.code);
  }

  var url = 'https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(texto);
  window.open(url, '_blank');
}
