# SmellGood Decants

Catálogo de decants y frascos completos con pedido directo por WhatsApp.
El stack es estático (HTML/CSS/JS vanilla) y el catálogo se alimenta desde una
hoja pública de Google Sheets.

## Arquitectura

```
/
├── index.html                   # Marcado del sitio y meta tags
├── css/                         # Hojas de estilo por componente
│   ├── variables.css            # Tokens (:root)
│   ├── reset.css / layout.css
│   ├── components.css           # Botones, toast, skip-link, filtros
│   ├── header.css / hero.css / trust.css
│   ├── catalog.css / modal.css / cart.css
│   ├── combos.css / extras.css / category-picker.css
│   ├── aroma.css / faq.css / footer.css / responsive.css
├── js/
│   ├── core.js                  # Helpers globales (SG.el, SG.audio, SG.sha256Hex, SG.ua...)
│   ├── a11y.js                  # Controlador único de modales (Escape, focus trap, foco)
│   ├── pricing.js               # Motor único de precios y descuentos
│   ├── config.js                # Número de WhatsApp, promo codes (hashed) y tiers
│   ├── sheets.js                # Lectura de Google Sheets (decants, completos, combos)
│   ├── catalog.js               # Render del catálogo + buscador fuzzy
│   ├── extras.js                # Completos, combos, destacados y efectos visuales
│   ├── modal.js                 # Modal de detalle (usa SG.audio y SG.modal)
│   ├── cart.js                  # Carrito, promo codes, panel lateral
│   ├── whatsapp.js              # Construcción del mensaje (usa pricing.js)
│   ├── toast.js / faq.js / app.js
└── assets/                      # Imágenes de branding y videos de combos
```

Un único namespace global (`window.SG`) expone los módulos compartidos. Todos
los datos que vienen de Google Sheets se insertan en el DOM mediante
`SG.el()` / `textContent` (nunca `innerHTML` con interpolación) para prevenir
XSS.

## Configuración del negocio (`js/config.js`)

```js
window.CONFIG = {
  WA_NUMBER: '529213042001',
  WA_CONTACT: 'Jhoan',
  TOAST_DURATION: 2000,
  ML_OPTIONS: [2, 5, 10],
  SITE_URL: 'https://smellgood.mx',

  GA_ID: '',                     // vacío = no se carga Google Analytics

  VOLUME_TIERS: [                // descuentos por volumen sobre decants
    { threshold: 500,  percent: 10 },
    { threshold: 800,  percent: 15 },
    { threshold: 1200, percent: 20 }
  ],

  MAX_COMBINED_DISCOUNT: 35,     // cap de volumen + promo

  PROMO_CODES: {                 // claves: SHA-256 del código en mayúsculas
    '0d31902e...': { percent: 10, expires: new Date('2026-06-30T23:59:59-05:00') }
    // ...
  }
};
```

Para rotar o añadir un código promocional calcula el hash antes de pegarlo:

```bash
python3 -c "import hashlib; print(hashlib.sha256(b'NUEVO').hexdigest())"
```

Los códigos no viven en texto plano dentro del bundle: esto evita que un
usuario los lea simplemente abriendo DevTools. Para refuerzo real del modelo
promocional se recomienda validar en un backend — este cambio deja la capa
lista para migrar.

## Cómo agregar un perfume

Todo el catálogo se alimenta de la hoja pública en Google Sheets
(URL configurable en `js/sheets.js`). Añade una fila nueva con los campos
`casa`, `perfume`, `Concentración`, `imagen`, `link`, precios por ml,
`Notas Salida` / `Corazón` / `Base`, `Destacado`, `Ranking` y `En venta`
(`SI`, `NO` o `MUY PRONTO`).

## Desarrollo local

```bash
python3 -m http.server 8000      # o  npx serve .
```

Abrir `http://localhost:8000`.

## Deploy

Proyecto 100% estático. Cualquiera de estas opciones funciona:

1. **GitHub Pages** — push al repo y activar Pages
2. **Netlify / Vercel** — conectar el repo
3. **Servidor propio** — subir los archivos a la raíz del hosting
