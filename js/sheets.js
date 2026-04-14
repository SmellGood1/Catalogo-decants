/*
 * sheets.js — Carga el catálogo de perfumes desde Google Sheets (CSV público).
 * Expone window.PERFUMES con el mismo formato que usaba perfumes.js.
 */
var SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT31Q_qgQbxSCGNxeJ09rE-VqtnaLhgyjwyY5cdsU_C2VT6WAz1RYTFVFEcNQvr7pt58TyNhHnn0lGk/pub?gid=1268874206&single=true&output=csv';

/* ── CSV Parser ─────────────────────────────────────────────── */

function parseCSVLine(line) {
  var fields = [];
  var current = '';
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(raw) {
  var text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  var lines = text.split('\n');
  var headers = parseCSVLine(lines[0]);
  var rows = [];

  for (var i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    var values = parseCSVLine(lines[i]);
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function cleanPrice(val) {
  if (!val) return 0;
  return Math.round(Number(String(val).replace(/[$,\s]/g, '')) * 100) / 100 || 0;
}

function parseNotes(salida, corazon, fondo) {
  if (!salida && !corazon && !fondo) return null;
  var notes = {};
  if (salida) notes.top = salida.split(',').map(function(n) { return n.trim(); }).filter(Boolean);
  if (corazon) notes.heart = corazon.split(',').map(function(n) { return n.trim(); }).filter(Boolean);
  if (fondo) notes.base = fondo.split(',').map(function(n) { return n.trim(); }).filter(Boolean);
  return notes;
}

function findPerfumeByCode(code) {
  if (!window.PERFUMES) return null;
  var has = Object.prototype.hasOwnProperty;
  for (var casa in PERFUMES) {
    if (!has.call(PERFUMES, casa)) continue;
    for (var i = 0; i < PERFUMES[casa].length; i++) {
      if (String(PERFUMES[casa][i].codigo) === String(code)) {
        var p = {};
        for (var k in PERFUMES[casa][i]) {
          if (has.call(PERFUMES[casa][i], k)) p[k] = PERFUMES[casa][i][k];
        }
        p.casa = casa;
        return p;
      }
    }
  }
  return null;
}

/* ── Fetch & Build ───────────────────────────────────────────── */

function loadPerfumesFromSheets() {
  return fetch(SHEETS_CSV_URL)
    .then(function(response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function(csvText) {
      var rows = parseCSV(csvText);
      if (!rows.length) throw new Error('CSV vacío');

      // Validación defensiva: la hoja publicada debe ser la de decants.
      // Si no trae las columnas esperadas, el tab del Sheets es otro (típicamente
      // la calculadora si se reorganizan los tabs) y hay que fijar el gid correcto
      // en SHEETS_CSV_URL.
      var headers = Object.keys(rows[0] || {});
      var hasCasa = headers.indexOf('casa') !== -1 || headers.indexOf('Casa') !== -1;
      var hasPerfume = headers.indexOf('perfume') !== -1 || headers.indexOf('Perfume') !== -1;
      if (!hasCasa || !hasPerfume) {
        throw new Error(
          'El tab publicado no parece ser el de Decants. Columnas encontradas: ' +
          headers.join(', ') +
          '. Fijar el gid correcto en SHEETS_CSV_URL (js/sheets.js).'
        );
      }

      var perfumes = {};

      rows.forEach(function(row) {
        var casa = row['casa'] || row['Casa'] || '';
        if (!casa) return;

        var enVenta = (row['En venta'] || '').toUpperCase().trim();

        var perfume = {
          codigo:  row['codigo'] || row['Codigo'] || '',
          name:    row['perfume'] || '',
          conc:    row['Concentración'] || row['Concentracion'] || '',
          img:     row['imagen'] || '',
          link:    row['link'] || '',
          prices: {
            2:  cleanPrice(row['precio venta 2ml']),
            5:  cleanPrice(row['precio venta 5ml']),
            10: cleanPrice(row['precio venta 10ml'])
          },
          notes:   parseNotes(
                     row['Notas Salida'] || '',
                     row['Notas Corazón'] || row['Notas Corazon'] || '',
                     row['Notas Base'] || row['Notas Fondo'] || ''
                   ),
          destacado: (row['Destacado'] || row['destacado'] || row['Destacados'] || row['destacados'] || '').toUpperCase().trim() === 'SI',
          ranking: parseInt(row['Ranking'] || row['ranking'] || '0', 10) || 0,
          proximo: enVenta !== 'SI' && enVenta !== 'NO',
          agotado: enVenta === 'NO',
          muyPronto: enVenta === 'MUY PRONTO'
        };

        if (!perfumes[casa]) perfumes[casa] = [];
        perfumes[casa].push(perfume);
      });

      window.PERFUMES = perfumes;
      return perfumes;
    });
}

/* ── Frascos Completos ────────────────────────────────────────── */

var COMPLETOS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT31Q_qgQbxSCGNxeJ09rE-VqtnaLhgyjwyY5cdsU_C2VT6WAz1RYTFVFEcNQvr7pt58TyNhHnn0lGk/pub?gid=1024551337&single=true&output=csv';

function loadCompletosFromSheets() {
  return fetch(COMPLETOS_CSV_URL)
    .then(function(response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function(csvText) {
      var rows = parseCSV(csvText);
      if (!rows.length) throw new Error('CSV vacío');

      var completos = {};

      rows.forEach(function(row) {
        var casa = row['Casa'] || row['casa'] || '';
        if (!casa) return;

        var enVenta = (row['En venta'] || row['En Venta'] || '').toUpperCase().trim();

        var perfume = {
          name:    row['Perfume'] || row['perfume'] || '',
          conc:    row['Concentración'] || row['Concentracion'] || '',
          img:     row['Imagen'] || row['imagen'] || '',
          link:    row['Link'] || row['link'] || '',
          price:   cleanPrice(row['Precio'] || row['precio'] || ''),
          ml:      row['Mililitros'] || row['ml'] || '',
          notes:   parseNotes(
                     row['Notas salida'] || row['Notas Salida'] || '',
                     row['Notas corazón'] || row['Notas Corazón'] || row['Notas corazón '] || '',
                     row['Notas base'] || row['Notas Base'] || ''
                   ),
          proximo: enVenta !== 'SI' && enVenta !== 'NO',
          agotado: enVenta === 'NO',
          muyPronto: enVenta === 'MUY PRONTO',
          entrega: (row['Entrega'] || row['entrega'] || '').trim()
        };

        if (!completos[casa]) completos[casa] = [];
        completos[casa].push(perfume);
      });

      window.COMPLETOS = completos;
      return completos;
    });
}

/* ── Combos ───────────────────────────────────────────────────── */

var COMBOS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT31Q_qgQbxSCGNxeJ09rE-VqtnaLhgyjwyY5cdsU_C2VT6WAz1RYTFVFEcNQvr7pt58TyNhHnn0lGk/pub?gid=596726274&single=true&output=csv';

function loadCombosFromSheets() {
  return fetch(COMBOS_CSV_URL)
    .then(function(response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function(csvText) {
      var rows = parseCSV(csvText);
      var combos = [];

      rows.forEach(function(row) {
        var nombre = row['Nombre'] || row['nombre'] || '';
        if (!nombre) return;

        var enVenta = (row['En venta'] || row['En Venta'] || 'SI').toUpperCase().trim();

        combos.push({
          name: nombre,
          codes: [
            String(row['Código 1'] || row['Codigo 1'] || '').trim(),
            String(row['Código 2'] || row['Codigo 2'] || '').trim(),
            String(row['Código 3'] || row['Codigo 3'] || '').trim()
          ],
          prices: {
            2:  cleanPrice(row['Precio 2ml'] || ''),
            5:  cleanPrice(row['Precio 5ml'] || ''),
            10: cleanPrice(row['Precio 10ml'] || '')
          },
          proximo: enVenta !== 'SI' && enVenta !== 'NO',
          agotado: enVenta === 'NO',
          video: (row['Video'] || row['video'] || '').trim()
        });
      });

      window.COMBOS = combos;
      return combos;
    });
}
