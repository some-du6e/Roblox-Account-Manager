// Main application entry point
class App {
    constructor() {
        this.initialized = false;
        this.version = '1.0.0';
        this.windowId = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.handleAppEvents = this.handleAppEvents.bind(this);
    }

    async init() {
        try {
            console.log('Initializing Roblox Account Manager...');
            
            // Show loading screen
            Loading.show('Initializing application...');

            // Initialize Neutralino
            await this.initializeNeutrino();

            // Initialize storage
            Loading.updateText('Initializing storage...');
            await Storage.init();

            // Initialize account manager
            Loading.updateText('Loading accounts...');
            await AccountManager.instance.init();

            // Setup event listeners
            Loading.updateText('Setting up interface...');
            await this.setupEventListeners();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Setup window controls
            this.setupWindowControls();

            // Setup theme
            this.setupTheme();

            // Check for updates
            await this.checkForUpdates();

            // Hide loading screen
            Loading.hide();

            // Show welcome message
            if (AccountManager.instance.accounts.length === 0) {
                this.showWelcomeMessage();
            }

            this.initialized = true;
            console.log('Roblox Account Manager initialized successfully');

            // Analytics (if enabled)
            this.trackAppStart();

        } catch (error) {
            console.error('Failed to initialize application:', error);
            Loading.hide();
            Toast.error('Initialization Failed', `Failed to start application: ${error.message}`);
        }
    }

    async initializeNeutrino() {
        try {
            if (typeof Neutralino !== 'undefined') {
                // Initialize Neutralino
                await Neutralino.init();

                // Set up app events
                Neutralino.events.on('windowClose', () => {
                    this.handleAppExit();
                });

                Neutralino.events.on('serverOffline', () => {
                    console.log('Neutralino server is offline');
                });

                // Get window ID
                this.windowId = await Neutralino.window.getTitle();

                console.log('Neutralino initialized successfully');
            } else {
                console.warn('Neutralino not available, running in browser mode');
            }
        } catch (error) {
            console.error('Failed to initialize Neutralino:', error);
            // Continue without Neutralino features
        }
    }

    async setupEventListeners() {
        // Header button events
        this.setupHeaderButtons();

        // Toolbar button events
        this.setupToolbarButtons();

        // Import/Export events
        this.setupImportExport();

        // Theme events
        this.setupThemeEvents();

        // Window events
        this.setupWindowEvents();

        // Account list events
        this.setupAccountListEvents();

        // Search and filter events
        this.setupSearchAndFilter();
    }

