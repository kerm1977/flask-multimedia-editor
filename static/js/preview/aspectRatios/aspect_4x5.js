// ============================================================================
// aspect_4x5.js — Relación de aspecto 4:5 (Vertical)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '4:5',
    w: 4,
    h: 5
});
