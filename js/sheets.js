/*
 * sheets.js — Carga el catálogo de perfumes desde Google Sheets (CSV público).
 * Expone window.PERFUMES con el mismo formato que usaba perfumes.js.
 */
var SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT31Q_qgQbxSCGNxeJ09rE-VqtnaLhgyjwyY5cdsU_C2VT6WAz1RYTFVFEcNQvr7pt58TyNhHnn0lGk/pub?output=csv';

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

      var perfumes = {};

      rows.forEach(function(row) {
        var casa = row['casa'] || '';
        if (!casa) return;

        var enVenta = (row['En venta'] || '').toUpperCase().trim();

        var perfume = {
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
                     row['Notas Fondo'] || ''
                   ),
          destacado: (row['Destacado'] || row['destacado'] || '').toUpperCase().trim() === 'SI',
          proximo: enVenta !== 'SI'
        };

        if (!perfumes[casa]) perfumes[casa] = [];
        perfumes[casa].push(perfume);
      });

      window.PERFUMES = perfumes;
      return perfumes;
    });
}
