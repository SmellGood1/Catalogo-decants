/*
 * recommendationProfiles.js — Datos de etiquetado para el recomendador (/recomendador).
 *
 * Guarda ÚNICAMENTE lo necesario para puntuar: nada de nombres, precios ni
 * imágenes — eso siempre se lee en vivo desde window.PERFUMES (js/sheets.js)
 * cruzando por `codigo`, la misma clave que ya usa findPerfumeByCode().
 *
 * Vocabulario controlado (debe coincidir con las opciones del quiz en recomendador.js):
 *   ocasiones : diario | cita | oficina | fiesta | artistico
 *   clima     : calido | fresco | ac | noche | cualquiera
 *   objetivos : fresco_limpio | cumplidos | elegante | irresistible | sorprender
 *   intensidad: 1 (discreta) .. 4 (deja huella)
 *   originalidad: 1 (clásico/accesible) .. 5 (artístico/nicho)
 *   familias  : vocabulario libre (fresco, citrico, acuatico, dulce, gourmand,
 *               goloso, floral, especiado, ambarado, amaderado, cuero, oud,
 *               incienso, frutal, clasico_elegante, artistico_nicho...)
 *
 * Campo opcional:
 *   climaExcluido: array de valores de `clima` para los que este perfume
 *                  NUNCA debe aparecer en resultados, sin importar qué tan
 *                  bien puntúe en todo lo demás (filtro duro, no solo resta
 *                  puntos). Úsalo cuando un perfume es claramente incorrecto
 *                  para ese clima — ej. algo pesado/de invierno que no debe
 *                  salir si el usuario pide "Clima caliente".
 *
 * Para agregar un perfume nuevo: toma su `codigo` de la hoja de Sheets y
 * añade una entrada aquí. Si no tiene entrada, el recomendador simplemente
 * no lo prioriza (no rompe nada — ver recomendador.js:scorePerfume).
 *
 * Los códigos 12 (Asad Bourbon) y 22 (Vulcan Feu) se omiten a propósito:
 * hoy están "Próximo" y sin precio en la hoja, así que ya quedan fuera por
 * el filtro de disponibilidad/precio antes de llegar a puntuarse.
 */
