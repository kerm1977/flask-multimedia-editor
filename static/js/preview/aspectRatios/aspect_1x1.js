// ============================================================================
// aspect_1x1.js — Relación de aspecto 1:1 (Cuadrado)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
//
// Configuración:
//   - label: texto a mostrar en el botón y menú
//   - w: ancho de la relación
//   - h: alto de la relación
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '1:1',
    w: 1,
    h: 1
});
