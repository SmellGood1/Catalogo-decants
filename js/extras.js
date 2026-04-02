/*
 * extras.js — Destacados, completos, contadores animados, botón scroll-top
 */

/* ── Catálogo Completos ─────────────────────────────────────── */

function renderCompletos() {
  var container = document.getElementById('catalogoCompletos');
  console.log('[COMPLETOS] container:', !!container, 'data:', !!window.COMPLETOS, 'casas:', window.COMPLETOS ? Object.keys(COMPLETOS).length : 0);
  if (!container || !window.COMPLETOS) return;

  var casas = Object.keys(COMPLETOS);
  if (!casas.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:3rem 1rem;">Próximamente — estamos preparando esta sección.</p>';
    return;
  }

  container.innerHTML = '';

  casas.forEach(function(casa) {
    // Título de casa
    var titleDiv = document.createElement('div');
    titleDiv.className = 'house-title revealed';
    titleDiv.style.opacity = '1';
    titleDiv.style.transform = 'none';
    titleDiv.innerHTML = '<h3>' + casa + '</h3><div class="house-line"></div>';
    container.appendChild(titleDiv);

    // Grid de cards
    var grid = document.createElement('div');
    grid.className = 'grid';

    COMPLETOS[casa].forEach(function(p) {
      var card = document.createElement('article');
      card.className = 'card revealed' + (p.proximo ? ' proximo' : '') + (p.agotado ? ' agotado' : '');
      card.style.opacity = '1';
      card.style.transform = 'none';

      var topPills = '';
      if (p.agotado) {
        topPills = '<div class="agotado-label">Agotado</div>';
      } else if (p.proximo && p.muyProonto) {
        topPills = '<span class="soon-label muy-pronto-label">Muy pronto</span>';
      } else if (p.proximo) {
        topPills = '<span class="soon-label">Próximamente</span>';
      } else {
        if (p.conc) topPills += '<span class="pill">' + p.conc + '</span>';
        if (p.ml) topPills += '<span class="pill">' + p.ml + ' ml</span>';
      }

      var bottomContent = '';
      if (p.agotado) {
        bottomContent = '<div class="bottom"><div class="starting"><span>Agotado</span></div>' +
          (p.link ? '<a href="' + p.link + '" target="_blank" rel="noopener" class="small-btn agotado-link">Fragrantica</a>' : '') +
          '</div>';
      } else {
        bottomContent =
          (p.entrega && !p.proximo ? '<div class="entrega-label">📦 ' + p.entrega + '</div>' : '') +
          '<div class="bottom">' +
            '<div class="starting">' +
              '<span>Frasco completo</span>' +
              '<strong>$' + p.price + '</strong>' +
            '</div>' +
            (!p.proximo ? '<span class="small-btn">Ver</span>' : '') +
          '</div>';
      }

      card.innerHTML =
        '<div class="card-top">' + topPills + '</div>' +
        '<div class="card-img-wrap">' +
          '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
        '</div>' +
        '<div class="card-content">' +
          '<h4>' + p.name + '</h4>' +
          '<div class="brand">' + casa + '</div>' +
          bottomContent +
        '</div>';

      if (!p.proximo && !p.agotado) {
        card.addEventListener('click', function() {
          var perfumeConCasa = {};
          for (var key in p) { perfumeConCasa[key] = p[key]; }
          perfumeConCasa.casa = casa;
          perfumeConCasa.isCompleto = true;
          verPerfume(perfumeConCasa);
        });
      }

      grid.appendChild(card);
    });

    container.appendChild(grid);
  });
}

/* ── Combos ──────────────────────────────────────────────────── */

