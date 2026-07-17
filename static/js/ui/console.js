document.addEventListener('DOMContentLoaded', function() {
    initConsole();
});

function initConsole() {
    const consolePanel = document.getElementById('console-panel');
    const consoleOutput = document.getElementById('console-output');
    const toggleConsoleBtn = document.getElementById('btn-toggle-console');
    const clearConsoleBtn = document.getElementById('btn-clear-console');
    const closeConsoleBtn = document.getElementById('btn-close-console');

    if (toggleConsoleBtn) {
        toggleConsoleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleConsole();
        });
    }

    if (clearConsoleBtn) {
        clearConsoleBtn.addEventListener('click', function() {
            clearConsole();
        });
    }

    if (closeConsoleBtn) {
        closeConsoleBtn.addEventListener('click', function() {
            hideConsole();
        });
    }

    interceptConsole();
}

function toggleConsole() {
    const consolePanel = document.getElementById('console-panel');
    if (consolePanel) {
        consolePanel.style.display = consolePanel.style.display === 'none' ? 'block' : 'none';
    }
}

function hideConsole() {
    const consolePanel = document.getElementById('console-panel');
    if (consolePanel) {
        consolePanel.style.display = 'none';
    }
}

function clearConsole() {
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
        consoleOutput.innerHTML = '<div class="text-white-50 small">Consola limpiada...</div>';
    }
}

function interceptConsole() {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = function(...args) {
        originalLog.apply(console, args);
        addLogToPanel('log', args);
    };

    console.error = function(...args) {
        originalError.apply(console, args);
        addLogToPanel('error', args);
    };

    console.warn = function(...args) {
        originalWarn.apply(console, args);
        addLogToPanel('warn', args);
    };

    console.info = function(...args) {
        originalInfo.apply(console, args);
        addLogToPanel('info', args);
    };

    function addLogToPanel(type, args) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        const logEntry = document.createElement('div');
        logEntry.className = 'console-entry mb-1 small';
        
        let colorClass = 'text-white';
        if (type === 'error') colorClass = 'text-danger';
        else if (type === 'warn') colorClass = 'text-warning';
        else if (type === 'info') colorClass = 'text-info';

        logEntry.innerHTML = `
            <span class="text-white-50">[${timestamp}]</span>
            <span class="${colorClass}">${escapeHtml(message)}</span>
        `;

        consoleOutput.appendChild(logEntry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.addEventListener('error', function(event) {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'console-entry mb-1 small text-danger';
    logEntry.innerHTML = `
        <span class="text-white-50">[${timestamp}]</span>
        <span class="text-danger">ERROR: ${event.message} (${event.filename}:${event.lineno})</span>
    `;
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
});

window.addEventListener('unhandledrejection', function(event) {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'console-entry mb-1 small text-danger';
    logEntry.innerHTML = `
        <span class="text-white-50">[${timestamp}]</span>
        <span class="text-danger">PROMISE ERROR: ${event.reason}</span>
    `;
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
});
