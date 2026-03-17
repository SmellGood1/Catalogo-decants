let marcaSeleccionada = '';
var _filtrosListenerReady = false;

function renderBotoneraFiltros(filtroTexto, skipRebuild) {
  var filtrosContainer = document.getElementById('filtros-marcas');
  if (!filtrosContainer) return;

  if (!skipRebuild) {
    var marcas = Object.keys(PERFUMES);

    var htmlFiltros = '<button class="filter-pill ' + (marcaSeleccionada === '' ? 'active' : '') + '" data-marca="">Todas</button>';

    marcas.forEach(function(marca) {
      var isActive = (marcaSeleccionada === marca) ? 'active' : '';
      htmlFiltros += '<button class="filter-pill ' + isActive + '" data-marca="' + marca + '">' + marca + '</button>';
    });

    filtrosContainer.innerHTML = htmlFiltros;
  } else {
    // Solo actualizar clases active sin reconstruir
    var pills = filtrosContainer.querySelectorAll('.filter-pill');
    pills.forEach(function(p) {
      var marca = p.getAttribute('data-marca');
      if (marca === marcaSeleccionada) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  // Listener solo una vez con delegation
  if (!_filtrosListenerReady) {
    _filtrosListenerReady = true;
    filtrosContainer.addEventListener('click', function(e) {
      var pill = e.target.closest('.filter-pill');
      if (!pill) return;

      // Crear ripple desde el punto de click
      var rect = pill.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      pill.appendChild(ripple);

      ripple.addEventListener('animationend', function() {
        ripple.remove();
      });

      marcaSeleccionada = pill.getAttribute('data-marca');
      // Actualizar clases sin destruir el DOM
      renderBotoneraFiltros('', true);
      // Actualizar solo el grid del catálogo (sin reconstruir filtros)
      var ft = document.getElementById('buscador') ? document.getElementById('buscador').value : '';
      _renderCatalogoGrid(ft);
    });
  }
}

function renderCatalogo(filtroTexto) {
  filtroTexto = filtroTexto || '';
  renderBotoneraFiltros(filtroTexto);
  _renderCatalogoGrid(filtroTexto);
}

function _renderCatalogoGrid(filtroTexto) {
  filtroTexto = filtroTexto || '';
  var catalogo = document.getElementById('catalogo');
  catalogo.innerHTML = '';

  var cardIndex = 0;

  for (var casa in PERFUMES) {
    if (marcaSeleccionada && casa !== marcaSeleccionada) {
      continue;
    }

    var perfumesFiltrados = PERFUMES[casa].filter(function(p) {
      var f = filtroTexto.toLowerCase();
      return p.name.toLowerCase().indexOf(f) !== -1 ||
             casa.toLowerCase().indexOf(f) !== -1 ||
             p.conc.toLowerCase().indexOf(f) !== -1;
    });

    if (!perfumesFiltrados.length) continue;

    var houseTitle = document.createElement('div');
    houseTitle.className = 'house-title';
    houseTitle.style.setProperty('--delay', (cardIndex * 0.06) + 's');
    houseTitle.innerHTML =
      '<h3>' + casa + '</h3>' +
      '<div class="house-line"></div>';
    catalogo.appendChild(houseTitle);
    cardIndex++;

    var grid = document.createElement('div');
    grid.className = 'grid';

    perfumesFiltrados.forEach(function(p, i) {
      var card = document.createElement('article');
      card.className = p.proximo ? 'card proximo' : 'card';
      card.style.setProperty('--delay', ((cardIndex + i) * 0.06) + 's');
      card.innerHTML =
        '<div class="card-top">' +
          (p.proximo
            ? '<div class="soon-label">Próximamente</div>'
            : '<span class="pill">' + p.conc + '</span>') +
        '</div>' +
        '<div class="card-img-wrap">' +
          '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
        '</div>' +
        '<div class="card-content">' +
          '<h4>' + p.name + '</h4>' +
          '<div class="brand">' + casa + '</div>' +
          '<div class="bottom">' +
            (p.proximo
              ? '<a href="' + p.link + '" target="_blank" rel="noopener" class="small-btn fragrantica-card-link">Conoce más en Fragrantica</a>'
              : '<div class="starting">' +
                  '<span>Desde</span>' +
                  '<strong>$' + p.prices[2] + '</strong>' +
                '</div>' +
                '<button class="small-btn">Ver</button>') +
          '</div>' +
        '</div>';

      card.addEventListener('click', (function(perfume, casaNombre) {
        return function(e) {
          if (perfume.proximo) return;
          if (e.target.closest('a')) return;
          var perfumeConCasa = {};
          for (var key in perfume) { perfumeConCasa[key] = perfume[key]; }
          perfumeConCasa.casa = casaNombre;
          verPerfume(perfumeConCasa);
        };
      })(p, casa));

      grid.appendChild(card);
    });

    cardIndex += perfumesFiltrados.length;
    catalogo.appendChild(grid);
  }
}
