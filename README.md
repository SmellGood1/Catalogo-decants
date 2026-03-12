# SmellGood Decants

Catalogo de decants de perfumes premium con pedido por WhatsApp.

## Estructura del proyecto

```
/
├── index.html              # HTML principal
├── css/
│   ├── variables.css       # Variables CSS (:root)
│   ├── reset.css           # Reset y estilos base
│   ├── layout.css          # Container y grid system
│   ├── header.css          # Header, nav, search, carrito
│   ├── hero.css            # Seccion hero
│   ├── trust.css           # Trust cards
│   ├── catalog.css         # Cards de perfumes y grid
│   ├── modal.css           # Modal de detalle
│   ├── cart.css            # Panel lateral del carrito
│   ├── aroma.css           # Seccion "Tu aroma, a tu ritmo"
│   ├── footer.css          # Footer y redes sociales
│   ├── components.css      # Botones, toast, inputs, WA float
│   └── responsive.css      # Media queries consolidados
├── js/
│   ├── config.js           # Configuracion del negocio
│   ├── data/
│   │   └── perfumes.js     # Catalogo de perfumes
│   ├── toast.js            # Notificaciones toast
│   ├── cart.js             # Carrito con localStorage
│   ├── modal.js            # Modal de detalle
│   ├── whatsapp.js         # Envio de pedido por WhatsApp
│   ├── catalog.js          # Render del catalogo
│   └── app.js              # Inicializacion
└── assets/
    ├── favicon.ico
    └── og-image.jpg
```

## Como agregar un perfume

Editar `js/data/perfumes.js`. Cada perfume tiene esta estructura:

```js
{
  name: "Nombre del Perfume",
  conc: "Eau de Parfum",        // Concentracion
  img: "https://...",           // URL de la imagen
  link: "https://...",         // Link a Fragrantica
  price: 25,                   // Precio por ml
  proximo: false               // true = "Proximamente" (no se puede agregar al carrito)
}
```

Agregar el objeto dentro del array de la casa correspondiente. Para una casa nueva, agregar una nueva clave al objeto `PERFUMES`.

## Como cambiar el numero de WhatsApp

Editar `js/config.js`:

```js
window.CONFIG = {
  WA_NUMBER: '529213042001',   // Numero con codigo de pais
  WA_CONTACT: 'Jhoan',         // Nombre del contacto
  TOAST_DURATION: 2000,
  ML_OPTIONS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
};
```

Tambien actualizar el link del boton flotante de WhatsApp en `index.html` (buscar `wa-float`).

## Deploy

El sitio es HTML/CSS/JS estatico. Opciones de deploy:

1. **GitHub Pages**: Push a un repo y activar Pages en Settings
2. **Netlify/Vercel**: Conectar el repo, se publica automaticamente
3. **Servidor propio**: Subir todos los archivos a la raiz del hosting

Para desarrollo local:
```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .
```

Abrir `http://localhost:8000` en el navegador.