function renderCombos() {
  var container = document.getElementById('combosContainer');
  if (!container || !window.COMBOS || !window.PERFUMES) return;

  var combos = COMBOS.filter(function(c) { return !c.agotado; });

  if (!combos.length) {
    var section = container.closest('.combos-section');
    if (section) section.style.display = 'none';
    return;
  }

  container.innerHTML = '';

  combos.forEach(function(combo) {
    // Buscar los 3 perfumes por código
    var perfumes = combo.codes.map(function(code) {
      return findPerfumeByCode(code);
    }).filter(Boolean);

    if (perfumes.length < 3) return;

    var card = document.createElement('article');
    card.className = 'combo-card';

    // Calcular precio original sumado (5ml como referencia)
    var originalSum = perfumes.reduce(function(sum, p) {
      return sum + (p.prices[5] || 0);
    }, 0);
    var savings = originalSum - combo.prices[5];

    function calcSavings(ml) {
      var orig = perfumes.reduce(function(sum, p) { return sum + (p.prices[ml] || 0); }, 0);
      return orig - combo.prices[ml];
    }

    card.innerHTML =
      (combo.video ? '<video class="combo-video" autoplay muted loop playsinline preload="none" data-src="assets/' + combo.video + '"></video>' : '') +
      '<div class="combo-header">' +
        '<h3>' + combo.name + '</h3>' +
        '<span class="combo-savings">Ahorras $' + calcSavings(5) + '</span>' +
      '</div>' +
      '<div class="combo-perfumes">' +
        perfumes.map(function(p) {
          return '<div class="combo-perfume">' +
            '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
            '<span class="combo-perfume-name">' + p.name + '</span>' +
            '<span class="combo-perfume-brand">' + p.casa + '</span>' +
          '</div>';
        }).join('<span class="combo-plus">+</span>') +
      '</div>' +
      '<div class="combo-footer">' +
        '<div class="combo-prices">' +
          '<div class="combo-price-tag" data-ml="2" data-orig="' + perfumes.reduce(function(s,p){return s+(p.prices[2]||0)},0) + '"><span>2ml</span><s>$' + perfumes.reduce(function(s,p){return s+(p.prices[2]||0)},0) + '</s><strong>$' + combo.prices[2] + '</strong></div>' +
          '<div class="combo-price-tag active" data-ml="5" data-orig="' + perfumes.reduce(function(s,p){return s+(p.prices[5]||0)},0) + '"><span>5ml</span><s>$' + perfumes.reduce(function(s,p){return s+(p.prices[5]||0)},0) + '</s><strong>$' + combo.prices[5] + '</strong></div>' +
          '<div class="combo-price-tag" data-ml="10" data-orig="' + perfumes.reduce(function(s,p){return s+(p.prices[10]||0)},0) + '"><span>10ml</span><s>$' + perfumes.reduce(function(s,p){return s+(p.prices[10]||0)},0) + '</s><strong>$' + combo.prices[10] + '</strong></div>' +
        '</div>' +
        '<button class="btn btn-primary combo-add-btn">Añadir combo</button>' +
      '</div>';

    // Click en price tags — actualizar ahorro
    card.addEventListener('click', function(e) {
      var tag = e.target.closest('.combo-price-tag');
      if (tag) {
        card.querySelectorAll('.combo-price-tag').forEach(function(t) { t.classList.remove('active'); });
        tag.classList.add('active');
        var ml = Number(tag.dataset.ml);
        var s = calcSavings(ml);
        var savingsEl = card.querySelector('.combo-savings');
        savingsEl.textContent = 'Ahorras $' + s;
        if (s <= 0) savingsEl.style.display = 'none';
        else savingsEl.style.display = '';
      }
    });

    // Añadir combo al carrito
    var addBtn = card.querySelector('.combo-add-btn');
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var activeTag = card.querySelector('.combo-price-tag.active');
      var ml = Number(activeTag.dataset.ml);

      carrito.push({
        id: _nextCartId++,
        nombre: combo.name,
        ml: ml,
        precio: combo.prices[ml],
        img: perfumes[1].img || '',
        isCombo: true,
        comboItems: perfumes.map(function(p) { return p.name; })
      });

      _saveCart();
      renderCarrito();
      mostrarToast('Combo añadido al carrito');

      var contador = document.getElementById('contador');
      if (contador) {
        contador.classList.remove('pop');
        void contador.offsetWidth;
        contador.classList.add('pop');
      }
      _triggerConfetti();
    });

    container.appendChild(card);
  });
}

