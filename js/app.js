document.addEventListener('DOMContentLoaded', function() {
  _loadCart();
  renderCatalogo();
  renderCarrito();

  var buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', function(e) {
      renderCatalogo(e.target.value);
    });
  }

  var waFloat = document.querySelector('.wa-float');
  if (waFloat) {
    waFloat.href = 'https://wa.me/' + CONFIG.WA_NUMBER;
  }
});

window.onload = function() {
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname);
  }
  window.scrollTo(0, 0);
};
