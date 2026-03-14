document.addEventListener('DOMContentLoaded', function() {
  _loadCart();
  renderCarrito();

  // Cargar productos desde Google Sheets
  loadPerfumesFromSheets()
    .then(function() {
      renderCatalogo();
      renderDestacados();
    })
    .catch(function(err) {
      console.error('Error cargando productos:', err);
      document.getElementById('catalogo').innerHTML =
        '<p style="text-align:center;color:#999;padding:2rem;">No se pudieron cargar los productos. Recarga la página.</p>';
    });

  // Extras
  initCountUp();
  initScrollTop();

  // Search filter
  var buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', function(e) {
      renderCatalogo(e.target.value);
    });
  }

  // WA float button
  var waFloat = document.querySelector('.wa-float');
  if (waFloat) {
    waFloat.href = 'https://wa.me/' + CONFIG.WA_NUMBER;
  }

  // UI Event Listeners (Nav, Hero)
  const btnToggleCartNav = document.getElementById('btnToggleCartNav');
  const btnToggleCartHero = document.getElementById('btnToggleCartHero');
  const cartOverlay = document.getElementById('cartOverlay');
  const btnCerrarCarrito = document.getElementById('btnCerrarCarrito');

  // Funciones de navegación del carrito
  if (btnToggleCartNav) btnToggleCartNav.addEventListener('click', toggleCarrito);
  if (btnToggleCartHero) btnToggleCartHero.addEventListener('click', toggleCarrito);
  if (cartOverlay) cartOverlay.addEventListener('click', toggleCarrito);
  if (btnCerrarCarrito) btnCerrarCarrito.addEventListener('click', toggleCarrito);

  // Botones de acción del carrito (en el Panel)
  const btnVaciarCarrito = document.getElementById('btnVaciarCarrito');
  const btnEnviarPedido = document.getElementById('btnEnviarPedido');

  if (btnVaciarCarrito) btnVaciarCarrito.addEventListener('click', vaciarCarrito);
  if (btnEnviarPedido) btnEnviarPedido.addEventListener('click', enviarPedido);

  // UI Event Listeners (Modal Detalle)
  const detalleModalWrapper = document.getElementById('detalle');
  const detalleBox = document.getElementById('detalleBox');
  const btnCerrarX = document.getElementById('btnCerrarX');
  const mlSelect = document.getElementById('ml');
  const btnAddCart = document.getElementById('btnAddCart');
  const btnCerrarDetalle = document.getElementById('btnCerrarDetalle');

  if (detalleModalWrapper) {
    detalleModalWrapper.addEventListener('click', function(e) {
      // Si el clic es fuera del detalleBox, se cierra
      if (e.target === detalleModalWrapper) cerrarDetalle();
    });
  }

  if (detalleBox) detalleBox.addEventListener('click', function(e) {
      e.stopPropagation();
  });

  if (btnCerrarX) btnCerrarX.addEventListener('click', function() { cerrarDetalle(); });
  if (mlSelect) mlSelect.addEventListener('change', actualizarPrecioModal);
  if (btnAddCart) btnAddCart.addEventListener('click', addCarrito);
  if (btnCerrarDetalle) btnCerrarDetalle.addEventListener('click', function() { cerrarDetalle(); });

  // Delegación de eventos para los botones dinámicos en la lista del carrito
  const listaCarrito = document.getElementById('listaCarrito');
  if (listaCarrito) {
    listaCarrito.addEventListener('click', function(e) {
      // Buscar si el clic vino de un botón o sus hijos
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('qty-btn')) {
        const action = btn.dataset.action; 
        if (action === 'increment') {
            incrementar(btn.dataset.nombre, Number(btn.dataset.ml));
        } else if (action === 'decrement') {
            const ids = btn.dataset.ids.split(',').map(Number);
            decrementar(ids);
        }
      } else if (btn.classList.contains('cart-remove')) {
        const ids = btn.dataset.ids.split(',').map(Number);
        eliminar(ids);
      }
    });
  }
});

window.onload = function() {
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname);
  }
  window.scrollTo(0, 0);

  // Scroll Header Opacity Effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Scroll Reveal Observer
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(function(el) {
    observer.observe(el);
  });
};
