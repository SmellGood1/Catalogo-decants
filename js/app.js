if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Efecto ráfaga de palabras en el hero
function _initHeroWordShuffle(elementId) {
  var el = document.getElementById(elementId || 'heroWord');
  if (!el) return;

  var colors = ['#ff6bcb', '#48dbfb', '#ff4d4d', '#2ecc71', '#f9ca24', '#6c5ce7', '#fd79a8', '#00cec9', '#e17055', '#ffeaa7', '#a29bfe', '#55efc4', '#fdcb6e', '#e84393'];
  var fonts = ['"Courier New", monospace', 'Georgia, serif', 'Impact, sans-serif', '"Comic Sans MS", cursive', '"Arial Black", sans-serif', '"Times New Roman", serif', '"Trebuchet MS", sans-serif', 'Verdana, sans-serif', '"Lucida Console", monospace', 'Garamond, serif', 'Palatino, serif', '"Brush Script MT", cursive', 'Copperplate, serif', 'Futura, sans-serif'];
  var running = false;

  el.style.cursor = 'pointer';

  el.addEventListener('click', function() {
    if (running) return;
    running = true;

    // Posición exacta de la palabra original
    var rect = el.getBoundingClientRect();

    // Ocultar original (solo color transparente, no cambia layout)
    el.style.color = 'transparent';
    el.style.textShadow = 'none';

    // Crear clon flotante encima, mismo tamaño exacto que el original
    var clone = document.createElement('span');
    clone.id = 'heroWordClone';
    clone.textContent = el.textContent;
    clone.style.left = (rect.left + window.scrollX) + 'px';
    clone.style.top = (rect.top + window.scrollY) + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.lineHeight = rect.height + 'px';
    clone.style.fontSize = getComputedStyle(el).fontSize;
    clone.style.fontWeight = getComputedStyle(el).fontWeight;
    clone.style.display = 'flex';
    clone.style.alignItems = 'center';
    clone.style.justifyContent = 'center';
    document.body.appendChild(clone);

    var count = 0;
    var total = 16;

    function step() {
      if (count >= total) {
        // Restaurar original
        el.style.color = '';
        el.style.textShadow = '';
        clone.remove();
        running = false;
        return;
      }

      var ci = Math.floor(Math.random() * colors.length);
      var fi = Math.floor(Math.random() * fonts.length);
      clone.style.color = colors[ci];
      clone.style.textShadow = '0 0 24px ' + colors[ci];
      clone.style.fontFamily = fonts[fi];
      clone.style.fontStyle = Math.random() > 0.5 ? 'italic' : 'normal';
      count++;

      var delay = count < total * 0.5 ? 50 : 50 + Math.pow(count - total * 0.5, 2) * 8;
      setTimeout(step, delay);
    }

    step();
  });
}

