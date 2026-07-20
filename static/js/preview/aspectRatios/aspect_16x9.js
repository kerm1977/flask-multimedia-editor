// ============================================================================
// aspect_16x9.js — Relación de aspecto 16:9 (Widescreen / YouTube)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '16:9',
    w: 16,
    h: 9
});
