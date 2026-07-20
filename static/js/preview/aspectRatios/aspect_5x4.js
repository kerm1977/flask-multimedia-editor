// ============================================================================
// aspect_5x4.js — Relación de aspecto 5:4 (Monitores antiguos)
//
// Archivo independiente. Si este archivo falla, los demás aspectos
// siguen funcionando correctamente.
// ============================================================================

if (typeof window.ASPECT_RATIOS === 'undefined') {
    window.ASPECT_RATIOS = [];
}

window.ASPECT_RATIOS.push({
    label: '5:4',
    w: 5,
    h: 4
});
