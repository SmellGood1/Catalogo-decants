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

  var ml = Number(document.getElementById('ml').value);
  var precio = actual.prices[ml];

  carrito.push({
    id: _nextCartId++,
    nombre: actual.name,
    ml: ml,
    precio: precio,
    img: actual.img || ''
  });

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
  if (!confirm('¿Seguro que deseas vaciar el carrito?')) return;
  carrito = [];
  _saveCart();
  renderCarrito();
  mostrarToast('Carrito vaciado');
}

function renderCarrito() {
  var contador = document.getElementById('contador');
  var listaCarrito = document.getElementById('listaCarrito');
  var totalCarrito = document.getElementById('totalCarrito');

  contador.textContent = carrito.length;

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
        // Mover sutilmente a catalogo si no está visible
        document.getElementById('catalogoSection').scrollIntoView({ behavior: 'smooth' });
      });
    }

    totalCarrito.textContent = '$0';
    document.getElementById('btnEnviarPedido').disabled = true;
    document.getElementById('btnEnviarPedido').style.opacity = '0.5';
    document.getElementById('btnVaciarCarrito').style.display = 'none';
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

    div.innerHTML =
      '<div class="cart-left">' +
        '<strong>' + item.nombre + '</strong>' +
        '<div class="meta">' + item.ml + ' ml &times; <strong>' + item.cantidad + '</strong></div>' +
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

  totalCarrito.textContent = '$' + total;
}

function toggleCarrito() {
  var panel = document.getElementById('carritoPanel');
  var overlay = document.getElementById('cartOverlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('show');
  document.body.style.overflow = panel.classList.contains('open') ? 'hidden' : '';
}
