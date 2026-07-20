// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR SIN AUTORIZACIÓN ⚠️
// ============================================================================
// aspect_2x3.js — Relación de aspecto 2:3 (Vertical fotografía)
//
// ARCHIVO INDEPENDIENTE. Si este archivo falla al cargar, los demás aspectos
// siguen funcionando correctamente porque cada uno agrega su configuración
// independientemente a window.ASPECT_RATIOS.
//
// ────────────────────────────────────────────────────────────────────────────
// QUÉ HACE ESTE ARCHIVO:
// ────────────────────────────────────────────────────────────────────────────
//   Agrega una entrada al array global window.ASPECT_RATIOS con:
//   - label: "2:3" (texto a mostrar en botones y menú)
//   - w: 2 (ancho de la relación)
//   - h: 3 (alto de la relación)
//
// ────────────────────────────────────────────────────────────────────────────
// QUIÉN USA ESTA CONFIGURACIÓN:
// ────────────────────────────────────────────────────────────────────────────
//   - aspectRatio.js (archivo principal): lee window.ASPECT_RATIOS
//   - #btn-fit-screen: botón en barra superior del previsualizador
//   - #btn-trim: botón en barra de herramientas del timeline
//   Ambos botones cyclean por las relaciones y aplican la seleccionada
//
// ────────────────────────────────────────────────────────────────────────────
// ORDEN DE CARGA:
// ────────────────────────────────────────────────────────────────────────────
//   Este archivo debe cargarse ANTES que aspectRatio.js en index.html.
//   Los script tags están en index.html líneas ~514-525.
//
// ────────────────────────────────────────────────────────────────────────────
// CÓMO AGREGAR UN NUEVO ASPECTO:
// ────────────────────────────────────────────────────────────────────────────
//   1. Crear un nuevo archivo aspect_XxY.js en esta carpeta
//   2. Usar la misma estructura: window.ASPECT_RATIOS.push({ label, w, h })
//   3. Agregar el script tag en index.html ANTES de aspectRatio.js
//   4. No necesita modificar aspectRatio.js ni ningún otro archivo
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

// ⚠️ NO cambiar label, w, h sin autorización. Es la configuración del aspecto.
window.ASPECT_RATIOS.push({
    label: '2:3',
    w: 2,
    h: 3
});
