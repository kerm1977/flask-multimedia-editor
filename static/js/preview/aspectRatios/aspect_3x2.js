// ============================================================================
// aspect_3x2.js — Relación de aspecto 3:2 (Fotografía)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '3:2',
    w: 3,
    h: 2
});
