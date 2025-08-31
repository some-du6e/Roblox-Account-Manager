/**
 * Main application entry point - Windows Forms Style
 */

// Initialize Neutralino
Neutralino.init();

// Set up event listeners for Neutralino events
Neutralino.events.on("windowClose", () => {
    Neutralino.app.exit();
});

Neutralino.events.on("ready", () => {
    console.log("Roblox Account Manager started");
});

// Window controls (for web-based title bar if needed)
function minimizeWindow() {
    Neutralino.window.minimize();
}

function closeWindow() {
    Neutralino.app.exit();
}

function maximizeWindow() {
    Neutralino.window.maximize();
}

// Make functions globally available
window.minimizeWindow = minimizeWindow;
window.closeWindow = closeWindow;
window.maximizeWindow = maximizeWindow;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Account Manager...');
    
    // The AccountManager will be initialized automatically when its class is loaded
    // due to the global instance creation at the bottom of AccountManager.js
});
