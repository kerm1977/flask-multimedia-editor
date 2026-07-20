// ============================================================================
// aspect_4x3.js — Relación de aspecto 4:3 (TV clásica)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '4:3',
    w: 4,
    h: 3
});
