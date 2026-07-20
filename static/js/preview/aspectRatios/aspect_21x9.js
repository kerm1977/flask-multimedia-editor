// ============================================================================
// aspect_21x9.js — Relación de aspecto 21:9 (Cine ultrapanorámico)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '21:9',
    w: 21,
    h: 9
});
