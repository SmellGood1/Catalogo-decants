let marcaSeleccionada = '';

function renderBotoneraFiltros(filtroTexto) {
  var filtrosContainer = document.getElementById('filtros-marcas');
  if (!filtrosContainer) return;

  var marcas = Object.keys(PERFUMES);
  
  var htmlFiltros = '<button class="filter-pill ' + (marcaSeleccionada === '' ? 'active' : '') + '" data-marca="">Todas</button>';
  
  marcas.forEach(function(marca) {
    var isActive = (marcaSeleccionada === marca) ? 'active' : '';
    htmlFiltros += '<button class="filter-pill ' + isActive + '" data-marca="' + marca + '">' + marca + '</button>';
  });

  filtrosContainer.innerHTML = htmlFiltros;

  // Delegation para los pills
  filtrosContainer.onclick = function(e) {
    if (e.target.classList.contains('filter-pill')) {
      marcaSeleccionada = e.target.getAttribute('data-marca');
      renderCatalogo(filtroTexto);
    }
  };
}

function renderCatalogo(filtroTexto) {
  filtroTexto = filtroTexto || '';
  renderBotoneraFiltros(filtroTexto);

  var catalogo = document.getElementById('catalogo');
  catalogo.innerHTML = '';

  for (var casa in PERFUMES) {
    if (marcaSeleccionada && casa !== marcaSeleccionada) {
      continue; // Saltar si hay filtro de marca y no coincide
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
    houseTitle.innerHTML =
      '<h3>' + casa + '</h3>' +
      '<div class="house-line"></div>';
    catalogo.appendChild(houseTitle);

    var grid = document.createElement('div');
    grid.className = 'grid';

    perfumesFiltrados.forEach(function(p) {
      var card = document.createElement('article');
      card.className = p.proximo ? 'card proximo' : 'card';
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

    catalogo.appendChild(grid);
  }
}
