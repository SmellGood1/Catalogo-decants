/*
 * cart.js — Carrito con persistencia local, render, y CTAs asociadas.
 *
 * Reglas de negocio monetarias: delegadas a SG.pricing (pricing.js).
 * A11y: delegada a SG.modal (a11y.js).
 * Construcción del DOM: SG.el / textContent — nunca innerHTML con datos.
 */
(function (SG) {
  'use strict';

  var el = SG.el, byId = SG.byId;

  var carrito = [];
  var _nextCartId = 1;
  var _activePromo = null;

  /* ── Persistencia ────────────────────────────────────────────── */

  function _saveCart() {
    try { localStorage.setItem('sg_carrito', JSON.stringify(carrito)); } catch (e) {}
  }

  function _loadCart() {
    try {
      var saved = localStorage.getItem('sg_carrito');
      if (!saved) return;
      carrito = JSON.parse(saved);
      carrito.forEach(function (item) {
        if (item.isCompleto === undefined) {
          var mlNum = Number(item.ml);
          if (mlNum !== 2 && mlNum !== 5 && mlNum !== 10) item.isCompleto = true;
        }
      });
      _nextCartId = carrito.reduce(function (max, item) {
        return Math.max(max, (item.id || 0) + 1);
      }, 1);
      _saveCart();
    } catch (e) { carrito = []; }
  }

  /* ── Mutaciones ──────────────────────────────────────────────── */

  function addCarrito() {
    var actual = window.actual;
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
      var ml = Number(byId('ml').value);
      carrito.push({
        id: _nextCartId++,
        nombre: actual.name,
        ml: ml,
        precio: actual.prices[ml],
        img: actual.img || ''
      });
    }

    _saveCart();
    renderCarrito();
    window.cerrarDetalle();
    mostrarToast('Añadido al carrito');
    _animateBadge();
    _triggerConfetti();
  }

  function agregarComboAlCarrito(combo, perfumes, ml) {
    carrito.push({
      id: _nextCartId++,
      nombre: combo.name,
      ml: ml,
      precio: combo.prices[ml],
      img: (perfumes[1] && perfumes[1].img) || '',
      isCombo: true,
      comboItems: perfumes.map(function (p) { return p.name; })
    });
    _saveCart();
    renderCarrito();
    mostrarToast('Combo añadido al carrito');
    _animateBadge();
    _triggerConfetti();
  }

  function eliminar(ids) {
    carrito = carrito.filter(function (item) { return ids.indexOf(item.id) === -1; });
    _saveCart();
    renderCarrito();
    mostrarToast('Producto eliminado');
  }

  function incrementar(nombre, ml) {
    var existing = carrito.find(function (item) {
      return item.nombre === nombre && item.ml === ml;
    });
    if (!existing) return;
    carrito.push({
      id: _nextCartId++,
      nombre: nombre,
      ml: ml,
      precio: existing.precio,
      img: existing.img,
      isCompleto: existing.isCompleto,
      isCombo: existing.isCombo,
      comboItems: existing.comboItems
    });
    _saveCart();
    renderCarrito();
  }

  function decrementar(ids) {
    if (!ids.length) return;
    var idToRemove = ids[ids.length - 1];
    carrito = carrito.filter(function (item) { return item.id !== idToRemove; });
    _saveCart();
    renderCarrito();
  }

  function vaciarCarrito() {
    if (!carrito.length) return;

    var overlay = byId('confirmOverlay');
    overlay.classList.add('show');

    function detach() {
      byId('confirmCancel').removeEventListener('click', onCancel);
      byId('confirmAccept').removeEventListener('click', onAccept);
      overlay.removeEventListener('click', onOverlay);
    }

    function onCancel() { SG.modal.close(overlay); }
    function onAccept() {
      SG.modal.close(overlay);
      carrito = [];
      _saveCart();
      renderCarrito();
      mostrarToast('Carrito vaciado');
    }
    function onOverlay(e) { if (e.target === overlay) onCancel(); }

    byId('confirmCancel').addEventListener('click', onCancel);
    byId('confirmAccept').addEventListener('click', onAccept);
    overlay.addEventListener('click', onOverlay);

    SG.modal.open(overlay, {
      opener: document.activeElement,
      initialFocus: '#confirmCancel',
      onClose: function () {
        overlay.classList.remove('show');
        detach();
      }
    });
  }

  /* ── Render ──────────────────────────────────────────────────── */

  function _animateBadge() {
    var contador = byId('contador');
    if (!contador) return;
    contador.classList.remove('pop');
    void contador.offsetWidth;
    contador.classList.add('pop');
    setTimeout(function () { contador.classList.remove('pop'); }, 400);
  }

  function _triggerConfetti() {
    var colors = ['#d4af37', '#f5d77a', '#f9e29a', '#fff8e1', '#e8c86d', '#c9a82c', '#fffdf5', '#ffeebb'];
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;

    for (var i = 0; i < 30; i++) {
      var isCircle = Math.random() > 0.5;
      var piece = el('div', { class: 'confetti-piece ' + (isCircle ? 'circle' : 'rect') });
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = cx + 'px';
      piece.style.top = cy + 'px';

      var angle = Math.random() * Math.PI * 2;
      var velocity = 80 + Math.random() * 200;
      var tx = Math.cos(angle) * velocity;
      var ty = Math.sin(angle) * velocity - 60 + Math.random() * 300;
      var rot = (Math.random() - 0.5) * 1440;
      var duration = 0.8 + Math.random() * 0.8;

      piece.style.setProperty('--tx', tx + 'px');
      piece.style.setProperty('--ty', ty + 'px');
      piece.style.setProperty('--rot', rot + 'deg');
      piece.style.setProperty('--fall-duration', duration + 's');
      piece.style.width  = (4 + Math.random() * 6) + 'px';
      piece.style.height = (4 + Math.random() * 8) + 'px';

      document.body.appendChild(piece);
      (function (node, dur) { setTimeout(function () { node.remove(); }, dur * 1000 + 100); })(piece, duration);
    }
  }

  function _groupCart() {
    var groups = {};
    carrito.forEach(function (item) {
      var key = item.nombre + '_' + item.ml;
      if (!groups[key]) {
        groups[key] = {
          nombre: item.nombre, ml: item.ml, precio: item.precio, img: item.img,
          isCompleto: item.isCompleto || false,
          isCombo:    item.isCombo || false,
          comboItems: item.comboItems || null,
          cantidad: 0, ids: []
        };
      }
      groups[key].cantidad++;
      groups[key].ids.push(item.id);
    });
    return Object.keys(groups).map(function (k) { return groups[k]; });
  }

  function _mlLabel(item) {
    if (item.isCompleto) return 'Frasco completo';
    if (item.isCombo)    return item.ml + ' ml c/u';
    return item.ml + ' ml';
  }

  function _buildCartItem(item) {
    var precioTotal = item.precio * item.cantidad;
    var ids = item.ids.join(',');

    var left = el('div', { class: 'cart-left' }, [
      el('strong', { text: item.nombre }),
      el('div', { class: 'meta' }, [
        SG.text(_mlLabel(item) + ' × '),
        el('strong', { text: String(item.cantidad) })
      ]),
      el('div', { class: 'meta', text: '$' + precioTotal }),
      el('div', { class: 'qty-controls' }, [
        el('button', {
          class: 'qty-btn', type: 'button',
          dataset: { action: 'decrement', ids: ids },
          'aria-label': 'Reducir cantidad', text: '−'
        }),
        el('span', { text: String(item.cantidad) }),
        el('button', {
          class: 'qty-btn', type: 'button',
          dataset: { action: 'increment', nombre: item.nombre, ml: String(item.ml) },
          'aria-label': 'Aumentar cantidad', text: '+'
        })
      ]),
      el('button', {
        class: 'cart-remove', type: 'button',
        dataset: { ids: ids }, text: 'Eliminar'
      })
    ]);

    var row = el('div', { class: 'cart-item' }, [ left ]);
    if (item.img) row.appendChild(el('img', { class: 'cart-img', src: item.img, alt: item.nombre }));
    return row;
  }

  function _renderDiscountBar(b) {
    var bar = byId('discountBar');
    var msg = byId('discountMsg');
    var fill = byId('discountFill');
    if (!bar || !msg || !fill) return;

    if (!carrito.length) {
      bar.style.display = 'none';
      bar.classList.remove('reached');
      fill.style.width = '0%';
      return;
    }

    bar.style.display = 'block';

    function paintMsg(parts) {
      msg.textContent = '';
      parts.forEach(function (p) {
        if (typeof p === 'string') msg.appendChild(document.createTextNode(p));
        else if (p && p.strong) msg.appendChild(el('strong', { text: p.strong }));
      });
    }

    if (b.tierCurrent && !b.tierNext) {
      fill.style.width = '100%';
      bar.classList.add('reached');
      paintMsg([
        '¡',
        { strong: b.tierCurrent.percent + '% de descuento' },
        ' en decants! Ahorras ',
        { strong: '$' + b.volumeDiscount },
        ' 🔥'
      ]);
    } else if (b.tierCurrent && b.tierNext) {
      var progress = Math.min((b.decantsSubtotal / b.tierNext.threshold) * 100, 100);
      fill.style.width = progress + '%';
      bar.classList.add('reached');
      var falta = b.tierNext.threshold - b.decantsSubtotal;
      paintMsg([
        { strong: b.tierCurrent.percent + '% en decants' },
        ' (ahorras $' + b.volumeDiscount + ') · Agrega ',
        { strong: '$' + falta + ' más' },
        ' para ',
        { strong: b.tierNext.percent + '%' }
      ]);
    } else {
      var next = b.tierNext;
      var progress2 = Math.min((b.decantsSubtotal / next.threshold) * 100, 100);
      fill.style.width = progress2 + '%';
      bar.classList.remove('reached');
      var falta2 = next.threshold - b.decantsSubtotal;
      paintMsg([
        'Agrega ',
        { strong: '$' + falta2 + ' más en decants' },
        ' para obtener ',
        { strong: next.percent + '% de descuento' }
      ]);
    }
  }

  function _renderTotal(b) {
    var totalEl = byId('totalCarrito');
    totalEl.textContent = '';
    if (b.totalDiscount > 0) {
      var s = el('s', { text: '$' + b.subtotal });
      s.style.cssText = 'color:var(--muted);font-size:16px;font-weight:400';
      totalEl.appendChild(s);
      totalEl.appendChild(document.createTextNode(' $' + b.total));
    } else {
      totalEl.textContent = '$' + b.total;
    }
  }

  function _renderEmptyState(totalEl, btnEnviar, btnVaciar) {
    var empty = el('div', { class: 'cart-empty-state' }, [
      el('div', { class: 'cart-empty-icon', text: '🛍️' }),
      el('h3', { text: 'Tu carrito está vacío' }),
      el('p', { text: 'Aún no has agregado ninguna fragancia a tu colección. ¡Descubre tu próximo aroma favorito!' }),
      el('button', { id: 'btnEmptyStateCat', class: 'full-btn primary', type: 'button', text: 'Explorar Catálogo' })
    ]);
    byId('listaCarrito').replaceChildren(empty);

    byId('btnEmptyStateCat').addEventListener('click', function () {
      toggleCarrito();
      if (SG.ui && SG.ui.scrollToWithBounce) {
        SG.ui.scrollToWithBounce(byId('catalogoSection'));
      }
    });

    totalEl.textContent = '$0';
    btnEnviar.disabled = true;
    btnEnviar.style.opacity = '0.5';
    btnVaciar.style.display = 'none';
    _renderDiscountBar({ decantsSubtotal: 0 });
  }

  function renderCarrito() {
    var contador = byId('contador');
    var contadorCompletos = byId('contadorCompletos');
    var listaCarrito = byId('listaCarrito');
    var totalEl = byId('totalCarrito');
    var btnEnviar = byId('btnEnviarPedido');
    var btnVaciar = byId('btnVaciarCarrito');

    if (contador) contador.textContent = String(carrito.length);
    if (contadorCompletos) contadorCompletos.textContent = String(carrito.length);

    if (!carrito.length) {
      _renderEmptyState(totalEl, btnEnviar, btnVaciar);
      return;
    }

    btnEnviar.disabled = false;
    btnEnviar.style.opacity = '1';
    btnVaciar.style.display = 'block';

    var frag = document.createDocumentFragment();
    _groupCart().forEach(function (item) {
      frag.appendChild(_buildCartItem(item));
    });
    listaCarrito.replaceChildren(frag);

    var breakdown = SG.pricing.calculate(carrito, _activePromo);
    _renderDiscountBar(breakdown);
    _renderTotal(breakdown);
  }

  /* ── Promo ───────────────────────────────────────────────────── */

  function _getUsedCodes() {
    try { return JSON.parse(localStorage.getItem('sg_used_codes') || '[]'); }
    catch (e) { return []; }
  }

  function _markCodeUsed(code) {
    var used = _getUsedCodes();
    if (used.indexOf(code) === -1) {
      used.push(code);
      localStorage.setItem('sg_used_codes', JSON.stringify(used));
    }
  }

  function applyPromoCode() {
    var input = byId('promoInput');
    var msg = byId('promoMsg');
    var wrap = input.closest('.promo-code-wrap');
    var code = (input.value || '').trim().toUpperCase();

    if (!code) {
      msg.textContent = '';
      msg.className = 'promo-msg';
      return;
    }

    SG.pricing.validatePromo(code).then(function (promo) {
      if (!promo) {
        msg.textContent = 'Código no válido';
        msg.className = 'promo-msg error';
        _activePromo = null;
        renderCarrito();
        return;
      }
      if (promo.expires && new Date() > promo.expires) {
        msg.textContent = 'Este código ya expiró';
        msg.className = 'promo-msg error';
        _activePromo = null;
        renderCarrito();
        return;
      }
      if (_getUsedCodes().indexOf(promo.code) !== -1) {
        msg.textContent = 'Ya usaste este código';
        msg.className = 'promo-msg error';
        _activePromo = null;
        renderCarrito();
        return;
      }

      _activePromo = promo;
      msg.textContent = promo.percent + '% de descuento aplicado en decants';
      msg.className = 'promo-msg success';
      wrap.classList.add('applied');

      var cartTotal = SG.$('.cart-total');
      if (cartTotal) {
        cartTotal.classList.remove('total-updated');
        void cartTotal.offsetWidth;
        cartTotal.classList.add('total-updated');
        setTimeout(function () { cartTotal.classList.remove('total-updated'); }, 600);
      }

      renderCarrito();
    }).catch(function () {
      msg.textContent = 'No se pudo validar el código';
      msg.className = 'promo-msg error';
    });
  }

  /* ── Panel del carrito (a11y) ────────────────────────────────── */

  function toggleCarrito() {
    var panel = byId('carritoPanel');
    var overlay = byId('cartOverlay');

    if (SG.modal.isOpen(panel)) {
      SG.modal.close(panel);
      return;
    }

    panel.classList.add('open');
    overlay.classList.add('show');
    SG.modal.open(panel, {
      opener: document.activeElement,
      initialFocus: '#btnCerrarCarrito',
      onClose: function () {
        panel.classList.remove('open');
        overlay.classList.remove('show');
      }
    });
  }

  /* ── Exposición ──────────────────────────────────────────────── */

  window._loadCart = _loadCart;
  window.renderCarrito = renderCarrito;
  window.addCarrito = addCarrito;
  window.agregarComboAlCarrito = agregarComboAlCarrito;
  window.eliminar = eliminar;
  window.incrementar = incrementar;
  window.decrementar = decrementar;
  window.vaciarCarrito = vaciarCarrito;
  window.applyPromoCode = applyPromoCode;
  window.toggleCarrito = toggleCarrito;
  window._markCodeUsed = _markCodeUsed;

  // Lectores que whatsapp.js necesita
  Object.defineProperty(window, 'carrito',     { get: function () { return carrito; }, configurable: true });
  Object.defineProperty(window, '_activePromo',{ get: function () { return _activePromo; }, configurable: true });
})(window.SG);
