// BLOQUEO DE HERRAMIENTAS DE DESARROLLO Y ATAJOS DE CLONACIÓN
document.addEventListener('keydown', function (e) {
    // Bloquear F12
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    // Bloquear Ctrl+Shift+I (Inspeccionar), Ctrl+Shift+J (Consola), Ctrl+Shift+C (Elemento)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 69)) {
        e.preventDefault();
        return false;
    }
    // Bloquear Ctrl+U (Ver código fuente)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
        e.preventDefault();
        return false;
    }
    // Bloquear Ctrl+S (Guardar página)
    if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
        e.preventDefault();
        return false;
    }
});

// Bloquear Clic Derecho globalmente
document.addEventListener('contextmenu', event => event.preventDefault());
