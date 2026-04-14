/*
 * config.js — Parámetros de negocio. Único punto de edición para:
 *   · número de WhatsApp
 *   · tiers de descuento por volumen (consumidos por pricing.js)
 *   · códigos promocionales (almacenados como hashes SHA-256 para que
 *     no sean legibles abriendo el bundle)
 *   · ID de Google Analytics (si queda vacío, no se carga el script)
 */
window.CONFIG = {
  WA_NUMBER: '529213042001',
  WA_CONTACT: 'Jhoan',
  TOAST_DURATION: 2000,
  ML_OPTIONS: [2, 5, 10],

  SITE_URL: 'https://smellgood.mx',

  // Analytics: dejar vacío en dev / staging para no emitir hits con un ID placeholder.
  GA_ID: '',

  // Tiers acumulativos sobre el subtotal de DECANTS (no aplica a frascos completos).
  // Orden ascendente obligatorio.
  VOLUME_TIERS: [
    { threshold: 500,  percent: 10 },
    { threshold: 800,  percent: 15 },
    { threshold: 1200, percent: 20 }
  ],

  // Cap de descuento combinado (volumen + promo) como % del subtotal de decants.
  // Default 100 = sin cap para preservar el comportamiento actual del negocio.
  // Ajustar a un valor más bajo (ej. 40) si se quiere limitar el stacking.
  MAX_COMBINED_DISCOUNT: 100,

  /*
   * Códigos promocionales — cada entrada se identifica por el SHA-256 del código
   * en mayúsculas. Para rotar un código:
   *   python3 -c "import hashlib; print(hashlib.sha256(b'NUEVO').hexdigest())"
   */
  PROMO_CODES: {
    // SMELL10
    '0d31902e6b057eecb4fd43cced17f9c9d23fe5e8fad5f9ab2e70d0f72e185d6f': {
      percent: 10,
      expires: new Date('2026-06-30T23:59:59-05:00')
    },
    // SM27A
    '235f79b4817cf5f2eba303ed0048b7a937a9b65ac48c43aba3ec326e9e8520cd': {
      percent: 27,
      expires: null
    },
    // SM27B
    'bc212509a28a3e18a9e06fbadaaedd3e0a35412ff2088a2809ff7eadb827f2d2': {
      percent: 27,
      expires: null
    },
    // SM27C
    '58f4c817c06368a06677b470f58c95ecb4ed0e835113d1bcaef0779d891460ef': {
      percent: 27,
      expires: null
    }
  }
};
