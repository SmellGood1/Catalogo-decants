if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.addEventListener('DOMContentLoaded', function() {
  _loadCart();
  renderCarrito();

  // Cargar productos desde Google Sheets
  loadPerfumesFromSheets()
    .then(function() {
      renderCatalogo();
      renderDestacados();

      // Actualizar contador de casas dinámicamente
      var countCasas = document.getElementById('countCasas');
      if (countCasas) {
        countCasas.setAttribute('data-target', Object.keys(PERFUMES).length);
      }
      initCountUp();

      window.scrollTo(0, 0);
    })
    .catch(function(err) {
      console.error('Error cargando productos:', err);
      document.getElementById('catalogo').innerHTML =
        '<p style="text-align:center;color:#999;padding:2rem;">No se pudieron cargar los productos. Recarga la página.</p>';
    });

  // Extras
  initScrollTop();
  initAnnouncementBar();

  // Search filter
  var buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', function(e) {
      renderCatalogo(e.target.value);
      if (e.target.value.length === 1) {
        var catalogo = document.getElementById('catalogoSection');
        if (catalogo) {
          catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
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

  // Spray sound al tocar la imagen del perfume
  var dImg = document.getElementById('dImg');
  var _sprayCount = 0;
  var _sprayTimer = null;
  if (dImg) {
    dImg.style.cursor = 'pointer';
    dImg.addEventListener('click', function() {
      _sprayCount++;
      clearTimeout(_sprayTimer);
      _sprayTimer = setTimeout(function() { _sprayCount = 0; }, 800);

      if (_sprayCount >= 7) {
        _sprayCount = 0;
        _playExplosion();
        dImg.classList.remove('spray-tap');
        dImg.classList.add('spray-explode');
        _crearParticulas(dImg);
        setTimeout(function() { dImg.classList.remove('spray-explode'); }, 800);
        return;
      }

      _playSpray();
      dImg.classList.remove('spray-tap');
      void dImg.offsetWidth;
      dImg.classList.add('spray-tap');
      setTimeout(function() { dImg.classList.remove('spray-tap'); }, 400);
    });
  }

  // Efecto agua en la concentración
  var dConc = document.getElementById('dConc');
  if (dConc) {
    dConc.addEventListener('click', function(e) {
      var rect = dConc.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var size = Math.max(rect.width, rect.height);

      // Wobble gelatinoso
      dConc.classList.remove('water-wobble');
      void dConc.offsetWidth;
      dConc.classList.add('water-wobble');

      // 4 anillos de agua
      for (var i = 0; i < 4; i++) {
        var ring = document.createElement('span');
        ring.className = 'water-ring';
        ring.style.width = ring.style.height = size + 'px';
        ring.style.left = (x - size / 2) + 'px';
        ring.style.top = (y - size / 2) + 'px';
        dConc.appendChild(ring);
      }

      setTimeout(function() {
        var rings = dConc.querySelectorAll('.water-ring');
        rings.forEach(function(r) { r.remove(); });
        dConc.classList.remove('water-wobble');
      }, 1300);
    });
  }

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
