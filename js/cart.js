var carrito = [];
var _nextCartId = 1;

function _saveCart() {
  try {
    localStorage.setItem('sg_carrito', JSON.stringify(carrito));
  } catch (e) { /* localStorage full or unavailable */ }
}

function _loadCart() {
  try {
    var saved = localStorage.getItem('sg_carrito');
    if (saved) {
      carrito = JSON.parse(saved);
      _nextCartId = carrito.reduce(function(max, item) {
        return Math.max(max, (item.id || 0) + 1);
      }, 1);
    }
  } catch (e) {
    carrito = [];
  }
}

function addCarrito() {
  if (!actual) return;

  if (actual.isCompleto) {
    carrito.push({
      id: _nextCartId++,
      nombre: actual.name,
      ml: actual.ml || 'completo',
      precio: actual.price,
      img: actual.img || '',
      isCompleto: true
    });
  } else {
    var ml = Number(document.getElementById('ml').value);
    var precio = actual.prices[ml];

    carrito.push({
      id: _nextCartId++,
      nombre: actual.name,
      ml: ml,
      precio: precio,
      img: actual.img || ''
    });
  }

  _saveCart();
  renderCarrito();
  cerrarDetalle();
  mostrarToast('Añadido al carrito');
  
  // Animar el badge del contador
  var contador = document.getElementById('contador');
  if (contador) {
    contador.classList.remove('pop');
    void contador.offsetWidth; // Trigger reflow para reiniciar animacion
    contador.classList.add('pop');
    setTimeout(function() {
      contador.classList.remove('pop');
    }, 400); // 400ms dura el keyframe popBadge en header.css
  }

  // Confetti burst
  _triggerConfetti();
}

function _triggerConfetti() {
  var colors = ['#d4af37', '#f5d77a', '#f9e29a', '#fff8e1', '#e8c86d', '#c9a82c', '#fffdf5', '#ffeebb'];
  var count = 30;
  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2;

  for (var i = 0; i < count; i++) {
    var piece = document.createElement('div');
    var isCircle = Math.random() > 0.5;
    piece.className = 'confetti-piece ' + (isCircle ? 'circle' : 'rect');
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = cx + 'px';
    piece.style.top = cy + 'px';

    var angle = (Math.random() * Math.PI * 2);
    var velocity = 80 + Math.random() * 200;
    var tx = Math.cos(angle) * velocity;
    var ty = Math.sin(angle) * velocity - 60 + Math.random() * 300;
    var rot = (Math.random() - 0.5) * 1440;
    var duration = 0.8 + Math.random() * 0.8;

    piece.style.setProperty('--tx', tx + 'px');
    piece.style.setProperty('--ty', ty + 'px');
    piece.style.setProperty('--rot', rot + 'deg');
    piece.style.setProperty('--fall-duration', duration + 's');
    piece.style.width = (4 + Math.random() * 6) + 'px';
    piece.style.height = (4 + Math.random() * 8) + 'px';

    document.body.appendChild(piece);

    (function(el, dur) {
      setTimeout(function() { el.remove(); }, dur * 1000 + 100);
    })(piece, duration);
  }
}

function eliminar(ids) {
  carrito = carrito.filter(function(item) {
    return ids.indexOf(item.id) === -1;
  });
  _saveCart();
  renderCarrito();
  mostrarToast('Producto eliminado');
}

function incrementar(nombre, ml) {
  var existing = carrito.find(function(item) {
    return item.nombre === nombre && item.ml === ml;
  });
  if (existing) {
    carrito.push({
      id: _nextCartId++,
      nombre: nombre,
      ml: ml,
      precio: existing.precio,
      img: existing.img
    });
    _saveCart();
    renderCarrito();
  }
}

function decrementar(ids) {
  if (ids.length > 0) {
    var idToRemove = ids[ids.length - 1];
    carrito = carrito.filter(function(item) {
      return item.id !== idToRemove;
    });
    _saveCart();
    renderCarrito();
  }
}