/* ── Destacados ──────────────────────────────────────────────── */

function renderDestacados() {
  var container = document.getElementById('destacados');
  if (!container || !window.PERFUMES) return;

  var destacados = [];

  for (var casa in PERFUMES) {
    PERFUMES[casa].forEach(function(p) {
      if (p.destacado && !p.proximo) {
        destacados.push({ perfume: p, casa: casa });
      }
    });
  }

  // Ordenar por ranking (menor número = más vendido)
  destacados.sort(function(a, b) {
    return (a.perfume.ranking || 999) - (b.perfume.ranking || 999);
  });

  // Si no hay destacados marcados, no mostrar la sección
  if (!destacados.length) {
    var section = container.closest('.bestsellers-section');
    if (section) section.style.display = 'none';
    return;
  }

  container.innerHTML = '';

  function buildCard(item, index) {
    var p = item.perfume;
    var casa = item.casa;

    var card = document.createElement('article');
    card.className = 'bestseller-card';
    card.innerHTML =
      '<span class="bestseller-rank">#' + (index + 1) + '</span>' +
      '<div class="bestseller-badge">Bestseller</div>' +
      '<div class="bs-img-wrap">' +
        '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
      '</div>' +
      '<div class="bestseller-content">' +
        '<div class="bs-brand">' + casa + '</div>' +
        '<h4>' + p.name + '</h4>' +
        (p.conc ? '<div class="bs-conc">' + p.conc + '</div>' : '<div class="bs-conc">&nbsp;</div>') +
        '<div class="bestseller-bottom">' +
          '<div class="bs-price">' +
            '<span>Desde</span>' +
            '<strong>$' + p.prices[2] + '</strong>' +
          '</div>' +
          '<span class="bs-cta">Ver</span>' +
        '</div>' +
      '</div>';

    card.addEventListener('click', (function(perfume, casaNombre) {
      return function() {
        var perfumeConCasa = {};
        for (var key in perfume) { perfumeConCasa[key] = perfume[key]; }
        perfumeConCasa.casa = casaNombre;
        verPerfume(perfumeConCasa);
      };
    })(p, casa));

    return card;
  }

  // Render cards
  destacados.forEach(function(item, i) {
    container.appendChild(buildCard(item, i));
  });

  // Auto-scroll
  var wrapper = container.closest('.bestsellers-wrapper');
  if (wrapper) {
    var scrollInterval = null;
    var resumeTimer = null;

    var rewinding = false;

    function rewind() {
      rewinding = true;
      clearInterval(scrollInterval);
      scrollInterval = null;

      // Rebobinar hacia la izquierda
      var startPos = wrapper.scrollLeft;
      var startTime = Date.now();
      var duration = 1200; // ms

      var rewindId = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var t = Math.min(elapsed / duration, 1);

        // easeInOutCubic: arranca suave, acelera, frena suave
        var ease = t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;

        wrapper.scrollLeft = startPos * (1 - ease);

        if (t >= 1) {
          wrapper.scrollLeft = 0;
          clearInterval(rewindId);
          rewinding = false;
          setTimeout(startScroll, 800);
        }
      }, 16);
    }

    function startScroll() {
      if (scrollInterval || rewinding) return;
      scrollInterval = setInterval(function() {
        var max = wrapper.scrollWidth - wrapper.clientWidth;
        if (wrapper.scrollLeft >= max - 2) {
          rewind();
        } else {
          wrapper.scrollLeft += 0.5;
        }
      }, 30);
    }

    function stopScroll() {
      clearInterval(scrollInterval);
      scrollInterval = null;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(startScroll, 4000);
    }

    wrapper.addEventListener('pointerdown', stopScroll);
    wrapper.addEventListener('wheel', stopScroll, { passive: true });

    // Iniciar solo cuando el usuario vea la sección
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        setTimeout(startScroll, 2000);
      }
    }, { threshold: 0.3 });
    obs.observe(wrapper);
  }
}

