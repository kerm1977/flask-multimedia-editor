// ============================================================================
// aspect_9x16.js — Relación de aspecto 9:16 (Vertical / Stories / Reels)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '9:16',
    w: 9,
    h: 16
});
