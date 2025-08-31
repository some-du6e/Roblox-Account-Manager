/**
 * Main application entry point
 */

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Neutralino if available
        if (typeof Neutralino !== 'undefined') {
            await Neutralino.init();
            
            // Setup Neutralino event listeners
            Neutralino.events.on('windowClose', async () => {
                if (window.accountManager) {
                    await window.accountManager.closeApplication();
                } else {
                    await Neutralino.app.exit();
                }
            });

            Neutralino.events.on('windowFocus', () => {
                console.log('Window focused');
            });

            Neutralino.events.on('windowBlur', () => {
                console.log('Window blurred');
            });
        }

        // Initialize application theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Show loading indicator
        showLoadingIndicator();

        // Initialize all systems
        await initializeApplication();

        // Hide loading indicator
        hideLoadingIndicator();

        console.log('Roblox Account Manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; background: #1a1a1a; color: white; font-family: 'Segoe UI', sans-serif;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                <h2>Failed to Initialize Application</h2>
                <p style="color: #ccc; margin-bottom: 20px;">${error.message}</p>
                <button onclick="location.reload()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Retry</button>
            </div>
        `;
    }
});

/**
 * Initialize the application
 */
async function initializeApplication() {
    // Storage is already initialized in AccountManager constructor
    // AccountManager is already initialized as global instance
    
    // Wait for account manager to finish initialization
    if (window.accountManager) {
        // AccountManager handles its own initialization
        console.log('Account Manager ready');
    }
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Check for updates if enabled
    checkForUpdates();
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
    const loadingHtml = `
        <div id="loadingIndicator" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(26, 26, 26, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 9999;
            color: white;
            font-family: 'Segoe UI', sans-serif;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 3px solid #333;
                border-top: 3px solid #00d4ff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <h3>Loading Roblox Account Manager...</h3>
            <p style="color: #ccc;">Please wait while we initialize your accounts</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            indicator.remove();
        }, 300);
    }
}

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N: Add new account
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (window.accountManager) {
                window.accountManager.openAddAccountModal();
            }
        }
        
        // Ctrl/Cmd + R: Refresh accounts
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (window.accountManager) {
                window.accountManager.refreshAllAccounts();
            }
        }
        
        // Ctrl/Cmd + S: Save (backup)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (window.accountManager) {
                window.accountManager.createBackup();
            }
        }
        
        // Ctrl/Cmd + I: Import accounts
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            if (window.accountManager) {
                window.accountManager.importAccounts();
            }
        }
        
        // Ctrl/Cmd + E: Export accounts
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (window.accountManager) {
                window.accountManager.exportAccounts();
            }
        }
        
        // Ctrl/Cmd + ,: Open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            if (window.accountManager) {
                window.accountManager.openSettings();
            }
        }
        
        // F5: Refresh accounts
        if (e.key === 'F5') {
            e.preventDefault();
            if (window.accountManager) {
                window.accountManager.refreshAllAccounts();
            }
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            if (window.Modal) {
                window.Modal.closeAll();
            }
        }
    });
}

/**
 * Initialize drag and drop functionality
 */
function initializeDragAndDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        document.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        document.body.classList.add('dragover');
    }

    function unhighlight(e) {
        document.body.classList.remove('dragover');
    }

    // Handle dropped files
    document.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                handleImportFile(file);
            } else {
                if (window.Toast) {
                    window.Toast.error('Please drop a JSON file to import accounts');
                }
            }
        }
    }

    async function handleImportFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.accounts && Array.isArray(data.accounts)) {
                // This is an account import file
                if (window.accountManager) {
                    // Process imported accounts
                    for (const accountData of data.accounts) {
                        if (!window.accountManager.accounts.some(acc => acc.username === accountData.username)) {
                            window.accountManager.accounts.push(new Account(accountData));
                        }
                    }
                    
                    await window.accountManager.saveAccounts();
                    window.accountManager.applyFilters();
                    window.accountManager.renderAccounts();
                    
                    if (window.Toast) {
                        window.Toast.success(`Imported ${data.accounts.length} accounts`);
                    }
                }
            } else {
                if (window.Toast) {
                    window.Toast.error('Invalid import file format');
                }
            }
        } catch (error) {
            console.error('Failed to import file:', error);
            if (window.Toast) {
                window.Toast.error('Failed to import file');
            }
        }
    }

    // Add CSS for drag over effect
    const style = document.createElement('style');
    style.textContent = `
        body.dragover {
            background-color: rgba(0, 212, 255, 0.1) !important;
        }
        
        body.dragover::after {
            content: 'Drop JSON file to import accounts';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 212, 255, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Check for application updates
 */
async function checkForUpdates() {
    try {
        // In a real application, this would check a server for updates
        console.log('Checking for updates...');
        
        // Simulate update check
        setTimeout(() => {
            console.log('Update check completed - no updates available');
        }, 1000);
    } catch (error) {
        console.error('Failed to check for updates:', error);
    }
}

/**
 * Handle application errors
 */
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    
    if (window.Toast) {
        window.Toast.error('An unexpected error occurred');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    if (window.Toast) {
        window.Toast.error('An unexpected error occurred');
    }
});

/**
 * Handle window visibility changes
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Window became visible - refresh accounts if enough time has passed
        if (window.accountManager) {
            const lastRefresh = localStorage.getItem('lastRefresh');
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (!lastRefresh || (now - parseInt(lastRefresh)) > fiveMinutes) {
                window.accountManager.refreshAllAccounts();
                localStorage.setItem('lastRefresh', now.toString());
            }
        }
    }
});

/**
 * Utility functions
 */

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate random ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export utility functions to global scope
window.utils = {
    debounce,
    formatDate,
    formatNumber,
    isValidEmail,
    generateId
};

console.log('Application script loaded');
