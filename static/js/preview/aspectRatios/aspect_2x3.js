// ============================================================================
// aspect_2x3.js — Relación de aspecto 2:3 (Vertical fotografía)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '2:3',
    w: 2,
    h: 3
});