/* ── Gold Floating Particles in Hero ──────────────────────────── */

function initHeroParticles() {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var count = 20;
  for (var i = 0; i < count; i++) {
    var particle = document.createElement('div');
    particle.className = 'hero-particle';

    var size = 2 + Math.random() * 3;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.bottom = -(Math.random() * 20) + '%';

    var duration = 6 + Math.random() * 8;
    var delay = Math.random() * duration;
    var drift = (Math.random() - 0.5) * 80;
    var maxOpacity = 0.2 + Math.random() * 0.35;

    particle.style.setProperty('--duration', duration + 's');
    particle.style.setProperty('--delay', '-' + delay + 's');
    particle.style.setProperty('--drift', drift + 'px');
    particle.style.setProperty('--max-opacity', maxOpacity);

    hero.appendChild(particle);
  }
}

/* ── Parallax on Hero Background ─────────────────────────────── */

function initHeroParallax() {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        var scrollY = window.scrollY;
        var heroH = hero.offsetHeight;
        if (scrollY <= heroH) {
          var offset = scrollY * 0.3;
          hero.style.backgroundPositionY = 'calc(50% + ' + offset + 'px)';
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ── 3D Tilt Effect on Cards ─────────────────────────────────── */

function initCardTilt() {
  var container = document.getElementById('catalogo');
  if (!container) return;

  container.addEventListener('mousemove', function(e) {
    var card = e.target.closest('.card');
    if (!card) return;

    var rect = card.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width;
    var y = (e.clientY - rect.top) / rect.height;

    var tiltX = (0.5 - y) * 16;
    var tiltY = (x - 0.5) * 16;

    card.classList.add('tilt-active');
    card.style.transform = 'perspective(600px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(1.02)';

    var glare = card.querySelector('.tilt-glare');
    if (glare) {
      glare.style.background = 'radial-gradient(circle at ' + (x * 100) + '% ' + (y * 100) + '%, rgba(255,255,255,0.15), transparent 60%)';
    }
  });

  container.addEventListener('mouseleave', function(e) {
    var card = e.target.closest('.card');
    if (card) _resetCardTilt(card);
  }, true);

  container.addEventListener('mouseout', function(e) {
    var card = e.target.closest('.card');
    var related = e.relatedTarget;
    if (card && (!related || !card.contains(related))) {
      _resetCardTilt(card);
    }
  });
}

function _resetCardTilt(card) {
  card.classList.remove('tilt-active');
  card.style.transition = 'transform .4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow .4s ease, border-color .4s ease';
  card.style.transform = '';
  setTimeout(function() {
    card.style.transition = '';
  }, 400);
}

/* ── Inject tilt-glare overlay into cards ─────────────────────── */

function _injectGlareOverlays() {
  var cards = document.querySelectorAll('.card:not(.glare-injected)');
  cards.forEach(function(card) {
    var glare = document.createElement('div');
    glare.className = 'tilt-glare';
    card.appendChild(glare);
    card.classList.add('glare-injected');
  });
}

function initGlareObserver() {
  var catalogo = document.getElementById('catalogo');
  if (!catalogo) return;

  _injectGlareOverlays();

  var observer = new MutationObserver(function() {
    _injectGlareOverlays();
  });
  observer.observe(catalogo, { childList: true, subtree: true });
}

/* ── Custom Droplet Cursor (Global) ──────────────────────────── */

function initCustomCursor() {
  // No activar en touch/mobile
  if ('ontouchstart' in window) return;

  var cursor = document.createElement('div');
  cursor.id = 'custom-cursor';
  cursor.innerHTML = '<div class="droplet"></div>';
  document.body.appendChild(cursor);

  var mouseX = 0, mouseY = 0;
  var curX = 0, curY = 0;

  function updateCursor() {
    curX += (mouseX - curX) * 0.15;
    curY += (mouseY - curY) * 0.15;
    cursor.style.left = curX + 'px';
    cursor.style.top = curY + 'px';
    requestAnimationFrame(updateCursor);
  }

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Ocultar cursor global
  document.body.classList.add('custom-cursor-active');
  cursor.classList.add('visible');
  curX = mouseX;
  curY = mouseY;
  requestAnimationFrame(updateCursor);
}

/* ── Magnetic Buttons ────────────────────────────────────────── */

function initMagneticButtons() {
  if ('ontouchstart' in window) return;

  var selectors = '.btn, .full-btn, .small-btn, .filter-pill, .cart-btn, .scroll-top-btn, .cerrarX, .qty-btn';

  document.addEventListener('mousemove', function(e) {
    var btns = document.querySelectorAll(selectors);
    btns.forEach(function(btn) {
      var rect = btn.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;

      var distX = e.clientX - cx;
      var distY = e.clientY - cy;
      var dist = Math.sqrt(distX * distX + distY * distY);

      var radius = Math.max(rect.width, rect.height) * 0.5;

      if (dist < radius) {
        var pull = 1 - (dist / radius);
        var moveX = distX * pull * 0.3;
        var moveY = distY * pull * 0.3;
        btn.style.transform = 'translate(' + moveX + 'px,' + moveY + 'px)';
        btn.style.transition = 'transform .2s ease';
      } else {
        if (btn.style.transform && btn.style.transform.indexOf('translate') !== -1) {
          btn.style.transform = '';
          btn.style.transition = 'transform .4s cubic-bezier(.25,.46,.45,.94)';
        }
      }
    });
  });
}

/* ── Count-Up Animation ──────────────────────────────────────── */

function initCountUp() {
  var counters = document.querySelectorAll('.count-up');
  if (!counters.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;

      var el = entry.target;
      var target = Number(el.dataset.target);
      var duration = 1500;
      var start = 0;
      var startTime = null;

      function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = target;
        }
      }

      requestAnimationFrame(animate);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(function(c) {
    observer.observe(c);
  });
}

/* ── Scroll to Top Button ────────────────────────────────────── */

function initAnnouncementBar() {
  var bar = document.querySelector('.announcement-bar');
  if (!bar) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 80) {
      bar.classList.add('hidden');
    } else {
      bar.classList.remove('hidden');
    }
  });
}

