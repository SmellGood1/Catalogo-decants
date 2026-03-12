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
  var texto = 'Hola ' + CONFIG.WA_CONTACT + ', soy ' + nombre + ' y me gustaría hacer mi pedido de decants.\n\n';

  carrito.forEach(function(p) {
    texto += '\u2022 ' + p.nombre + ' - ' + p.ml + ' ml ($' + p.precio + ')\n';
    total += p.precio;
  });

  texto += '\nTotal de mi pedido: $' + total;

  var url = 'https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(texto);
  window.open(url, '_blank');
}
