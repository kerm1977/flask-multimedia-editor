// ============================================================================
// aspect_3x4.js — Relación de aspecto 3:4 (Vertical clásica)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '3:4',
    w: 3,
    h: 4
});