/* ── Scroll Reveal on Cards & House Titles ────────────────────── */

function initScrollReveal() {
  var catalogo = document.getElementById('catalogo');
  if (!catalogo) return;

  function revealElements() {
    var cards = catalogo.querySelectorAll('.card:not(.revealed)');
    var titles = catalogo.querySelectorAll('.house-title:not(.revealed)');
    var elements = [];

    titles.forEach(function(t) { elements.push(t); });
    cards.forEach(function(c) { elements.push(c); });

    if (!elements.length) return;

    var observer = new IntersectionObserver(function(entries) {
      // Group entries that are intersecting
      var visible = [];
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          visible.push(entry.target);
          observer.unobserve(entry.target);
        }
      });

      // Stagger delay within each batch
      visible.forEach(function(el, i) {
        el.style.setProperty('--delay', (i * 0.07) + 's');
        el.classList.add('revealed');
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    elements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // Run initially and also watch for DOM changes (search/filter re-renders)
  revealElements();

  var mo = new MutationObserver(function() {
    revealElements();
  });
  mo.observe(catalogo, { childList: true, subtree: true });
}

/* ── Easter Egg — "smell" Keyboard Sequence ───────────────────── */

function initEasterEgg() {
  var sequence = 'smell';
  var buffer = '';

  document.addEventListener('keydown', function(e) {
    // Ignore if user is typing in an input or textarea
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    buffer += e.key.toLowerCase();

    // Keep only the last N characters
    if (buffer.length > sequence.length) {
      buffer = buffer.slice(-sequence.length);
    }

    if (buffer === sequence) {
      buffer = '';
      _triggerDropletRain();
    }
  });
}

function _triggerDropletRain() {
  var count = 25;
  var container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '10000';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  for (var i = 0; i < count; i++) {
    var drop = document.createElement('div');
    drop.className = 'ee-droplet';

    var left = Math.random() * 100;
    var delay = Math.random() * 1.2;
    var duration = 2 + Math.random() * 1.5;
    var sway = (Math.random() - 0.5) * 80;
    var rotate = (Math.random() - 0.5) * 120;

    drop.style.left = left + '%';
    drop.style.setProperty('--ee-delay', delay + 's');
    drop.style.setProperty('--fall-duration', duration + 's');
    drop.style.setProperty('--ee-sway', sway + 'px');
    drop.style.setProperty('--ee-rotate', rotate + 'deg');

    container.appendChild(drop);
  }

  // Clean up after animations finish
  var maxTime = (1.2 + 3.5) * 1000; // max delay + max duration
  setTimeout(function() {
    container.remove();
  }, maxTime);
}

/* ── Typewriter Effect on Hero Subtitle ────────────────────── */

function initTypewriter() {
  var el = document.querySelector('.hero p.cinematic-reveal');
  if (!el) return;

  var fullText = el.textContent.trim();

  // Wait for cinematic animation to finish (delay 0.5s + ~0.7s animation)
  setTimeout(function() {
    el.textContent = '';

    // Add blinking cursor
    var cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.textContent = '|';
    el.appendChild(cursor);

    var index = 0;

    function typeChar() {
      if (index < fullText.length) {
        // Insert character before cursor
        var textNode = document.createTextNode(fullText.charAt(index));
        el.insertBefore(textNode, cursor);
        index++;
        setTimeout(typeChar, 40);
      } else {
        // Typing done — blink cursor briefly then remove
        setTimeout(function() {
          cursor.remove();
        }, 1500);
      }
    }

    typeChar();
  }, 1200);
}

/* ── Shake to Reveal Easter Egg (Mobile) ──────────────────── */

function initShakeDetect() {
  if (!('ontouchstart' in window)) return;

  var lastTrigger = 0;
  var cooldown = 3000;
  var threshold = 15;
  var lastX = null, lastY = null, lastZ = null;

  function handleMotion(e) {
    var acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc || acc.x === null) return;

    if (lastX !== null) {
      var deltaX = Math.abs(acc.x - lastX);
      var deltaY = Math.abs(acc.y - lastY);
      var deltaZ = Math.abs(acc.z - lastZ);
      var total = deltaX + deltaY + deltaZ;

      if (total > threshold) {
        var now = Date.now();
        if (now - lastTrigger > cooldown) {
          lastTrigger = now;
          _triggerDropletRain();
        }
      }
    }

    lastX = acc.x;
    lastY = acc.y;
    lastZ = acc.z;
  }

  function startListening() {
    window.addEventListener('devicemotion', handleMotion);
  }

  // iOS 13+ requires permission
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    document.addEventListener('touchstart', function reqPerm() {
      DeviceMotionEvent.requestPermission()
        .then(function(state) {
          if (state === 'granted') startListening();
        })
        .catch(function() {});
      document.removeEventListener('touchstart', reqPerm);
    }, { once: true });
  } else if (typeof DeviceMotionEvent !== 'undefined') {
    startListening();
  }
}

function initScrollTop() {
  var btn = document.getElementById('btnScrollTop');
  if (!btn) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 600) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', function() {
    // Primero bajar un poco para "tomar impulso"
    var currentY = window.scrollY;
    var impulso = Math.min(80, currentY * 0.08);

    window.scrollTo({ top: currentY + impulso, behavior: 'smooth' });

    // Después de bajar, subir al top
    setTimeout(function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Rebote elástico al llegar arriba
      var onScroll = function() {
        if (window.scrollY === 0) {
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
