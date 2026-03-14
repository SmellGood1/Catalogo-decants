/*
 * extras.js — Destacados, contadores animados, botón scroll-top
 */

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

  // Si no hay destacados marcados, no mostrar la sección
  if (!destacados.length) {
    var section = container.closest('.destacados-section');
    if (section) section.style.display = 'none';
    return;
  }

  container.innerHTML = '';

  destacados.forEach(function(item) {
    var p = item.perfume;
    var casa = item.casa;

    var card = document.createElement('article');
    card.className = 'destacado-card';
    card.innerHTML =
      '<div class="destacado-badge">Popular</div>' +
      '<div class="card-img-wrap">' +
        '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
      '</div>' +
      '<h4>' + p.name + '</h4>' +
      '<div class="brand">' + casa + '</div>' +
      '<div class="starting">' +
        '<span>Desde</span>' +
        '<strong>$' + p.prices[2] + '</strong>' +
      '</div>';

    card.addEventListener('click', (function(perfume, casaNombre) {
      return function() {
        var perfumeConCasa = {};
        for (var key in perfume) { perfumeConCasa[key] = perfume[key]; }
        perfumeConCasa.casa = casaNombre;
        verPerfume(perfumeConCasa);
      };
    })(p, casa));

    container.appendChild(card);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