function vaciarCarrito() {
  if (!carrito.length) return;

  var overlay = document.getElementById('confirmOverlay');
  overlay.classList.add('show');

  var onCancel = function() { overlay.classList.remove('show'); cleanup(); };
  var onAccept = function() {
    overlay.classList.remove('show');
    carrito = [];
    _saveCart();
    renderCarrito();
    mostrarToast('Carrito vaciado');
    cleanup();
  };
  var onOverlay = function(e) { if (e.target === overlay) onCancel(); };

  function cleanup() {
    document.getElementById('confirmCancel').removeEventListener('click', onCancel);
    document.getElementById('confirmAccept').removeEventListener('click', onAccept);
    overlay.removeEventListener('click', onOverlay);
  }

  document.getElementById('confirmCancel').addEventListener('click', onCancel);
  document.getElementById('confirmAccept').addEventListener('click', onAccept);
  overlay.addEventListener('click', onOverlay);
}

function renderCarrito() {
  var contador = document.getElementById('contador');
  var contadorCompletos = document.getElementById('contadorCompletos');
  var listaCarrito = document.getElementById('listaCarrito');
  var totalCarrito = document.getElementById('totalCarrito');

  contador.textContent = carrito.length;
  if (contadorCompletos) contadorCompletos.textContent = carrito.length;

  if (!carrito.length) {
    listaCarrito.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon">🛍️</div>
        <h3>Tu carrito está vacío</h3>
        <p>Aún no has agregado ninguna fragancia a tu colección. ¡Descubre tu próximo aroma favorito!</p>
        <button id="btnEmptyStateCat" class="full-btn primary">Explorar Catálogo</button>
      </div>
    `;
    
    // Listener para el nuevo botón CTA
    var btnEmptyStateCat = document.getElementById('btnEmptyStateCat');
    if (btnEmptyStateCat) {
      btnEmptyStateCat.addEventListener('click', function() {
        toggleCarrito(); // Cerrar carrito

        // Impulso contrario al destino
        var currentY = window.scrollY;
        var catalogo = document.getElementById('catalogoSection');
        var catalogoY = catalogo.getBoundingClientRect().top + currentY;
        var goingDown = currentY < catalogoY;
        var impulsoY = goingDown ? Math.max(0, currentY - 80) : currentY + 80;
        window.scrollTo({ top: impulsoY, behavior: 'smooth' });

        setTimeout(function() {
          catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Rebote elástico al llegar
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
        }, 200);
      });
    }

    totalCarrito.textContent = '$0';
    document.getElementById('btnEnviarPedido').disabled = true;
    document.getElementById('btnEnviarPedido').style.opacity = '0.5';
    document.getElementById('btnVaciarCarrito').style.display = 'none';

    // Resetear barra de descuento
    var discountBar = document.getElementById('discountBar');
    var discountFill = document.getElementById('discountFill');
    if (discountBar) {
      discountBar.style.display = 'none';
      discountBar.classList.remove('reached');
    }
    if (discountFill) discountFill.style.width = '0%';

    return;
  }

  document.getElementById('btnEnviarPedido').disabled = false;
  document.getElementById('btnEnviarPedido').style.opacity = '1';
  document.getElementById('btnVaciarCarrito').style.display = 'block';

  listaCarrito.innerHTML = '';
  var total = 0;

  var agrupados = {};

  carrito.forEach(function(item) {
    var key = item.nombre + '_' + item.ml;

    if (!agrupados[key]) {
      agrupados[key] = {
        nombre: item.nombre,
        ml: item.ml,
        precio: item.precio,
        img: item.img,
        isCompleto: item.isCompleto || false,
        cantidad: 1,
        ids: [item.id]
      };
    } else {
      agrupados[key].cantidad++;
      agrupados[key].ids.push(item.id);
    }
  });

  Object.values(agrupados).forEach(function(item) {
    var precioTotal = item.precio * item.cantidad;
    total += precioTotal;

    var escapedNombre = item.nombre.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    var div = document.createElement('div');
    div.className = 'cart-item';

    var mlLabel = item.isCompleto ? 'Frasco completo' : item.ml + ' ml';

    div.innerHTML =
      '<div class="cart-left">' +
        '<strong>' + item.nombre + '</strong>' +
        '<div class="meta">' + mlLabel + ' &times; <strong>' + item.cantidad + '</strong></div>' +
        '<div class="meta">$' + precioTotal + '</div>' +
        '<div class="qty-controls">' +
          '<button class="qty-btn" data-action="decrement" data-ids="' + item.ids.join(',') + '" aria-label="Reducir cantidad">&minus;</button>' +
          '<span>' + item.cantidad + '</span>' +
          '<button class="qty-btn" data-action="increment" data-nombre="' + escapedNombre + '" data-ml="' + item.ml + '" aria-label="Aumentar cantidad">+</button>' +
        '</div>' +
        '<button class="cart-remove" data-ids="' + item.ids.join(',') + '">Eliminar</button>' +
      '</div>' +
      (item.img ? '<img src="' + item.img + '" class="cart-img" alt="' + item.nombre + '">' : '');

    listaCarrito.appendChild(div);
  });

  // Discount bar logic — descuentos escalonados (solo aplica a decants)
  var TIERS = [
    { threshold: 500, percent: 10 },
    { threshold: 800, percent: 15 },
    { threshold: 1200, percent: 20 }
  ];
  var discountBar = document.getElementById('discountBar');
  var discountMsg = document.getElementById('discountMsg');
  var discountFill = document.getElementById('discountFill');
  var descuento = 0;

  // Solo contar decants para el descuento
  var totalDecants = 0;
  carrito.forEach(function(item) {
    if (!item.isCompleto) totalDecants += item.precio;
  });

  if (carrito.length) {
    discountBar.style.display = 'block';

    // Encontrar tier actual y siguiente
    var currentTier = null;
    var nextTier = TIERS[0];
    for (var t = 0; t < TIERS.length; t++) {
      if (totalDecants >= TIERS[t].threshold) {
        currentTier = TIERS[t];
        nextTier = TIERS[t + 1] || null;
      }
    }

    if (currentTier && !nextTier) {
      // Máximo descuento alcanzado
      var progress = 100;
      discountFill.style.width = progress + '%';
      descuento = Math.round(totalDecants * currentTier.percent / 100);
      discountBar.classList.add('reached');
      discountMsg.innerHTML = '¡<strong>' + currentTier.percent + '% de descuento</strong> en decants! Ahorras <strong>$' + descuento + '</strong> 🔥';
    } else if (currentTier && nextTier) {
      // Tiene descuento pero puede subir al siguiente
      var progress = Math.min((totalDecants / nextTier.threshold) * 100, 100);
      discountFill.style.width = progress + '%';
      descuento = Math.round(totalDecants * currentTier.percent / 100);
      var falta = nextTier.threshold - totalDecants;
      discountBar.classList.add('reached');
      discountMsg.innerHTML = '<strong>' + currentTier.percent + '% en decants</strong> (ahorras $' + descuento + ') · Agrega <strong>$' + falta + ' más</strong> para <strong>' + nextTier.percent + '%</strong>';
    } else {
      // Aún no llega al primer tier
      var progress = Math.min((totalDecants / nextTier.threshold) * 100, 100);
      discountFill.style.width = progress + '%';
      var falta = nextTier.threshold - totalDecants;
      discountBar.classList.remove('reached');
      discountMsg.innerHTML = 'Agrega <strong>$' + falta + ' más en decants</strong> para obtener <strong>' + nextTier.percent + '% de descuento</strong>';
    }
  } else {
    discountBar.style.display = 'none';
    discountBar.classList.remove('reached');
  }

  var totalFinal = total - descuento;
  totalCarrito.textContent = '$' + totalFinal;
  if (descuento) {
    totalCarrito.innerHTML = '<s style="color:var(--muted);font-size:16px;font-weight:400">$' + total + '</s> $' + totalFinal;
  }
}

function toggleCarrito() {
  var panel = document.getElementById('carritoPanel');
  var overlay = document.getElementById('cartOverlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('show');
  document.body.style.overflow = panel.classList.contains('open') ? 'hidden' : '';
}
