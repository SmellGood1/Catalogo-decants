var actual = null;

// Sonido de spray atomizador
function _playSpray() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var now = ctx.currentTime;

    // Click mecánico del pump
    var clickOsc = ctx.createOscillator();
    var clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.01);
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.015);

    // Spray de aire
    var noiseLen = ctx.sampleRate * 0.3;
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var noiseData = noiseBuf.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    var noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    var sprayEnv = ctx.createGain();
    sprayEnv.gain.setValueAtTime(0, now + 0.008);
    sprayEnv.gain.linearRampToValueAtTime(0.12, now + 0.018);
    sprayEnv.gain.setValueAtTime(0.12, now + 0.05);
    sprayEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    hp.Q.value = 0.3;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(12000, now + 0.01);
    lp.frequency.exponentialRampToValueAtTime(4000, now + 0.2);
    lp.Q.value = 0.5;

    noiseSrc.connect(hp);
    hp.connect(lp);
    lp.connect(sprayEnv);
    sprayEnv.connect(ctx.destination);

    noiseSrc.start(now + 0.008);
    noiseSrc.stop(now + 0.3);

    noiseSrc.onended = function() { ctx.close(); };
  } catch (e) {}
}

// Sonido de vidrio rompiéndose
function _playExplosion() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var duration = 1.2;
    var length = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);

    for (var i = 0; i < length; i++) {
      var t = i / ctx.sampleRate;

      // Impacto inicial fuerte
      var impact = t < 0.03 ? (1 - t / 0.03) * 0.7 : 0;

      // Tintineo de vidrios cayendo
      var shards = 0;
      var freqs = [3200, 4800, 6400, 7600, 2400, 5500, 8200, 1800];
      for (var f = 0; f < freqs.length; f++) {
        var delay = 0.02 + f * 0.04 + Math.sin(f * 7) * 0.03;
        if (t > delay) {
          var dt = t - delay;
          var env = Math.exp(-12 * dt) * (0.15 + Math.random() * 0.05);
          shards += Math.sin(freqs[f] * 2 * Math.PI * dt) * env;
        }
      }

      // Crunch de vidrio (ruido filtrado)
      var crunch = (Math.random() * 2 - 1) * Math.exp(-5 * t) * 0.25;

      data[i] = (impact + shards + crunch) * 0.4;
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    source.onended = function() { ctx.close(); };
  } catch (e) {}
}