    setupHeaderButtons() {
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                SettingsModal.showSettings();
            });
        }

        // Theme button
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.showThemeSelector();
            });
        }

        // Window control buttons
        const minimizeBtn = document.getElementById('minimizeBtn');
        const maximizeBtn = document.getElementById('maximizeBtn');
        const closeBtn = document.getElementById('closeBtn');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', async () => {
                try {
                    if (typeof Neutralino !== 'undefined') {
                        await Neutralino.window.minimize();
                    }
                } catch (error) {
                    console.error('Failed to minimize window:', error);
                }
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', async () => {
                try {
                    if (typeof Neutralino !== 'undefined') {
                        const isMaximized = await Neutralino.window.isMaximized();
                        if (isMaximized) {
                            await Neutralino.window.unmaximize();
                        } else {
                            await Neutralino.window.maximize();
                        }
                    }
                } catch (error) {
                    console.error('Failed to toggle maximize window:', error);
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.handleAppExit();
            });
        }
    }

    setupToolbarButtons() {
        // Add account button
        const addAccountBtn = document.getElementById('addAccountBtn');
        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', () => {
                AccountModal.showAddAccount();
            });
        }

        // Import button
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportDialog();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportDialog();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AccountManager.instance.checkAllAccounts();
            });
        }
    }

    setupImportExport() {
        // File input for import
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.txt,.csv';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    await AccountManager.instance.importAccounts(text);
                } catch (error) {
                    Toast.error('Import Failed', error.message);
                }
            }
            fileInput.value = ''; // Reset input
        });

        this.fileInput = fileInput;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Handle keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        AccountModal.showAddAccount();
                        break;
                    
                    case 'r':
                        e.preventDefault();
                        AccountManager.instance.checkAllAccounts();
                        break;
                    
                    case 'f':
                        e.preventDefault();
                        const searchInput = document.getElementById('searchInput');
                        if (searchInput) {
                            searchInput.focus();
                        }
                        break;
                    
                    case 'a':
                        if (e.shiftKey) {
                            e.preventDefault();
                            AccountManager.instance.selectAll(true);
                        }
                        break;
                    
                    case 'd':
                        if (e.shiftKey) {
                            e.preventDefault();
                            AccountManager.instance.selectAll(false);
                        }
                        break;
                    
                    case 'l':
                        e.preventDefault();
                        AccountManager.instance.launchSelected();
                        break;
                    
                    case ',':
                        e.preventDefault();
                        SettingsModal.showSettings();
                        break;
                }
            }

            // Delete key to delete selected accounts
            if (e.key === 'Delete' && AccountManager.instance.selectedAccounts.length > 0) {
                this.deleteSelectedAccounts();
            }

            // F5 to refresh
            if (e.key === 'F5') {
                e.preventDefault();
                AccountManager.instance.checkAllAccounts();
            }

            // Escape to clear selection
            if (e.key === 'Escape') {
                AccountManager.instance.selectAll(false);
                ContextMenu.hide();
            }
        });
    }

    setupWindowControls() {
        // Make header draggable
        const header = document.querySelector('.header');
        if (header && typeof Neutralino !== 'undefined') {
            let isDragging = false;
            let startX, startY;

            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.header-btn')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
            });

            document.addEventListener('mousemove', async (e) => {
                if (!isDragging) return;
                
                try {
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    await Neutralino.window.move(deltaX, deltaY);
                } catch (error) {
                    // Ignore move errors
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // Double-click to maximize/restore
            header.addEventListener('dblclick', async (e) => {
                if (e.target.closest('.header-btn')) return;
                try {
                    const isMaximized = await Neutralino.window.isMaximized();
                    if (isMaximized) {
                        await Neutralino.window.unmaximize();
                    } else {
                        await Neutralino.window.maximize();
                    }
                } catch (error) {
                    console.error('Failed to toggle maximize:', error);
                }
            });
        }
    }

    setupTheme() {
        // Apply saved theme
        const theme = AccountManager.instance.settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }

    setupThemeEvents() {
        // Theme selector
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-theme-selector]')) {
                const theme = e.target.closest('[data-theme-selector]').dataset.themeSelector;
                AccountManager.instance.applyTheme(theme);
            }
        });
    }

    setupWindowEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            // Update layout if needed
            this.updateLayout();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            Toast.info('Connection Restored', 'Internet connection is back online');
        });

        window.addEventListener('offline', () => {
            Toast.warning('Connection Lost', 'Internet connection is offline');
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    setupAccountListEvents() {
        // Account card interactions are handled in AccountManager
    }

    setupSearchAndFilter() {
        // Search and filter interactions are handled in AccountManager
    }

    async showThemeSelector() {
        const themes = [
            { name: 'Dark', value: 'dark' },
            { name: 'Light', value: 'light' },
            { name: 'Blue', value: 'blue' },
            { name: 'Green', value: 'green' },
            { name: 'Purple', value: 'purple' },
            { name: 'Orange', value: 'orange' },
            { name: 'Red', value: 'red' },
            { name: 'Roblox', value: 'roblox' },
            { name: 'High Contrast', value: 'high-contrast' }
        ];

        const currentTheme = AccountManager.instance.settings.theme;

        const themeOptions = themes.map(theme => `
            <div class="theme-option ${theme.value === currentTheme ? 'active' : ''}" data-theme="${theme.value}">
                <div class="theme-preview" data-theme="${theme.value}"></div>
                <div class="theme-name">${theme.name}</div>
            </div>
        `).join('');

        const modal = Modal.create({
            title: 'Select Theme',
            content: `
                <div class="theme-selector">
                    ${themeOptions}
                </div>
            `,
            buttons: [
                { text: 'Close', class: 'btn-primary', dismiss: true }
            ]
        });

        // Handle theme selection
        modal.modal.addEventListener('click', (e) => {
            const themeOption = e.target.closest('.theme-option');
            if (themeOption) {
                const theme = themeOption.dataset.theme;
                AccountManager.instance.applyTheme(theme);
                modal.hide();
            }
        });

        modal.show();
    }

    async showImportDialog() {
        const modal = Modal.create({
            title: 'Import Accounts',
            content: `
                <div class="import-options">
                    <h4>Import Methods:</h4>
                    <button type="button" class="btn btn-primary btn-block" data-action="import-file">
                        <i class="fas fa-file"></i> Import from File (JSON, TXT, CSV)
                    </button>
                    <button type="button" class="btn btn-secondary btn-block" data-action="import-text">
                        <i class="fas fa-keyboard"></i> Paste Text Data
                    </button>
                    <hr>
                    <div class="import-formats">
                        <h5>Supported Formats:</h5>
                        <ul>
                            <li><strong>JSON:</strong> Exported account data</li>
                            <li><strong>Text:</strong> username:password per line</li>
                            <li><strong>CSV:</strong> Comma-separated values</li>
                        </ul>
                    </div>
                </div>
            `,
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', dismiss: true }
            ]
        });

        modal.modal.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                modal.hide();
                if (action === 'import-file') {
                    this.fileInput.click();
                } else if (action === 'import-text') {
                    this.showTextImportDialog();
                }
            }
        });

        modal.show();
    }

    async showTextImportDialog() {
        const modal = Modal.create({
            title: 'Import Text Data',
            content: `
                <div class="form-group">
                    <label>Paste your account data below:</label>
                    <textarea id="importTextArea" rows="10" style="width: 100%; font-family: monospace;" placeholder="username:password
username2:password2
..."></textarea>
                </div>
                <p><small>Format: username:password per line</small></p>
            `,
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', dismiss: true },
                { text: 'Import', class: 'btn-primary', action: 'import' }
            ]
        });

        modal.modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'import') {
                const textArea = modal.modal.querySelector('#importTextArea');
                const text = textArea.value.trim();
                if (text) {
                    try {
                        await AccountManager.instance.importAccounts(text);
                        modal.hide();
                    } catch (error) {
                        Toast.error('Import Failed', error.message);
                    }
                }
            }
        });

        modal.show();
    }

    async showExportDialog() {
        const modal = Modal.create({
            title: 'Export Accounts',
            content: `
                <div class="export-options">
                    <div class="form-group">
                        <label>Export Format:</label>
                        <select id="exportFormat">
                            <option value="json">JSON (Full Data)</option>
                            <option value="text">Text (Username:Password)</option>
                            <option value="csv">CSV (Spreadsheet)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="includePasswords"> Include passwords
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Accounts to export:</label>
                        <div>
                            <label><input type="radio" name="exportSelection" value="all" checked> All accounts (${AccountManager.instance.accounts.length})</label>
                        </div>
                        <div>
                            <label><input type="radio" name="exportSelection" value="selected"> Selected accounts (${AccountManager.instance.selectedAccounts.length})</label>
                        </div>
                        <div>
                            <label><input type="radio" name="exportSelection" value="valid"> Valid accounts only</label>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', dismiss: true },
                { text: 'Export', class: 'btn-primary', action: 'export' }
            ]
        });

        modal.modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'export') {
                const format = modal.modal.querySelector('#exportFormat').value;
                const includePasswords = modal.modal.querySelector('#includePasswords').checked;
                const selection = modal.modal.querySelector('input[name="exportSelection"]:checked').value;

                try {
                    await this.exportAccounts(format, includePasswords, selection);
                    modal.hide();
                } catch (error) {
                    Toast.error('Export Failed', error.message);
                }
            }
        });

        modal.show();
    }

    async exportAccounts(format, includePasswords, selection) {
        let accountsToExport = [];

        switch (selection) {
            case 'all':
                accountsToExport = AccountManager.instance.accounts;
                break;
            case 'selected':
                accountsToExport = AccountManager.instance.selectedAccounts;
                break;
            case 'valid':
                accountsToExport = AccountManager.instance.accounts.filter(acc => acc.isValid());
                break;
        }

        if (accountsToExport.length === 0) {
            Toast.warning('No Accounts', 'No accounts to export');
            return;
        }

        await AccountManager.instance.exportAccounts(format, includePasswords);
    }

    async deleteSelectedAccounts() {
        if (AccountManager.instance.selectedAccounts.length === 0) return;

        const count = AccountManager.instance.selectedAccounts.length;
        const confirmDelete = await Modal.confirm(
            `Are you sure you want to delete ${count} selected account(s)?\n\nThis action cannot be undone.`,
            'Delete Accounts'
        );

        if (confirmDelete) {
            const selectedIds = AccountManager.instance.selectedAccounts.map(acc => acc.id);
            
            for (const accountId of selectedIds) {
                await AccountManager.instance.deleteAccount(accountId);
            }
        }
    }

    showWelcomeMessage() {
        const modal = Modal.create({
            title: 'Welcome to Roblox Account Manager',
            content: `
                <div class="welcome-content">
                    <h3>Getting Started</h3>
                    <p>Welcome! It looks like this is your first time using Roblox Account Manager.</p>
                    
                    <h4>Quick Start:</h4>
                    <ol>
                        <li>Click "Add Account" to add your first Roblox account</li>
                        <li>Use the search and filter options to organize your accounts</li>
                        <li>Right-click on accounts for additional options</li>
                        <li>Select multiple accounts and launch them together</li>
                    </ol>
                    
                    <h4>Features:</h4>
                    <ul>
                        <li>Multiple account management</li>
                        <li>Account validation and status checking</li>
                        <li>Game launching with specific accounts</li>
                        <li>Import/export account data</li>
                        <li>Customizable themes</li>
                        <li>Secure password storage</li>
                    </ul>
                    
                    <p><strong>Note:</strong> Your data is stored locally and securely on your device.</p>
                </div>
            `,
            buttons: [
                { text: 'Add First Account', class: 'btn-primary', action: 'add-account' },
                { text: 'Close', class: 'btn-secondary', dismiss: true }
            ]
        });

        modal.modal.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'add-account') {
                modal.hide();
                AccountModal.showAddAccount();
            }
        });

        modal.show();
    }

    async checkForUpdates() {
        // In a real implementation, this would check for app updates
        try {
            // Mock update check
            console.log('Checking for updates...');
            // For now, just log that we're checking
        } catch (error) {
            console.error('Failed to check for updates:', error);
        }
    }

    trackAppStart() {
        // Analytics tracking (if enabled and privacy-compliant)
        try {
            if (AccountManager.instance.settings.allowAnalytics) {
                // Track app start event
                console.log('App started', {
                    version: this.version,
                    accountCount: AccountManager.instance.accounts.length,
                    theme: AccountManager.instance.settings.theme
                });
            }
        } catch (error) {
            console.error('Failed to track app start:', error);
        }
    }

    updateLayout() {
        // Update layout on window resize
        // This can be implemented based on specific needs
    }

    hasUnsavedChanges() {
        // Check if there are any unsaved changes
        // For now, return false as auto-save is implemented
        return false;
    }

    async handleAppExit() {
        try {
            // Save any pending data
            await AccountManager.instance.saveData();
            
            // Close application
            if (typeof Neutralino !== 'undefined') {
                await Neutralino.app.exit();
            } else {
                window.close();
            }
        } catch (error) {
            console.error('Failed to exit application:', error);
            // Force close
            if (typeof Neutralino !== 'undefined') {
                await Neutralino.app.exit(1);
            }
        }
    }

    handleAppEvents() {
        // Handle various app events
        AccountManager.instance.on('accountsChanged', (data) => {
            // Update UI when accounts change
            console.log('Accounts changed:', data);
        });

        AccountManager.instance.on('settingsChanged', (data) => {
            // Handle settings changes
            console.log('Settings changed:', data);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.app = new App();
        await window.app.init();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; text-align: center; color: #ffffff; background: #1e1e1e;">
                <h1>Failed to Initialize</h1>
                <p>An error occurred while starting the application:</p>
                <p style="color: #ff6b6b; font-family: monospace;">${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007acc; border: none; color: white; border-radius: 4px; cursor: pointer;">
                    Reload Application
                </button>
            </div>
        `;
    }
});
