function renderCatalogo(filtro) {
  filtro = filtro || '';
  var catalogo = document.getElementById('catalogo');
  catalogo.innerHTML = '';

  for (var casa in PERFUMES) {
    var perfumesFiltrados = PERFUMES[casa].filter(function(p) {
      var f = filtro.toLowerCase();
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
          '<span class="pill">' + p.conc + '</span>' +
          (p.proximo ? '<div class="soon-label">Próximamente</div>' : '') +
        '</div>' +
        '<div class="card-img-wrap">' +
          '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
        '</div>' +
        '<div class="card-content">' +
          '<h4>' + p.name + '</h4>' +
          '<div class="brand">' + casa + '</div>' +
          '<div class="bottom">' +
            '<div class="starting">' +
              '<span>Desde</span>' +
              '<strong>$' + p.price + '/ml</strong>' +
            '</div>' +
            '<button class="small-btn">Ver</button>' +
          '</div>' +
        '</div>';

      card.onclick = (function(perfume, casaNombre) {
        return function() {
          if (perfume.proximo) return;
          var perfumeConCasa = {};
          for (var key in perfume) { perfumeConCasa[key] = perfume[key]; }
          perfumeConCasa.casa = casaNombre;
          verPerfume(perfumeConCasa);
        };
      })(p, casa);

      grid.appendChild(card);
    });

    catalogo.appendChild(grid);
  }
}