// Partículas de vidrio roto
function _crearParticulas(img) {
  var rect = img.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;

  // Pedazos de vidrio realistas
  var totalShards = 28;
  for (var i = 0; i < totalShards; i++) {
    var shard = document.createElement('div');
    var size = 6 + Math.random() * 24;
    var isSmall = size < 14;

    // Formas variadas de vidrio roto
    var shapes = [
      'polygon(' + (Math.random()*20) + '% 0%, ' + (80+Math.random()*20) + '% ' + (Math.random()*30) + '%, 100% ' + (60+Math.random()*40) + '%, ' + (Math.random()*30) + '% 100%)',
      'polygon(' + (Math.random()*25) + '% 0%, 100% ' + (20+Math.random()*30) + '%, ' + (70+Math.random()*30) + '% 100%, 0% ' + (50+Math.random()*40) + '%)',
      'polygon(50% 0%, 100% ' + (30+Math.random()*40) + '%, ' + (60+Math.random()*30) + '% 100%, 0% ' + (40+Math.random()*40) + '%)',
      'polygon(' + (Math.random()*15) + '% ' + (Math.random()*20) + '%, ' + (85+Math.random()*15) + '% 0%, 100% 100%, ' + (Math.random()*25) + '% ' + (75+Math.random()*25) + '%)'
    ];

    // Colores de vidrio con reflejos
    var hue = 200 + Math.random() * 40;
    var lightness = 70 + Math.random() * 25;
    var alpha = 0.4 + Math.random() * 0.4;
    var bgColor = 'hsla(' + hue + ', ' + (30 + Math.random()*40) + '%, ' + lightness + '%, ' + alpha + ')';
    var glowColor = 'hsla(' + hue + ', 60%, 85%, 0.6)';

    shard.style.cssText =
      'position:fixed;z-index:9999;pointer-events:none;' +
      'width:' + size + 'px;height:' + (size * (0.5 + Math.random() * 0.6)) + 'px;' +
      'background:linear-gradient(135deg, ' + bgColor + ', rgba(255,255,255,' + (0.3 + Math.random()*0.4) + '));' +
      'clip-path:' + shapes[i % shapes.length] + ';' +
      'left:' + cx + 'px;top:' + cy + 'px;opacity:1;' +
      'transition:all ' + (0.6 + Math.random() * 0.6) + 's cubic-bezier(.2,.6,.35,1);' +
      'box-shadow:0 0 ' + (4 + Math.random()*8) + 'px ' + glowColor + ', inset 0 0 ' + (2+Math.random()*4) + 'px rgba(255,255,255,0.3);' +
      'backdrop-filter:blur(2px);';
    document.body.appendChild(shard);

    var angle = (Math.PI * 2 / totalShards) * i + (Math.random() - 0.5) * 0.8;
    var dist = (isSmall ? 100 : 50) + Math.random() * 200;
    var tx = Math.cos(angle) * dist;
    // Gravedad: los pedazos caen más
    var ty = Math.sin(angle) * dist + 40 + Math.random() * 100;
    var rot = Math.random() * 1080 - 540;
    var delay = Math.random() * 80;

    (function(el, x, y, r, d) {
      setTimeout(function() {
        requestAnimationFrame(function() {
          el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) scale(0.2)';
          el.style.opacity = '0';
        });
      }, d);
      setTimeout(function() { el.remove(); }, 1300);
    })(shard, tx, ty, rot, delay);
  }

  // Destello blanco en el centro
  var flash = document.createElement('div');
  flash.style.cssText =
    'position:fixed;z-index:9998;pointer-events:none;' +
    'left:' + (cx - 60) + 'px;top:' + (cy - 60) + 'px;' +
    'width:120px;height:120px;border-radius:50%;' +
    'background:radial-gradient(circle, rgba(255,255,255,0.8), transparent 70%);' +
    'transition:all .4s ease;opacity:1;transform:scale(1);';
  document.body.appendChild(flash);
  requestAnimationFrame(function() {
    flash.style.transform = 'scale(2.5)';
    flash.style.opacity = '0';
  });
  setTimeout(function() { flash.remove(); }, 450);

  // Imagen desaparece y vuelve
  img.style.transition = 'opacity .15s ease';
  img.style.opacity = '0';
  setTimeout(function() {
    img.style.transition = 'opacity .6s ease';
    img.style.opacity = '1';
  }, 1500);
}

function verPerfume(p) {
  actual = p;

  document.getElementById('dImg').src = p.img;
  document.getElementById('dImg').alt = p.name;
  document.getElementById('dNombre').textContent = p.name;
  document.getElementById('dConc').textContent = p.conc;
  document.getElementById('dMarca').textContent = p.casa;

  document.getElementById('ml').value = '2';
  actualizarPrecioModal();

  var fragranticaLink = document.getElementById('fragranticaLink');
  if (p.link && p.link.trim() !== '') {
    fragranticaLink.href = p.link;
    fragranticaLink.style.display = 'inline-flex';
  } else {
    fragranticaLink.style.display = 'none';
  }

  var notasDiv = document.getElementById('dNotas');
  if (p.notes) {
    var html = '<strong class="notas-title">Notas olfativas</strong><div class="notas-grid">';
    if (p.notes.top) html += '<div class="nota"><span class="nota-label">Salida</span><span>' + p.notes.top.join(', ') + '</span></div>';
    if (p.notes.heart) html += '<div class="nota"><span class="nota-label">Corazón</span><span>' + p.notes.heart.join(', ') + '</span></div>';
    if (p.notes.base) html += '<div class="nota"><span class="nota-label">Fondo</span><span>' + p.notes.base.join(', ') + '</span></div>';
    html += '</div>';
    notasDiv.innerHTML = html;
    notasDiv.style.display = 'block';
  } else {
    notasDiv.innerHTML = '';
    notasDiv.style.display = 'none';
  }

  var detalle = document.getElementById('detalle');
  detalle.style.display = 'flex';
  // Force reflow para que la transición arranque desde opacity:0
  detalle.offsetHeight;
  detalle.classList.remove('closing');
  detalle.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function cerrarDetalle(e) {
  var detalle = document.getElementById('detalle');
  if (e && e.target !== detalle) return;

  detalle.classList.add('closing');
  detalle.classList.remove('show');
  setTimeout(function() {
    detalle.classList.remove('closing');
    detalle.style.display = 'none';
  }, 550);
  document.body.style.overflow = '';
}

function actualizarPrecioModal() {
  var ml = Number(document.getElementById('ml').value);
  var precio = actual.prices[ml];

  document.getElementById('precioModal').textContent = '$' + precio;
  document.getElementById('textoMlModal').textContent = ml + ' ml seleccionados';
}