(function (SG) {
  'use strict';

  var PROFILES = {
    '1':  { familias: ['dulce', 'gourmand', 'ambarado'],                    ocasiones: ['cita'],                      intensidad: 2, clima: ['calido', 'cualquiera'],      objetivos: ['cumplidos', 'irresistible'],       originalidad: 2 },
    '2':  { familias: ['fresco', 'citrico', 'acuatico'],                    ocasiones: ['diario', 'oficina'],         intensidad: 1, clima: ['calido', 'ac', 'cualquiera'], objetivos: ['fresco_limpio'],                   originalidad: 1 },
    '3':  { familias: ['ambarado', 'especiado', 'cuero', 'clasico_elegante'], ocasiones: ['oficina', 'cita'],          intensidad: 2, clima: ['fresco', 'ac', 'noche'],      objetivos: ['elegante'],                        originalidad: 2 },
    '4':  { familias: ['fresco', 'frutal', 'clasico_elegante', 'ambarado'], ocasiones: ['diario', 'cita', 'fiesta'],  intensidad: 3, clima: ['cualquiera'],                objetivos: ['cumplidos', 'elegante'],           originalidad: 2 },
    '5':  { familias: ['especiado', 'amaderado', 'ambarado', 'clasico_elegante'], ocasiones: ['oficina', 'cita'],     intensidad: 3, clima: ['fresco', 'ac', 'noche', 'calido'], objetivos: ['elegante'],                   originalidad: 2 },
    '6':  { familias: ['oud', 'dulce', 'amaderado'],                        ocasiones: ['cita', 'artistico'],         intensidad: 3, clima: ['fresco', 'noche'],           objetivos: ['irresistible', 'sorprender'],      originalidad: 3 },
    '7':  { familias: ['gourmand', 'dulce', 'especiado'],                   ocasiones: ['cita', 'fiesta'],            intensidad: 3, clima: ['fresco', 'noche'],           objetivos: ['cumplidos', 'irresistible'],       originalidad: 2 },
    '8':  { familias: ['oud', 'cuero', 'ambarado', 'artistico_nicho'],      ocasiones: ['cita', 'fiesta', 'artistico'], intensidad: 4, clima: ['fresco', 'noche'],        objetivos: ['sorprender', 'irresistible'],      originalidad: 4 },
    '9':  { familias: ['amaderado', 'especiado', 'oud'],                    ocasiones: ['oficina', 'cita'],           intensidad: 2, clima: ['fresco', 'ac'],              objetivos: ['elegante'],                        originalidad: 3 },
    '10': { familias: ['fresco', 'dulce', 'especiado', 'gourmand'],         ocasiones: ['diario', 'oficina'],         intensidad: 1, clima: ['calido', 'ac', 'cualquiera'], objetivos: ['fresco_limpio'],                   originalidad: 1 },
    '11': { familias: ['especiado', 'ambarado', 'amaderado', 'clasico_elegante'], ocasiones: ['fiesta', 'cita'],      intensidad: 4, clima: ['fresco', 'noche'],           objetivos: ['cumplidos', 'irresistible'],       originalidad: 2 },
    '13': { familias: ['oud', 'cuero', 'ambarado', 'especiado'],            ocasiones: ['cita', 'artistico'],         intensidad: 4, clima: ['fresco', 'noche'],           objetivos: ['elegante', 'sorprender'],          originalidad: 4 },
    '14': { familias: ['frutal', 'dulce', 'artistico_nicho'],               ocasiones: ['diario', 'cita', 'artistico'], intensidad: 2, clima: ['calido', 'cualquiera'], objetivos: ['irresistible'],                    originalidad: 3 },
    '15': { familias: ['dulce', 'especiado', 'ambarado', 'clasico_elegante', 'artistico_nicho'], ocasiones: ['cita', 'fiesta', 'artistico'], intensidad: 4, clima: ['fresco', 'noche'], objetivos: ['elegante', 'irresistible', 'sorprender'], originalidad: 4 },
    '16': { familias: ['dulce', 'floral', 'ambarado'],                      ocasiones: ['cita', 'fiesta'],            intensidad: 3, clima: ['fresco', 'noche'],           objetivos: ['cumplidos', 'irresistible'],       originalidad: 2 },
    '17': { familias: ['fresco', 'acuatico', 'amaderado'],                  ocasiones: ['diario', 'oficina'],         intensidad: 2, clima: ['calido', 'ac', 'cualquiera'], objetivos: ['fresco_limpio'],                   originalidad: 2 },
    '18': { familias: ['frutal', 'dulce', 'amaderado', 'clasico_elegante'], ocasiones: ['fiesta', 'cita'],            intensidad: 3, clima: ['fresco', 'noche', 'cualquiera'], objetivos: ['cumplidos', 'elegante'],         originalidad: 2 },
    '19': { familias: ['dulce', 'gourmand', 'especiado', 'amaderado'],      ocasiones: ['fiesta', 'cita'],            intensidad: 4, clima: ['noche', 'fresco'],           objetivos: ['irresistible', 'sorprender'],      originalidad: 3 },
    '20': { familias: ['fresco', 'citrico', 'ambarado', 'amaderado'],       ocasiones: ['diario', 'oficina'],         intensidad: 2, clima: ['calido', 'ac', 'cualquiera'], objetivos: ['fresco_limpio', 'elegante'],       originalidad: 2 },
    '21': { familias: ['gourmand', 'dulce', 'especiado'],                   ocasiones: ['cita', 'fiesta'],            intensidad: 3, clima: ['fresco', 'noche'],           objetivos: ['irresistible', 'cumplidos'],       originalidad: 2 },
    '23': { familias: ['dulce', 'gourmand', 'especiado', 'ambarado'],       ocasiones: ['cita', 'fiesta'],            intensidad: 3, clima: ['fresco', 'noche'],           objetivos: ['cumplidos', 'irresistible'],       originalidad: 2 },
    '24': { familias: ['frutal', 'floral', 'amaderado'],                    ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['calido', 'cualquiera'],      objetivos: ['fresco_limpio', 'elegante'],       originalidad: 2 },
    '25': { familias: ['fresco', 'dulce', 'amaderado', 'frutal'],           ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['calido', 'cualquiera'],      objetivos: ['fresco_limpio', 'irresistible'],   originalidad: 2 },
    '26': { familias: ['dulce', 'especiado', 'amaderado', 'clasico_elegante'], ocasiones: ['cita', 'oficina', 'fiesta'], intensidad: 3, clima: ['fresco', 'cualquiera'],   objetivos: ['elegante', 'cumplidos'],           originalidad: 2 },
    '27': { familias: ['dulce', 'gourmand', 'ambarado'],                    ocasiones: ['cita', 'fiesta'],            intensidad: 4, clima: ['fresco', 'noche'],           objetivos: ['irresistible', 'cumplidos'],       originalidad: 2 },
    '28': { familias: ['frutal', 'fresco', 'floral'],                       ocasiones: ['diario', 'fiesta'],          intensidad: 2, clima: ['calido', 'cualquiera'],      objetivos: ['fresco_limpio'],                   originalidad: 2 },
    '29': { familias: ['gourmand', 'dulce', 'goloso'],                      ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['fresco', 'cualquiera'],      objetivos: ['irresistible'],                    originalidad: 2 },
    '30': { familias: ['frutal', 'dulce', 'goloso', 'gourmand'],            ocasiones: ['diario', 'fiesta'],          intensidad: 2, clima: ['calido', 'cualquiera'],      objetivos: ['irresistible'],                    originalidad: 2 },
    '31': { familias: ['gourmand', 'dulce', 'goloso'],                      ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['fresco', 'cualquiera'],      objetivos: ['irresistible'],                    originalidad: 3 },
    '32': { familias: ['gourmand', 'dulce', 'goloso'],                      ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['fresco', 'cualquiera'],      objetivos: ['irresistible'],                    originalidad: 2 },
    '33': { familias: ['dulce', 'goloso', 'frutal', 'floral'],              ocasiones: ['diario', 'fiesta'],          intensidad: 2, clima: ['cualquiera'],                objetivos: ['irresistible'],                    originalidad: 2 },
    '34': { familias: ['dulce', 'gourmand', 'goloso'],                      ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['fresco', 'cualquiera'],      objetivos: ['irresistible'],                    originalidad: 1 },
    '35': { familias: ['dulce', 'goloso'],                                  ocasiones: ['diario', 'fiesta'],          intensidad: 2, clima: ['cualquiera'],                objetivos: ['irresistible'],                    originalidad: 2 },
    '36': { familias: ['dulce', 'goloso', 'frutal'],                        ocasiones: ['diario', 'fiesta'],          intensidad: 2, clima: ['cualquiera'],                objetivos: ['irresistible'],                    originalidad: 2 },
    '37': { familias: ['dulce', 'goloso', 'gourmand'],                      ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['fresco', 'cualquiera'],      objetivos: ['irresistible'],                    originalidad: 1 },
    '38': { familias: ['frutal', 'floral', 'dulce', 'goloso', 'gourmand'],  ocasiones: ['diario', 'fiesta'],          intensidad: 2, clima: ['cualquiera'],                objetivos: ['irresistible'],                    originalidad: 2 },
    '39': { familias: ['oud', 'cuero', 'especiado', 'artistico_nicho'],     ocasiones: ['artistico', 'cita'],         intensidad: 4, clima: ['noche'],                     objetivos: ['sorprender', 'elegante'],          originalidad: 5, climaExcluido: ['calido'] },
    '40': { familias: ['fresco', 'acuatico', 'frutal'],                     ocasiones: ['diario', 'cita'],            intensidad: 2, clima: ['calido', 'cualquiera'],      objetivos: ['fresco_limpio', 'cumplidos'],      originalidad: 2 },
    '41': { familias: ['fresco', 'citrico', 'especiado'],                   ocasiones: ['diario', 'oficina'],         intensidad: 2, clima: ['calido', 'ac', 'cualquiera'], objetivos: ['fresco_limpio'],                   originalidad: 2 },
    '42': { familias: ['fresco', 'citrico', 'dulce'],                       ocasiones: ['diario', 'oficina'],         intensidad: 1, clima: ['calido', 'ac', 'cualquiera'], objetivos: ['fresco_limpio'],                   originalidad: 1 },
    '43': { familias: ['fresco', 'especiado', 'amaderado', 'frutal', 'gourmand', 'goloso'], ocasiones: ['diario', 'cita', 'fiesta'], intensidad: 2, clima: ['ac', 'cualquiera'], objetivos: ['fresco_limpio', 'irresistible'], originalidad: 2 },
    '44': { familias: ['incienso', 'ambarado', 'gourmand', 'artistico_nicho'], ocasiones: ['artistico', 'fiesta'],    intensidad: 4, clima: ['noche'],                     objetivos: ['sorprender', 'elegante'],          originalidad: 5, climaExcluido: ['calido'] }
  };

  function getProfile(codigo) {
    return PROFILES[String(codigo)] || null;
  }

  SG.recoProfiles = {
    all: PROFILES,
    get: getProfile
  };
})(window.SG);
