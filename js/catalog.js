/*
 * catalog.js — Render del catálogo de decants y lógica de búsqueda.
 * Datos externos (Google Sheets) siempre se insertan vía textContent o dataset,
 * nunca por innerHTML con interpolación — prevención de XSS.
 */
(function (SG) {
  'use strict';

  var el = SG.el, $ = SG.$, byId = SG.byId;

  var marcaSeleccionada = '';
  var _filtrosListenerReady = false;

  /* ── Búsqueda fuzzy ──────────────────────────────────────────── */

  function _norm(s) {
    return s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/(.)\1+/g, '$1');
  }

  function _lev(a, b) {
    var m = a.length, n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = [i];
      for (var j = 1; j <= n; j++) {
        dp[i][j] = i === 0 ? j :
          Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
          );
      }
    }
    return dp[m][n];
  }

  function _fuzzyMatch(texto, busqueda) {
    if (!busqueda) return true;
    var t = texto.toLowerCase();
    var b = busqueda.toLowerCase();
    if (t.indexOf(b) !== -1) return true;

    var tn = _norm(texto);
    var bn = _norm(busqueda);
    if (tn.indexOf(bn) !== -1) return true;

    if (bn.length >= 3) {
      var palabras = tn.split(/\s+/);
      var umbral = bn.length <= 4 ? 1 : Math.min(Math.floor(bn.length / 2), 3);
      for (var i = 0; i < palabras.length; i++) {
        if (_lev(palabras[i], bn) <= umbral) return true;
        if (palabras[i].length > bn.length) {
          for (var j = 0; j <= palabras[i].length - bn.length; j++) {
            if (_lev(palabras[i].substring(j, j + bn.length), bn) <= 1) return true;
          }
        }
      }
      if (_lev(tn.replace(/\s+/g, ''), bn) <= umbral) return true;
    }
    return false;
  }

  /* ── Construcción segura de cards ─────────────────────────────── */

  function cardClass(p) {
    if (p.proximo) return 'card proximo' + (p.muyPronto ? ' muy-pronto' : '');
    if (p.agotado) return 'card agotado';
    return 'card';
  }

  function buildTopContent(p) {
    if (p.agotado) return el('div', { class: 'agotado-label', text: 'Agotado' });
    if (p.proximo) {
      return el('div', {
        class: 'soon-label' + (p.muyPronto ? ' muy-pronto-label' : ''),
        text: p.muyPronto ? '¡Muy pronto!' : 'Próximamente'
      });
    }
    return el('span', { class: 'pill', text: p.conc || '' });
  }

  function buildBottomContent(p) {
    if (p.agotado) {
      var frag = document.createDocumentFragment();
      frag.appendChild(el('div', { class: 'starting' }, [ el('span', { text: 'Agotado' }) ]));
      if (p.link) {
        frag.appendChild(el('a', {
          href: p.link, target: '_blank', rel: 'noopener noreferrer',
          class: 'small-btn agotado-link', text: 'Fragrantica'
        }));
      }
      return frag;
    }
    if (p.proximo) {
      if (!p.link) return document.createDocumentFragment();
      return el('a', {
        href: p.link, target: '_blank', rel: 'noopener noreferrer',
        class: 'small-btn fragrantica-card-link', text: 'Conoce más en Fragrantica'
      });
    }
    var f = document.createDocumentFragment();
    f.appendChild(el('div', { class: 'starting' }, [
      el('span', { text: 'Desde' }),
      el('strong', { text: '$' + p.prices[2] })
    ]));
    f.appendChild(el('button', { class: 'small-btn', type: 'button', text: 'Ver' }));
    return f;
  }

  function buildImage(p) {
    var img = el('img', {
      src: p.img || 'assets/favicon.svg',
      alt: p.name || '',
      loading: 'lazy'
    });
    img.addEventListener('error', function () {
      img.style.opacity = '0.3';
      img.src = 'assets/favicon.svg';
    }, { once: true });
    return img;
  }

  function buildCard(p, casa, delayIndex) {
    var card = el('article', { class: cardClass(p) });
    card.style.setProperty('--delay', (delayIndex * 0.06) + 's');

    var top     = el('div', { class: 'card-top' }, [ buildTopContent(p) ]);
    var imgWrap = el('div', { class: 'card-img-wrap' }, [ buildImage(p) ]);
    var content = el('div', { class: 'card-content' }, [
      el('h4',   { text: p.name }),
      el('div',  { class: 'brand', text: casa }),
      el('div',  { class: 'bottom' }, [ buildBottomContent(p) ])
    ]);

    card.appendChild(top);
    card.appendChild(imgWrap);
    card.appendChild(content);

    card.addEventListener('click', function (e) {
      if (p.proximo || p.agotado) return;
      if (e.target.closest('a')) return;
      var perfumeConCasa = {};
      for (var k in p) { if (Object.prototype.hasOwnProperty.call(p, k)) perfumeConCasa[k] = p[k]; }
      perfumeConCasa.casa = casa;
      verPerfume(perfumeConCasa);
    });

    return card;
  }

  function buildHouseTitle(casa, delayIndex) {
    var title = el('div', { class: 'house-title' }, [
      el('h3', { text: casa }),
      el('div', { class: 'house-line' })
    ]);
    title.style.setProperty('--delay', (delayIndex * 0.06) + 's');
    return title;
  }

  /* ── Filtros ──────────────────────────────────────────────────── */

  function renderBotoneraFiltros(skipRebuild) {
    var container = byId('filtros-marcas');
    if (!container) return;

    if (!skipRebuild) {
      container.textContent = '';
      container.appendChild(el('button', {
        class: 'filter-pill' + (marcaSeleccionada === '' ? ' active' : ''),
        type: 'button', dataset: { marca: '' }, text: 'Todas'
      }));
      Object.keys(window.PERFUMES || {}).forEach(function (marca) {
        container.appendChild(el('button', {
          class: 'filter-pill' + (marcaSeleccionada === marca ? ' active' : ''),
          type: 'button', dataset: { marca: marca }, text: marca
        }));
      });
    } else {
      SG.$$('.filter-pill', container).forEach(function (p) {
        p.classList.toggle('active', p.dataset.marca === marcaSeleccionada);
      });
    }

    if (!_filtrosListenerReady) {
      _filtrosListenerReady = true;
      container.addEventListener('click', function (e) {
        var pill = e.target.closest('.filter-pill');
        if (!pill) return;

        var rect = pill.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var ripple = el('span', { class: 'ripple' });
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
        pill.appendChild(ripple);
        ripple.addEventListener('animationend', function () { ripple.remove(); });

        marcaSeleccionada = pill.dataset.marca || '';
        renderBotoneraFiltros(true);
        var input = byId('buscador');
        _renderCatalogoGrid(input ? input.value : '');
      });
    }
  }

  /* ── Grid ─────────────────────────────────────────────────────── */

  function _renderCatalogoGrid(filtroTexto) {
    filtroTexto = filtroTexto || '';
    var catalogo = byId('catalogo');
    if (!catalogo) return;
    catalogo.textContent = '';

    var perfumes = window.PERFUMES || {};
    var cardIndex = 0;

    Object.keys(perfumes).forEach(function (casa) {
      if (marcaSeleccionada && casa !== marcaSeleccionada) return;
      var list = perfumes[casa].filter(function (p) {
        return _fuzzyMatch(p.name, filtroTexto) ||
               _fuzzyMatch(casa, filtroTexto) ||
               _fuzzyMatch(p.conc || '', filtroTexto);
      });
      if (!list.length) return;

      catalogo.appendChild(buildHouseTitle(casa, cardIndex));
      cardIndex++;

      var grid = el('div', { class: 'grid' });
      list.forEach(function (p, i) {
        grid.appendChild(buildCard(p, casa, cardIndex + i));
      });
      cardIndex += list.length;
      catalogo.appendChild(grid);
    });
  }

  function renderCatalogo(filtroTexto) {
    filtroTexto = filtroTexto || '';
    renderBotoneraFiltros(false);
    _renderCatalogoGrid(filtroTexto);
  }

  // Exponer solo lo público
  window.renderCatalogo = renderCatalogo;
})(window.SG);