document.addEventListener('DOMContentLoaded', function() {
  _loadCart();
  renderCarrito();

  // Cargar productos desde Google Sheets
  Promise.all([loadPerfumesFromSheets(), loadCompletosFromSheets(), loadCombosFromSheets()])
    .then(function() {
      renderCatalogo();
      renderDestacados();
      if (typeof renderCompletos === 'function') renderCompletos();
      if (typeof renderCombos === 'function') renderCombos();

      // Actualizar contador de casas dinámicamente
      var countCasas = document.getElementById('countCasas');
      if (countCasas) {
        countCasas.setAttribute('data-target', Object.keys(PERFUMES).length);
      }
      initCountUp();
      initScrollReveal();

      window.scrollTo(0, 0);
    })
    .catch(function(err) {
      console.error('Error cargando productos:', err);
      document.getElementById('catalogo').innerHTML =
        '<p style="text-align:center;color:#999;padding:2rem;">No se pudieron cargar los productos. Recarga la página.</p>';
    });

  // Extras
  _initHeroWordShuffle('heroWord');
  _initHeroWordShuffle('heroWordCompletos');
  initScrollTop();
  initAnnouncementBar();

  // Visual effects
  initHeroParticles();
  initHeroParallax();
  initCardTilt();
  initGlareObserver();
  initMagneticButtons();
  initEasterEgg();

  // Explorar catálogo con impulso (sube un poco y luego baja)
  var btnExplorar = document.querySelector('a[href="#catalogoSection"]');
  if (btnExplorar) {
    btnExplorar.addEventListener('click', function(e) {
      e.preventDefault();
      var currentY = window.scrollY;
      var impulsoArriba = Math.max(0, currentY - 80);
      window.scrollTo({ top: impulsoArriba, behavior: 'smooth' });

      setTimeout(function() {
        var catalogo = document.getElementById('catalogoSection');
        catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });

        var onScroll = function() {
          var rect = catalogo.getBoundingClientRect();
          if (Math.abs(rect.top) < 5) {
            window.removeEventListener('scroll', onScroll);
            var main = document.querySelector('main') || document.body;
            main.style.transition = 'transform .25s cubic-bezier(.34,1.56,.64,1)';
            main.style.transform = 'translateY(18px)';
            setTimeout(function() {
              main.style.transform = 'translateY(0)';
              setTimeout(function() {
                main.style.transition = '';
                main.style.transform = '';
              }, 250);
            }, 120);
          }
        };
        window.addEventListener('scroll', onScroll);
      }, 250);
    });
  }

  // Gateway — show/hide sites
  var gateway = document.getElementById('gateway');
  var siteDecants = document.getElementById('siteDecants');
  var siteCompletos = document.getElementById('siteCompletos');
  var doorDecants = document.getElementById('doorDecants');
  var doorCompletos = document.getElementById('doorCompletos');

  var overlay = document.getElementById('gatewayOverlay');

  function spawnDust(rect, isGold) {
    var count = 50;
    var baseColor = isGold ? [212, 175, 55] : [168, 130, 255];

    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'dust-particle';

      var size = 2 + Math.random() * 4;
      var startX = rect.left + Math.random() * rect.width;
      var startY = rect.top + Math.random() * rect.height;

      var driftX = (Math.random() - 0.5) * 120;
      var driftY = -20 - Math.random() * 80;
      var dur = 1.5 + Math.random() * 1;
      var delay = Math.random() * 0.8;
      var alpha = 0.3 + Math.random() * 0.5;

      p.style.left = startX + 'px';
      p.style.top = startY + 'px';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.background = 'rgba(' + baseColor[0] + ',' + baseColor[1] + ',' + baseColor[2] + ',' + alpha + ')';
      p.style.boxShadow = '0 0 ' + (size * 2) + 'px rgba(' + baseColor[0] + ',' + baseColor[1] + ',' + baseColor[2] + ',.2)';
      p.style.setProperty('--dust-x', driftX + 'px');
      p.style.setProperty('--dust-y', driftY + 'px');
      p.style.setProperty('--dust-dur', dur + 's');
      p.style.setProperty('--dust-delay', delay + 's');

      document.body.appendChild(p);
    }

    setTimeout(function() {
      document.querySelectorAll('.dust-particle').forEach(function(el) { el.remove(); });
    }, 3500);
  }

  function enterSite(siteToShow, clickedDoor) {
    var isGold = !clickedDoor.classList.contains('door-completos');

    // 1. Lift the selected card gently
    gateway.classList.add('launching');
    clickedDoor.classList.add('door-selected');

    // 2. Start dust gradually
    setTimeout(function() {
      var rect = clickedDoor.getBoundingClientRect();
      spawnDust(rect, isGold);
    }, 500);

    // 3. Card starts dissolving
    setTimeout(function() {
      clickedDoor.classList.add('door-dissolving');
    }, 700);

    // 4. Fade to black smoothly
    setTimeout(function() {
      overlay.classList.add('active');
    }, 1200);

    // 5. Swap content behind overlay
    setTimeout(function() {
      gateway.style.display = 'none';
      siteToShow.classList.remove('site-hidden');
      window.scrollTo(0, 0);

      // Iniciar videos de combos al entrar a la sección
      siteToShow.querySelectorAll('.combo-video').forEach(function(v) {
        v.play().catch(function() {});
      });

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          overlay.classList.remove('active');
        });
      });
    }, 2000);

    // 6. Cleanup
    setTimeout(function() {
      gateway.classList.remove('launching');
      clickedDoor.classList.remove('door-selected', 'door-dissolving');
    }, 2800);
  }

  function backToGateway() {
    var from = siteDecants.classList.contains('site-hidden') ? siteCompletos : siteDecants;

    overlay.classList.add('switch-active');

    // Pausar videos al salir de la sección
    from.querySelectorAll('.combo-video').forEach(function(v) {
      v.pause();
    });

    setTimeout(function() {
      from.classList.add('site-hidden');
      gateway.style.display = '';
      gateway.classList.remove('gateway-exit');

      requestAnimationFrame(function() {
        overlay.classList.remove('switch-active');
      });
    }, 380);
  }

  if (doorDecants) doorDecants.addEventListener('click', function() {
    enterSite(siteDecants, doorDecants);
  });

  if (doorCompletos) doorCompletos.addEventListener('click', function() {
    enterSite(siteCompletos, doorCompletos);
  });

  // Back buttons
  var btnBackToGateway = document.getElementById('btnBackToGateway');
  var btnGoToDecants = document.getElementById('btnGoToDecants');

  if (btnBackToGateway) btnBackToGateway.addEventListener('click', backToGateway);

  var btnBackToGatewayDecants = document.getElementById('btnBackToGatewayDecants');
  if (btnBackToGatewayDecants) btnBackToGatewayDecants.addEventListener('click', backToGateway);
  if (btnGoToDecants) btnGoToDecants.addEventListener('click', function() {
    siteCompletos.querySelectorAll('.combo-video').forEach(function(v) { v.pause(); });
    siteCompletos.classList.add('site-hidden');
    siteDecants.classList.remove('site-hidden');
    siteDecants.querySelectorAll('.combo-video').forEach(function(v) {
      v.play().catch(function() {});
    });
    window.scrollTo(0, 0);
  });

  // Switch between sections
  function switchSite(from, to) {
    // Pausar videos de la sección que se oculta
    from.querySelectorAll('.combo-video').forEach(function(v) { v.pause(); });

    // 1. Fade a negro
    overlay.classList.add('switch-active');

    // 2. Cuando está negro: ocultar from (scroll se resetea solo)
    setTimeout(function() {
      from.classList.add('site-hidden');
    }, 380);

    // 3. Mostrar new section y fade out del overlay
    setTimeout(function() {
      to.classList.remove('site-hidden');
      // Iniciar videos de la sección que se muestra
      to.querySelectorAll('.combo-video').forEach(function(v) {
        v.play().catch(function() {});
      });
      overlay.classList.remove('switch-active');
    }, 420);
  }

  var btnGoToCompletos = document.getElementById('btnGoToCompletos');
  var btnGoToDecants2 = document.getElementById('btnGoToDecants2');
  var btnGoToDecants3 = document.getElementById('btnGoToDecants3');
  var btnCartCompletos = document.getElementById('btnCartCompletos');

  if (btnGoToCompletos) btnGoToCompletos.addEventListener('click', function() {
    switchSite(siteDecants, siteCompletos);
  });
  if (btnGoToDecants2) btnGoToDecants2.addEventListener('click', function() {
    switchSite(siteCompletos, siteDecants);
  });
  if (btnGoToDecants3) btnGoToDecants3.addEventListener('click', function() {
    switchSite(siteCompletos, siteDecants);
  });
  if (btnCartCompletos) btnCartCompletos.addEventListener('click', toggleCarrito);

  // Smooth scroll for completos hero CTA
  var btnVerCatCompletos = document.querySelector('a[href="#completosCatalogo"]');
  if (btnVerCatCompletos) {
    btnVerCatCompletos.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('completosCatalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Logo click -> back to gateway
  document.querySelectorAll('.logo-text').forEach(function(logo) {
    logo.addEventListener('click', function(e) {
      e.preventDefault();
      backToGateway();
    });
  });

  // Search filter
  var buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', function(e) {
      renderCatalogo(e.target.value);
      if (e.target.value.length === 1) {
        var currentY = window.scrollY;
        var impulsoArriba = Math.max(0, currentY - 80);
        window.scrollTo({ top: impulsoArriba, behavior: 'smooth' });

        setTimeout(function() {
          var catalogoEl = document.getElementById('catalogoSection');
          catalogoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

          var onScroll = function() {
            var rect = catalogo.getBoundingClientRect();
            if (Math.abs(rect.top) < 5) {
              window.removeEventListener('scroll', onScroll);
              var main = document.querySelector('main') || document.body;
              main.style.transition = 'transform .25s cubic-bezier(.34,1.56,.64,1)';
              main.style.transform = 'translateY(18px)';
              setTimeout(function() {
                main.style.transform = 'translateY(0)';
                setTimeout(function() {
                  main.style.transition = '';
                  main.style.transform = '';
                }, 250);
              }, 120);
            }
          };
          window.addEventListener('scroll', onScroll);
        }, 250);
      }
    });
  }

  // WA float button
  var waFloats = document.querySelectorAll('.wa-float');
  waFloats.forEach(function(el) {
    el.href = 'https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent('Hola ' + CONFIG.WA_CONTACT + ', vi tu catálogo y me gustaría más información 👋');
  });

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

  var btnApplyPromo = document.getElementById('btnApplyPromo');
  if (btnApplyPromo) btnApplyPromo.addEventListener('click', applyPromoCode);
  var promoInput = document.getElementById('promoInput');
  if (promoInput) promoInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') applyPromoCode();
  });

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

  // Scroll Header Opacity Effect (all headers)
  var allHeaders = document.querySelectorAll('header');
  window.addEventListener('scroll', function() {
    allHeaders.forEach(function(h) {
      if (window.scrollY > 50) {
        h.classList.add('scrolled');
      } else {
        h.classList.remove('scrolled');
      }
    });
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
