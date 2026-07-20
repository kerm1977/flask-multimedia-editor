// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// disableRotateShortcut.js - Desactiva la tecla R para rotar emojis
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica emojiTrackManager.js.
//
// FUNCIONALIDAD:
//   - Intercepta la tecla R antes de que emojiTrackManager.js la procese
//   - Usa capture: true para ejecutarse antes que handleEmojiKeyboard
//   - Si la tecla es R y NO se esta escribiendo en un input/textarea,
//     detiene la propagacion para que handleEmojiKeyboard no la reciba
//   - La R sigue funcionando normalmente para escribir texto
//
// NO TOCAR:
//   - emojiTrackManager.js: no se modifica
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDisableRotateShortcut);
} else {
    initDisableRotateShortcut();
}

function initDisableRotateShortcut() {
    // Esperar a que emojiTrackManager.js defina handleEmojiKeyboard
    function tryOverride() {
        if (typeof handleEmojiKeyboard !== 'function') {
            setTimeout(tryOverride, 100);
            return;
        }

        // Guardar la funcion original
        var originalHandler = handleEmojiKeyboard;

        // Remover el listener original de document
        document.removeEventListener('keydown', originalHandler);

        // Crear nueva version que ignora la R
        var newHandler = function(e) {
            // No interferir si se esta escribiendo en un input o textarea
            if (e.target.matches('input, textarea')) return;

            var key = e.key.toLowerCase();

            // Si es R, ignorar completamente (no rotar)
            if (key === 'r') {
                console.log('disableRotateShortcut: tecla R ignorada (rotacion desactivada)');
                return;
            }

            // Para todas las demas teclas, llamar el handler original
            originalHandler(e);
        };

        // Agregar el nuevo listener
        document.addEventListener('keydown', newHandler);

        // Sobrescribir la variable global por si otros archivos la referencian
        handleEmojiKeyboard = newHandler;

        console.log('disableRotateShortcut: handleEmojiKeyboard sobrescrito, R desactivada');
    }
    tryOverride();
}
