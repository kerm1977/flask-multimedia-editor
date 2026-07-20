// ============================================================================
// aspect_1x2.js — Relación de aspecto 1:2 (Vertical extremo)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '1:2',
    w: 1,
    h: 2
});
