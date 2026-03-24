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
    var mlLabel = p.isCompleto ? 'Frasco completo' : p.ml + ' ml';
    texto += '\u2022 ' + p.nombre + ' - ' + mlLabel + ' ($' + p.precio + ')\n';
    total += p.precio;
    if (!p.isCompleto) {
      totalDecants += p.precio;
      hasDecants = true;
    } else {
      hasCompletos = true;
    }
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
    texto += '\nSubtotal: $' + total;
    texto += '\nDescuento ' + tierPercent + '% en decants: -$' + descuento;
    texto += '\nTotal de mi pedido: $' + (total - descuento);
  } else {
    texto += '\nTotal de mi pedido: $' + total;
  }

  var url = 'https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(texto);
  window.open(url, '_blank');
}
