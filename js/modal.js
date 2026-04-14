/*
 * modal.js — Modal de detalle de producto.
 *
 * Usa:
 *   · SG.audio   → AudioContext compartido (no se crea uno por click)
 *   · SG.modal   → focus management / escape / trap de teclado
 *   · SG.el/text → construcción segura del DOM (datos externos sanitizados)
 */
(function (SG) {
  'use strict';

  var el = SG.el, byId = SG.byId;

  var actual = null;
  var lastOpener = null;

  /* ── Audio: spray + explosion, reutilizando AudioContext ────── */

  function _buildNoiseBuffer(ctx, seconds) {
    var length = Math.floor(ctx.sampleRate * seconds);
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function _playSpray() {
    var ctx = SG.audio.resume();
    if (!ctx) return;
    var now = ctx.currentTime;

    var src = ctx.createBufferSource();
    src.buffer = _buildNoiseBuffer(ctx, 0.3);

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.1, now + 0.01);
    env.gain.setValueAtTime(0.1, now + 0.06);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 3000; hp.Q.value = 0.3;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(12000, now + 0.01);
    lp.frequency.exponentialRampToValueAtTime(4000, now + 0.2);
    lp.Q.value = 0.5;

    src.connect(hp); hp.connect(lp); lp.connect(env); env.connect(ctx.destination);
    src.start(now); src.stop(now + 0.3);
  }

  function _playExplosion() {
    var ctx = SG.audio.resume();
    if (!ctx) return;

    var duration = 1.2;
    var length = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    var freqs = [3200, 4800, 6400, 7600, 2400, 5500, 8200, 1800];

    for (var i = 0; i < length; i++) {
      var t = i / ctx.sampleRate;
      var impact = t < 0.03 ? (1 - t / 0.03) * 0.7 : 0;
      var shards = 0;
      for (var f = 0; f < freqs.length; f++) {
        var delay = 0.02 + f * 0.04 + Math.sin(f * 7) * 0.03;
        if (t > delay) {
          var dt = t - delay;
          var envv = Math.exp(-12 * dt) * (0.15 + Math.random() * 0.05);
          shards += Math.sin(freqs[f] * 2 * Math.PI * dt) * envv;
        }
      }
      var crunch = (Math.random() * 2 - 1) * Math.exp(-5 * t) * 0.25;
      data[i] = (impact + shards + crunch) * 0.4;
    }

    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start();
  }

  /* ── Partículas de vidrio ────────────────────────────────────── */

  function _crearParticulas(img) {
    var rect = img.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top  + rect.height / 2;

    var shapes = [
      'polygon(10% 0%, 90% 15%, 100% 80%, 20% 100%)',
      'polygon(15% 0%, 100% 35%, 85% 100%, 0% 70%)',
      'polygon(50% 0%, 100% 50%, 75% 100%, 0% 60%)',
      'polygon(8% 10%, 92% 0%, 100% 100%, 12% 88%)'
    ];

    for (var i = 0; i < 28; i++) {
      var size = 6 + Math.random() * 24;
      var isSmall = size < 14;
      var hue = 200 + Math.random() * 40;
      var lightness = 70 + Math.random() * 25;
      var alpha = 0.4 + Math.random() * 0.4;

      var shard = document.createElement('div');
      shard.style.cssText =
        'position:fixed;z-index:9999;pointer-events:none;' +
        'width:' + size + 'px;height:' + (size * (0.5 + Math.random() * 0.6)) + 'px;' +
        'background:linear-gradient(135deg, hsla(' + hue + ',' + (30 + Math.random() * 40) + '%,' + lightness + '%,' + alpha + '), rgba(255,255,255,' + (0.3 + Math.random() * 0.4) + '));' +
        'clip-path:' + shapes[i % shapes.length] + ';' +
        'left:' + cx + 'px;top:' + cy + 'px;opacity:1;' +
        'transition:all ' + (0.6 + Math.random() * 0.6) + 's cubic-bezier(.2,.6,.35,1);' +
        'box-shadow:0 0 ' + (4 + Math.random() * 8) + 'px hsla(' + hue + ',60%,85%,.6), inset 0 0 ' + (2 + Math.random() * 4) + 'px rgba(255,255,255,.3);';
      document.body.appendChild(shard);

      var angle = (Math.PI * 2 / 28) * i + (Math.random() - 0.5) * 0.8;
      var dist = (isSmall ? 100 : 50) + Math.random() * 200;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist + 40 + Math.random() * 100;
      var rot = Math.random() * 1080 - 540;
      var delay = Math.random() * 80;

      (function (node, x, y, r, d) {
        setTimeout(function () {
          requestAnimationFrame(function () {
            node.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) scale(0.2)';
            node.style.opacity = '0';
          });
        }, d);
        setTimeout(function () { node.remove(); }, 1300);
      })(shard, tx, ty, rot, delay);
    }

    var flash = document.createElement('div');
    flash.style.cssText =
      'position:fixed;z-index:9998;pointer-events:none;' +
      'left:' + (cx - 60) + 'px;top:' + (cy - 60) + 'px;' +
      'width:120px;height:120px;border-radius:50%;' +
      'background:radial-gradient(circle, rgba(255,255,255,.8), transparent 70%);' +
      'transition:all .4s ease;opacity:1;transform:scale(1);';
    document.body.appendChild(flash);
    requestAnimationFrame(function () {
      flash.style.transform = 'scale(2.5)';
      flash.style.opacity = '0';
    });
    setTimeout(function () { flash.remove(); }, 450);

    img.style.transition = 'opacity .15s ease';
    img.style.opacity = '0';
    setTimeout(function () {
      img.style.transition = 'opacity .6s ease';
      img.style.opacity = '1';
    }, 1500);
  }

  /* ── Notas olfativas (construcción segura) ────────────────────── */

  function buildNotasGrid(notes) {
    var grid = el('div', { class: 'notas-grid' });
    function push(label, list) {
      if (!list || !list.length) return;
      grid.appendChild(el('div', { class: 'nota' }, [
        el('span', { class: 'nota-label', text: label }),
        el('span', { text: list.join(', ') })
      ]));
    }
    push('Salida',  notes.top);
    push('Corazón', notes.heart);
    push('Fondo',   notes.base);
    return grid;
  }

  /* ── API pública ─────────────────────────────────────────────── */

  function verPerfume(p) {
    actual = p;
    lastOpener = document.activeElement;

    byId('dImg').src = p.img || 'assets/favicon.svg';
    byId('dImg').alt = p.name || '';
    byId('dNombre').textContent = p.name || '';
    byId('dConc').textContent = p.conc || '';
    byId('dMarca').textContent = p.casa || '';

    var mlField = byId('ml').closest('.field');
    var precioModal = byId('precioModal');
    var textoMl = byId('textoMlModal');
    var btnAdd = byId('btnAddCart');

    if (p.isCompleto) {
      mlField.style.display = 'none';
      precioModal.textContent = '$' + p.price;
      var t = p.ml ? (p.ml + ' ml — Frasco completo') : 'Frasco completo';
      if (p.entrega) t += ' · 📦 ' + p.entrega;
      textoMl.textContent = t;
    } else {
      mlField.style.display = '';
      byId('ml').value = '2';
      actualizarPrecioModal();
    }
    btnAdd.textContent = 'Añadir al carrito';

    var fragranticaLink = byId('fragranticaLink');
    if (p.link && p.link.trim() !== '') {
      fragranticaLink.href = p.link;
      fragranticaLink.style.display = 'inline-flex';
    } else {
      fragranticaLink.style.display = 'none';
    }

    var notasDiv = byId('dNotas');
    notasDiv.textContent = '';
    if (p.notes) {
      notasDiv.appendChild(el('strong', { class: 'notas-title', text: 'Notas olfativas' }));
      notasDiv.appendChild(buildNotasGrid(p.notes));
      notasDiv.style.display = 'block';
    } else {
      notasDiv.style.display = 'none';
    }

    var detalle = byId('detalle');
    detalle.style.display = 'flex';
    detalle.offsetHeight; // reflow
    detalle.classList.remove('closing');
    detalle.classList.add('show');

    SG.modal.open(detalle, {
      opener: lastOpener,
      initialFocus: '#btnCerrarX',
      onClose: function () {
        detalle.classList.add('closing');
        detalle.classList.remove('show');
        setTimeout(function () {
          detalle.classList.remove('closing');
          detalle.style.display = 'none';
        }, 550);
      }
    });
  }

  function cerrarDetalle(e) {
    var detalle = byId('detalle');
    if (e && e.target !== detalle) return;
    SG.modal.close(detalle);
  }

  function actualizarPrecioModal() {
    if (!actual || actual.isCompleto) return;
    var ml = Number(byId('ml').value);
    var precio = actual.prices[ml];
    byId('precioModal').textContent = '$' + precio;
    byId('textoMlModal').textContent = ml + ' ml seleccionados';
  }

  // Exposición pública para cart.js / app.js
  window.verPerfume = verPerfume;
  window.cerrarDetalle = cerrarDetalle;
  window.actualizarPrecioModal = actualizarPrecioModal;

  // Efectos agrupados en namespace — no contaminan window.*
  SG.fx = {
    playSpray: _playSpray,
    playExplosion: _playExplosion,
    breakGlass: _crearParticulas
  };

  // cart.js necesita leer el producto abierto — getter sin mutación externa.
  Object.defineProperty(window, 'actual', {
    get: function () { return actual; },
    configurable: true
  });
})(window.SG);
