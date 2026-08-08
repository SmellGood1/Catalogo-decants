/*
 * recomendador.js — Wizard de 6 preguntas + motor de puntuación local.
 *
 * Sin IA ni servicios externos: todo son etiquetas y sumas (ver
 * recommendationProfiles.js). Reutiliza verPerfume/addCarrito/toggleCarrito/
 * enviarPedido tal cual existen hoy (modal.js, cart.js, whatsapp.js) — esta
 * página no reimplementa el carrito, solo trae su propia carcasa de UI
 * (mismos IDs que index.html) para que esas funciones operen sin cambios.
 */
(function (SG) {
  'use strict';

  var el = SG.el, byId = SG.byId, $ = SG.$, $$ = SG.$$;

  /* ── Preguntas ───────────────────────────────────────────────── */

  var QUESTIONS = [
    {
      id: 'ocasion',
      title: '¿Para qué ocasión buscas perfume?',
      options: [
        { id: 'diario',    label: 'Uso diario' },
        { id: 'cita',      label: 'Cita o salida' },
        { id: 'oficina',   label: 'Oficina o escuela' },
        { id: 'fiesta',    label: 'Fiesta o evento' },
        { id: 'artistico', label: 'Quiero probar algo artístico' }
      ]
    },
    {
      id: 'aroma',
      title: '¿Qué clase de aroma te atrae más?',
      options: [
        { id: 'fresco_limpio',   label: 'Fresco y limpio' },
        { id: 'dulce',           label: 'Dulce y delicioso' },
        { id: 'elegante_calido', label: 'Elegante y cálido' },
        { id: 'frutal',          label: 'Frutal y llamativo' },
        { id: 'oscuro',          label: 'Oscuro y diferente' }
      ]
    },
    {
      id: 'intensidad',
      title: '¿Qué intensidad prefieres?',
      options: [
        { id: 'discreta',    label: 'Discreta' },
        { id: 'equilibrada', label: 'Equilibrada' },
        { id: 'notable',     label: 'Que se note' },
        { id: 'huella',      label: 'Quiero dejar huella' }
      ]
    },
    {
      id: 'clima',
      title: '¿Dónde lo usarás principalmente?',
      options: [
        { id: 'calido',     label: 'Clima caliente' },
        { id: 'fresco',     label: 'Clima fresco' },
        { id: 'ac',         label: 'Lugares con aire acondicionado' },
        { id: 'noche',      label: 'De noche' },
        { id: 'cualquiera', label: 'En cualquier momento' }
      ]
    },
    {
      id: 'objetivo',
      title: '¿Qué deseas provocar con tu perfume?',
      options: [
        { id: 'fresco_limpio', label: 'Sentirme fresco y limpio' },
        { id: 'cumplidos',     label: 'Recibir cumplidos' },
        { id: 'elegante',      label: 'Sentirme elegante' },
        { id: 'irresistible',  label: 'Oler irresistible' },
        { id: 'sorprender',    label: 'Sorprender con algo diferente' }
      ]
    },
    {
      id: 'presupuesto',
      title: '¿Cuánto deseas gastar para probarlo?',
      options: [
        { id: 'bajo',       label: 'Menos de $100 MXN' },
        { id: 'medio',      label: 'Entre $100 y $200 MXN' },
        { id: 'alto',       label: 'Entre $200 y $350 MXN' },
        { id: 'sin_limite', label: 'El precio no es lo principal' }
      ]
    }
  ];

  /* ── Motor de puntuación ─────────────────────────────────────── */
  /* Cada pregunta aporta puntos acotados (máx. ~10-12 por componente);
   * el resultado final es la SUMA de las 6 respuestas, no una sola. */

  var FAMILIA_BOOST = {
    ocasion: {
      diario:    { fresco: 3, citrico: 2 },
      cita:      { dulce: 2, floral: 2, ambarado: 2 },
      oficina:   { clasico_elegante: 3, fresco: 1 },
      fiesta:    { frutal: 2, dulce: 1, goloso: 2 },
      artistico: { artistico_nicho: 4, oud: 2, incienso: 2 }
    },
    aroma: {
      fresco_limpio:   { fresco: 4, acuatico: 3, citrico: 3 },
      dulce:           { gourmand: 4, dulce: 3, goloso: 2 },
      elegante_calido: { especiado: 3, ambarado: 3, cuero: 2, clasico_elegante: 2 },
      frutal:          { frutal: 4, goloso: 1 },
      oscuro:          { incienso: 3, oud: 3, artistico_nicho: 3 }
    },
    clima: {
      calido:     { fresco: 3, frutal: 2, citrico: 2 },
      fresco:     { dulce: 2, especiado: 2, ambarado: 2, gourmand: 1 },
      ac:         { clasico_elegante: 2, fresco: 1 },
      noche:      { ambarado: 2, oud: 2, especiado: 1 },
      cualquiera: { clasico_elegante: 1 }
    },
    objetivo: {
      fresco_limpio: { fresco: 3, acuatico: 1 },
      cumplidos:     { clasico_elegante: 1, dulce: 1 },
      elegante:      { clasico_elegante: 3, ambarado: 2 },
      irresistible:  { dulce: 2, floral: 1, ambarado: 1, gourmand: 1 },
      sorprender:    { artistico_nicho: 4, oud: 1, incienso: 1 }
    }
  };

  var ORIGINALIDAD_DELTA = {
    ocasion:  { diario: -1, cita: 0, oficina: -1, fiesta: 1, artistico: 3 },
    aroma:    { fresco_limpio: -1, dulce: 0, elegante_calido: 0, frutal: 0, oscuro: 2 },
    objetivo: { fresco_limpio: -1, cumplidos: 0, elegante: 0, irresistible: 0, sorprender: 3 }
  };

  var INTENSIDAD_TARGET = { discreta: 1, equilibrada: 2, notable: 3, huella: 4 };
  var BUDGET_MAX = { bajo: 100, medio: 200, alto: 350 };

  function familiaBoost(profile, table) {
    if (!table) return 0;
    var total = 0;
    for (var tag in table) {
      if (Object.prototype.hasOwnProperty.call(table, tag) && profile.familias.indexOf(tag) !== -1) {
        total += table[tag];
      }
    }
    return Math.min(total, 12);
  }

  function bestPrice(perfume) {
    return perfume ? SG.cheapestPrice(perfume.prices) : null;
  }

  // Excluye lo que hoy no se puede vender: sin precio, agotado o "próximo".
  function isEligible(perfume) {
    if (!perfume || perfume.agotado || perfume.proximo) return false;
    return bestPrice(perfume) !== null;
  }

  function scorePerfume(perfume, profile, answers) {
    if (!profile) return 0; // sin etiquetas: no se prioriza, pero tampoco rompe nada

    var score = 0;
    var originalidadPref = 2.5; // punto neutro en escala 1..5

    if (profile.ocasiones.indexOf(answers.ocasion) !== -1) score += 10;
    score += familiaBoost(profile, FAMILIA_BOOST.ocasion[answers.ocasion]);
    originalidadPref += ORIGINALIDAD_DELTA.ocasion[answers.ocasion] || 0;

    score += familiaBoost(profile, FAMILIA_BOOST.aroma[answers.aroma]);
    originalidadPref += ORIGINALIDAD_DELTA.aroma[answers.aroma] || 0;

    var targetIntensidad = INTENSIDAD_TARGET[answers.intensidad] || 2;
    score += Math.max(0, 12 - Math.abs(profile.intensidad - targetIntensidad) * 4);

    if (profile.clima.indexOf(answers.clima) !== -1) score += 10;
    score += familiaBoost(profile, FAMILIA_BOOST.clima[answers.clima]);

    if (profile.objetivos.indexOf(answers.objetivo) !== -1) score += 10;
    score += familiaBoost(profile, FAMILIA_BOOST.objetivo[answers.objetivo]);
    originalidadPref += ORIGINALIDAD_DELTA.objetivo[answers.objetivo] || 0;
    if (answers.objetivo === 'cumplidos') {
      if (perfume.destacado) score += 5;
      if (perfume.ranking > 0) score += Math.max(0, 6 - (perfume.ranking - 1) * 0.6);
    }

    var clampedPref = Math.max(1, Math.min(5, originalidadPref));
    score += Math.max(0, 12 - Math.abs(profile.originalidad - clampedPref) * 3);

    var price = bestPrice(perfume);
    if (price !== null) {
      if (answers.presupuesto === 'sin_limite') {
        score += 5;
      } else {
        var max = BUDGET_MAX[answers.presupuesto];
        score += price <= max ? 12 : Math.max(0, 12 - (price - max) / 8);
      }
    }

    return score;
  }

  function buildCandidates(answers) {
    var perfumes = window.PERFUMES || {};
    var list = [];
    Object.keys(perfumes).forEach(function (casa) {
      (perfumes[casa] || []).forEach(function (p) {
        if (!isEligible(p)) return;
        var profile = SG.recoProfiles ? SG.recoProfiles.get(p.codigo) : null;
        // Filtro duro: un perfil puede vetarse a sí mismo para ciertos climas
        // (ej. algo de invierno que no debe salir si piden "Clima caliente"),
        // sin importar qué tan bien puntúe en todo lo demás.
        if (profile && profile.climaExcluido && profile.climaExcluido.indexOf(answers.clima) !== -1) return;
        var withCasa = {};
        for (var k in p) { if (Object.prototype.hasOwnProperty.call(p, k)) withCasa[k] = p[k]; }
        withCasa.casa = casa;
        withCasa._profile = profile;
        withCasa._score = scorePerfume(withCasa, profile, answers);
        list.push(withCasa);
      });
    });
    list.sort(function (a, b) { return b._score - a._score; });
    return list;
  }

  // "Mejor coincidencia" + "alternativa accesible" (precio de 2 ml menor,
  // cuando exista una opción adecuada) + "opción más atrevida" (compatible,
  // pero con más originalidad/intensidad). Nunca repite el mismo perfume.
  function pickResults(candidates) {
    if (!candidates.length) return [];
    var best = candidates[0];
    var results = [best];

    var bestPriceVal = bestPrice(best);
    var accesible = null;
    for (var i = 1; i < candidates.length; i++) {
      var c = candidates[i];
      var cPrice = bestPrice(c);
      if (bestPriceVal !== null && cPrice !== null && cPrice < bestPriceVal) {
        accesible = c;
        break;
      }
    }
    if (!accesible) {
      accesible = candidates.find(function (c) { return c !== best; }) || null;
    }
    if (accesible) results.push(accesible);

    var minScore = best._score * 0.35;
    var atrevida = null, atrevidaRank = -1;
    candidates.forEach(function (c) {
      if (results.indexOf(c) !== -1) return;
      if (c._score < minScore) return;
      var originalidad = (c._profile && c._profile.originalidad) || 1;
      var intensidad = (c._profile && c._profile.intensidad) || 1;
      var rank = originalidad * 10 + intensidad;
      if (rank > atrevidaRank) { atrevidaRank = rank; atrevida = c; }
    });
    if (!atrevida) {
      atrevida = candidates.find(function (c) { return results.indexOf(c) === -1; }) || null;
    }
    if (atrevida) results.push(atrevida);

    return results;
  }

  /* ── Explicaciones personalizadas ────────────────────────────── */

  var OCASION_FRASE = {
    diario: 'tu día a día', cita: 'una cita o salida', oficina: 'la oficina o la escuela',
    fiesta: 'una fiesta o evento', artistico: 'algo fuera de lo común'
  };
  var AROMA_ADJ = {
    fresco_limpio: 'fresco y limpio', dulce: 'dulce y delicioso',
    elegante_calido: 'elegante y cálido', frutal: 'frutal y llamativo', oscuro: 'oscuro y diferente'
  };
  var INTENSIDAD_FRASE = {
    discreta: 'discreta', equilibrada: 'equilibrada', notable: 'que se note', huella: 'con mucha huella'
  };
  var FAMILIA_ADJ = {
    fresco: 'fresco', citrico: 'cítrico', acuatico: 'acuático', dulce: 'dulce',
    gourmand: 'gourmand', goloso: 'goloso', floral: 'floral', especiado: 'especiado',
    ambarado: 'cálido y ambarado', amaderado: 'amaderado', cuero: 'con carácter de cuero',
    oud: 'de oud intenso', incienso: 'ahumado e incienso', frutal: 'frutal',
    clasico_elegante: 'clásico y sofisticado', artistico_nicho: 'artístico y poco convencional'
  };

  function joinNatural(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1];
  }

  function topFamilias(profile, n) {
    var tags = (profile && profile.familias) || [];
    return tags.slice(0, n || 2).map(function (t) { return FAMILIA_ADJ[t] || t; });
  }

  function buildExplanation(candidate, answers, role) {
    var recap = 'Elegiste un perfil ' + (AROMA_ADJ[answers.aroma] || '') + ' para ' +
      (OCASION_FRASE[answers.ocasion] || 'tu ocasión') + ', con intensidad ' +
      (INTENSIDAD_FRASE[answers.intensidad] || 'equilibrada') + '.';

    var familiasTxt = joinNatural(topFamilias(candidate._profile, 2));
    var nombre = candidate.name;
    var frase2;

    if (role === 'mejor') {
      frase2 = nombre + ' combina con ese perfil por su carácter ' + (familiasTxt || 'versátil') + '.';
    } else if (role === 'accesible') {
      frase2 = nombre + ' mantiene un estilo compatible' + (familiasTxt ? ' (' + familiasTxt + ')' : '') +
        ', con un precio de 2 ml más accesible.';
    } else {
      frase2 = nombre + ' lleva ese perfil un paso más allá: es más ' + (familiasTxt || 'intenso') +
        ', ideal si quieres algo distinto.';
    }

    return recap + ' ' + frase2;
  }

  var ROLE_META = {
    mejor:     { label: 'Tu mejor coincidencia', className: 'is-best' },
    accesible: { label: 'Alternativa accesible',  className: 'is-accesible' },
    atrevida:  { label: 'La opción más atrevida', className: 'is-atrevida' }
  };

  /* ── Estado ──────────────────────────────────────────────────── */

  var STATE = { step: 0, answers: {} };
  var resultsByCodigo = {};
  var perfumesPromise = null;

  function resetState() {
    STATE.step = 0;
    STATE.answers = {};
  }

  /* ── Render: progreso ────────────────────────────────────────── */

  function renderProgress(pct, stepLabel) {
    var track = byId('finderProgressTrack');
    var fill = byId('finderProgressFill');
    var label = byId('finderProgressLabel');
    if (track) track.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = stepLabel;
  }

  /* ── Render: pregunta ────────────────────────────────────────── */

  function renderQuestion(index) {
    var stage = byId('finderStage');
    if (!stage) return;
    var q = QUESTIONS[index];
    var selected = STATE.answers[q.id] || null;

    var wizardSection = byId('finderWizardSection');
    if (wizardSection) wizardSection.classList.remove('is-results');

    renderProgress(((index) / QUESTIONS.length) * 100 + (100 / QUESTIONS.length) * 0.15,
      'Pregunta ' + (index + 1) + ' de ' + QUESTIONS.length);

    var optionButtons = q.options.map(function (opt) {
      return el('button', {
        class: 'finder-option' + (selected === opt.id ? ' selected' : ''),
        type: 'button',
        dataset: { optId: opt.id },
        'aria-pressed': selected === opt.id ? 'true' : 'false',
        text: opt.label
      });
    });

    var backLabel = index === 0 ? '← Volver al inicio' : '← Regresar';

    var card = el('div', { class: 'finder-question reveal', dataset: { step: String(index) } }, [
      el('span', { class: 'finder-q-kicker', text: 'Pregunta ' + (index + 1) + ' de ' + QUESTIONS.length }),
      el('h2', { class: 'finder-q-title', tabindex: '-1', id: 'finderQTitle', text: q.title }),
      el('div', { class: 'finder-options', role: 'group', 'aria-label': q.title }, optionButtons),
      el('div', { class: 'finder-nav' }, [
        el('button', { type: 'button', class: 'btn btn-secondary finder-back', text: backLabel }),
        el('button', {
          type: 'button', class: 'btn btn-primary finder-continue',
          disabled: !selected, text: index === QUESTIONS.length - 1 ? 'Ver mis recomendaciones' : 'Continuar →'
        })
      ])
    ]);

    stage.replaceChildren(card);
    requestAnimationFrame(function () {
      card.classList.add('active');
      var title = byId('finderQTitle');
      if (title) title.focus({ preventScroll: true });
    });
  }

  /* ── Render: loading / error ─────────────────────────────────── */

  function renderLoading() {
    var stage = byId('finderStage');
    if (!stage) return;
    renderProgress(100, 'Buscando tus recomendaciones…');
    stage.replaceChildren(el('div', { class: 'finder-status reveal' }, [
      el('div', { class: 'finder-spinner', 'aria-hidden': 'true' }),
      el('p', { text: 'Buscando las fragancias que mejor coinciden con tus respuestas…' })
    ]));
    requestAnimationFrame(function () { $('.finder-status', stage) && $('.finder-status', stage).classList.add('active'); });
  }

  function renderError(retryFn) {
    var stage = byId('finderStage');
    if (!stage) return;
    var box = el('div', { class: 'finder-status finder-error reveal' }, [
      el('div', { class: 'finder-status-icon', text: '⚠️' }),
      el('h3', { text: 'No pudimos cargar el catálogo' }),
      el('p', { text: 'Verifica tu conexión a internet e intenta de nuevo.' }),
      el('button', { type: 'button', class: 'btn btn-primary', text: 'Reintentar' })
    ]);
    $('button', box).addEventListener('click', retryFn);
    stage.replaceChildren(box);
    requestAnimationFrame(function () { box.classList.add('active'); });
  }

  function renderEmpty() {
    var stage = byId('finderStage');
    if (!stage) return;
    stage.replaceChildren(el('div', { class: 'finder-status reveal active' }, [
      el('div', { class: 'finder-status-icon', text: '🕊️' }),
      el('h3', { text: 'No encontramos coincidencias esta vez' }),
      el('p', { text: 'Prueba de nuevo con otras respuestas o explora el catálogo completo.' }),
      el('div', { class: 'finder-nav finder-nav-center' }, [
        el('a', { href: '/#catalogoSection', class: 'btn btn-primary', text: 'Ver todo el catálogo' }),
        el('button', { type: 'button', class: 'btn btn-secondary', id: 'finderRestartEmpty', text: 'Volver a hacer el test' })
      ])
    ]));
    var btn = byId('finderRestartEmpty');
    if (btn) btn.addEventListener('click', function () { resetState(); renderQuestion(0); });
  }

  /* ── Render: resultados ──────────────────────────────────────── */

  function buildResultCard(candidate, role) {
    resultsByCodigo[String(candidate.codigo)] = candidate;

    var meta = ROLE_META[role];
    var price1 = candidate.prices[1] > 0 ? '$' + candidate.prices[1] : 'No disponible';
    var price2 = candidate.prices[2] > 0 ? '$' + candidate.prices[2] : 'No disponible';
    var price5 = candidate.prices[5] > 0 ? '$' + candidate.prices[5] : 'No disponible';
    var price10 = candidate.prices[10] > 0 ? '$' + candidate.prices[10] : 'No disponible';
    var addMl = candidate.prices[1] > 0 ? 1 : (candidate.prices[2] > 0 ? 2 : (candidate.prices[5] > 0 ? 5 : 10));

    return el('article', { class: 'finder-result ' + meta.className }, [
      el('span', { class: 'finder-result-badge', text: meta.label }),
      el('div', { class: 'finder-result-imgwrap' }, [
        el('img', { src: candidate.img || '../assets/favicon.svg', alt: candidate.name || '', loading: 'lazy' })
      ]),
      el('h3', { text: candidate.name }),
      el('div', { class: 'finder-result-brand', text: candidate.casa }),
      el('p', { class: 'finder-result-explain', text: buildExplanation(candidate, STATE.answers, role) }),
      el('div', { class: 'finder-result-prices' }, [
        el('div', {}, [ el('span', { text: '1 ml' }), el('strong', { text: price1 }) ]),
        el('div', {}, [ el('span', { text: '2 ml' }), el('strong', { text: price2 }) ]),
        el('div', {}, [ el('span', { text: '5 ml' }), el('strong', { text: price5 }) ]),
        el('div', {}, [ el('span', { text: '10 ml' }), el('strong', { text: price10 }) ])
      ]),
      el('div', { class: 'finder-result-actions' }, [
        el('button', {
          type: 'button', class: 'btn btn-secondary finder-ver',
          dataset: { codigo: String(candidate.codigo) }, text: 'Ver producto'
        }),
        el('button', {
          type: 'button', class: 'btn btn-primary finder-agregar',
          dataset: { codigo: String(candidate.codigo), ml: String(addMl) },
          text: 'Agregar ' + addMl + ' ml al carrito'
        })
      ])
    ]);
  }

  function renderResults(results) {
    var stage = byId('finderStage');
    if (!stage) return;
    resultsByCodigo = {};
    renderProgress(100, '¡Listo! Estas son tus recomendaciones');

    var wizardSection = byId('finderWizardSection');
    if (wizardSection) wizardSection.classList.add('is-results');

    var grid = el('div', { class: 'finder-results-grid' },
      results.map(function (r, i) {
        var role = i === 0 ? 'mejor' : (i === 1 ? 'accesible' : 'atrevida');
        return buildResultCard(r, role);
      })
    );

    var wrap = el('div', { class: 'finder-results reveal' }, [
      el('span', { class: 'finder-q-kicker', text: 'Tus resultados' }),
      el('h2', { class: 'finder-q-title', tabindex: '-1', id: 'finderQTitle', text: 'Encontramos estas fragancias para ti' }),
      grid,
      el('div', { class: 'finder-nav finder-nav-center' }, [
        el('button', { type: 'button', class: 'btn btn-secondary', id: 'finderRestart', text: 'Volver a hacer el test' }),
        el('a', { href: '/#catalogoSection', class: 'btn btn-primary', text: 'Ver todo el catálogo' })
      ])
    ]);

    stage.replaceChildren(wrap);
    requestAnimationFrame(function () {
      wrap.classList.add('active');
      var title = byId('finderQTitle');
      if (title) title.focus({ preventScroll: true });
    });

    var restartBtn = byId('finderRestart');
    if (restartBtn) restartBtn.addEventListener('click', function () { resetState(); renderQuestion(0); });
  }

  function computeAndRenderResults() {
    function withData() {
      var candidates = buildCandidates(STATE.answers);
      var results = pickResults(candidates);
      if (!results.length) { renderEmpty(); return; }
      renderResults(results);
    }

    if (window.PERFUMES && Object.keys(window.PERFUMES).length) {
      withData();
      return;
    }

    renderLoading();
    (perfumesPromise || fetchPerfumes()).then(function (ok) {
      if (!ok) { renderError(retryFetchAndRender); return; }
      withData();
    });
  }

  // Reintentar de verdad dispara una petición nueva — perfumesPromise ya
  // resuelto (error o timeout) nunca cambiaría de resultado si se reusara.
  function retryFetchAndRender() {
    fetchPerfumes();
    computeAndRenderResults();
  }

  // Si Sheets tarda o se cuelga (fetch no tiene timeout propio), no dejar
  // al usuario esperando para siempre: a los 15s se trata como error y se
  // ofrece reintentar. Si el fetch original termina después igual, la
  // próxima llamada a computeAndRenderResults lo encuentra en window.PERFUMES.
  function timeoutAfter(ms) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve('timeout'); }, ms);
    });
  }

  function fetchPerfumes() {
    var fetchOutcome = loadPerfumesFromSheets().then(function () {
      return 'ok';
    }).catch(function (err) {
      if (window.console && console.error) console.error('[recomendador]', err);
      return 'error';
    });

    perfumesPromise = Promise.race([fetchOutcome, timeoutAfter(15000)]).then(function (result) {
      return result === 'ok';
    });
    return perfumesPromise;
  }

  /* ── Navegación del wizard ───────────────────────────────────── */

  function goToStep(nextIndex) {
    if (nextIndex < 0) { window.location.href = '/'; return; }
    if (nextIndex >= QUESTIONS.length) { computeAndRenderResults(); return; }
    STATE.step = nextIndex;
    renderQuestion(nextIndex);
  }

  function wireWizard() {
    var stage = byId('finderStage');
    if (!stage) return;

    stage.addEventListener('click', function (e) {
      var optBtn = e.target.closest('.finder-option');
      if (optBtn) {
        var q = QUESTIONS[STATE.step];
        STATE.answers[q.id] = optBtn.dataset.optId;
        $$('.finder-option', stage).forEach(function (b) {
          var isSel = b === optBtn;
          b.classList.toggle('selected', isSel);
          b.setAttribute('aria-pressed', isSel ? 'true' : 'false');
        });
        var continueBtn = $('.finder-continue', stage);
        if (continueBtn) continueBtn.disabled = false;
        return;
      }

      if (e.target.closest('.finder-back')) { goToStep(STATE.step - 1); return; }
      if (e.target.closest('.finder-continue')) {
        if (!STATE.answers[QUESTIONS[STATE.step].id]) return;
        goToStep(STATE.step + 1);
        return;
      }

      var verBtn = e.target.closest('.finder-ver');
      if (verBtn) {
        var p1 = resultsByCodigo[verBtn.dataset.codigo];
        if (p1 && typeof window.verPerfume === 'function') window.verPerfume(p1);
        return;
      }

      var addBtn = e.target.closest('.finder-agregar');
      if (addBtn) {
        var p2 = resultsByCodigo[addBtn.dataset.codigo];
        if (!p2) return;
        window.actual = p2;
        var mlSelect = byId('ml');
        if (mlSelect) mlSelect.value = addBtn.dataset.ml;
        if (typeof window.addCarrito === 'function') window.addCarrito();
      }
    });
  }

  /* ── Carrito / modal compartidos (glue mínimo, sin duplicar lógica) ─── */

  function wireSharedCartAndModal() {
    $$('.wa-float').forEach(function (a) {
      a.href = 'https://wa.me/' + CONFIG.WA_NUMBER + '?text=' +
        encodeURIComponent('Hola ' + CONFIG.WA_CONTACT + ', vi el recomendador de SmellGood y me gustaría más información 👋');
    });

    var btnToggleCartNav = byId('btnToggleCartNav');
    var cartOverlay = byId('cartOverlay');
    var btnCerrarCarrito = byId('btnCerrarCarrito');
    if (btnToggleCartNav) btnToggleCartNav.addEventListener('click', toggleCarrito);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCarrito);
    if (btnCerrarCarrito) btnCerrarCarrito.addEventListener('click', toggleCarrito);

    var btnVaciarCarrito = byId('btnVaciarCarrito');
    var btnEnviarPedido = byId('btnEnviarPedido');
    if (btnVaciarCarrito) btnVaciarCarrito.addEventListener('click', vaciarCarrito);
    if (btnEnviarPedido) btnEnviarPedido.addEventListener('click', enviarPedido);

    var btnApplyPromo = byId('btnApplyPromo');
    if (btnApplyPromo) btnApplyPromo.addEventListener('click', applyPromoCode);
    var promoInput = byId('promoInput');
    if (promoInput) promoInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyPromoCode();
    });

    var listaCarrito = byId('listaCarrito');
    if (listaCarrito) {
      listaCarrito.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        if (btn.classList.contains('qty-btn')) {
          if (btn.dataset.action === 'increment') incrementar(btn.dataset.nombre, Number(btn.dataset.ml));
          else if (btn.dataset.action === 'decrement') decrementar(btn.dataset.ids.split(',').map(Number));
        } else if (btn.classList.contains('cart-remove')) {
          eliminar(btn.dataset.ids.split(',').map(Number));
        }
      });
    }

    var detalleWrapper = byId('detalle');
    var detalleBox = byId('detalleBox');
    var btnCerrarX = byId('btnCerrarX');
    var mlSelect = byId('ml');
    var btnAddCart = byId('btnAddCart');

    if (detalleWrapper) detalleWrapper.addEventListener('click', function (e) {
      if (e.target === detalleWrapper) cerrarDetalle();
    });
    if (detalleBox) detalleBox.addEventListener('click', function (e) { e.stopPropagation(); });
    if (btnCerrarX) btnCerrarX.addEventListener('click', function () { cerrarDetalle(); });
    if (mlSelect) mlSelect.addEventListener('change', actualizarPrecioModal);
    if (btnAddCart) btnAddCart.addEventListener('click', addCarrito);

    var allHeaders = $$('header');
    var onScrollHeader = SG.rafThrottle(function () {
      var scrolled = window.scrollY > 50;
      allHeaders.forEach(function (h) { h.classList.toggle('scrolled', scrolled); });
    });
    window.addEventListener('scroll', onScrollHeader, { passive: true });
  }

  /* ── Init ────────────────────────────────────────────────────── */

  SG.onReady(function () {
    if (typeof _loadCart === 'function') _loadCart();
    if (typeof renderCarrito === 'function') renderCarrito();
    wireSharedCartAndModal();
    wireWizard();

    fetchPerfumes();

    renderQuestion(0);
  });
})(window.SG);
