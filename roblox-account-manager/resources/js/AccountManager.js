/**
 * Main Account Manager class
 */
class AccountManager {
    constructor() {
        this.accounts = [];
        this.filteredAccounts = [];
        this.selectedAccounts = new Set();
        this.currentSort = 'username';
        this.currentFilters = {
            showOnline: true,
            showOffline: true,
            showPremium: false,
            searchQuery: ''
        };
        this.settings = {};
        this.refreshInterval = null;
        
        this.init();
    }

    /**
     * Initialize the account manager
     */
    async init() {
        try {
            // Initialize storage
            await storage.init();
            
            // Load data
            await this.loadAccounts();
            await this.loadSettings();
            
            // Apply theme
            this.applyTheme(this.settings.theme || 'dark');
            
            // Setup UI event listeners
            this.setupEventListeners();
            
            // Start refresh interval
            this.startRefreshInterval();
            
            // Render initial UI
            this.renderAccounts();
            
            Toast.success('Account Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Account Manager:', error);
            Toast.error('Failed to initialize application');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Header controls
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('minimizeBtn')?.addEventListener('click', () => {
            this.minimizeWindow();
        });

        document.getElementById('closeBtn')?.addEventListener('click', () => {
            this.closeApplication();
        });

        // Toolbar controls
        document.getElementById('addAccountBtn')?.addEventListener('click', () => {
            this.openAddAccountModal();
        });

        document.getElementById('addFirstAccountBtn')?.addEventListener('click', () => {
            this.openAddAccountModal();
        });

        document.getElementById('importBtn')?.addEventListener('click', () => {
            this.importAccounts();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportAccounts();
        });

        // Search and sort
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.updateFilter('searchQuery', e.target.value);
        });

        document.getElementById('sortSelect')?.addEventListener('change', (e) => {
            this.setSortOrder(e.target.value);
        });

        // Sidebar filters
        document.getElementById('showOnline')?.addEventListener('change', (e) => {
            this.updateFilter('showOnline', e.target.checked);
        });

        document.getElementById('showOffline')?.addEventListener('change', (e) => {
            this.updateFilter('showOffline', e.target.checked);
        });

        document.getElementById('showPremium')?.addEventListener('change', (e) => {
            this.updateFilter('showPremium', e.target.checked);
        });

        // Quick actions
        document.getElementById('launchAllBtn')?.addEventListener('click', () => {
            this.launchAllAccounts();
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshAllAccounts();
        });

        document.getElementById('backupBtn')?.addEventListener('click', () => {
            this.createBackup();
        });

        // Theme selector
        document.getElementById('themeSelect')?.addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });

        // Form submissions
        document.getElementById('accountForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddAccount();
        });

        document.getElementById('editAccountForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditAccount();
        });

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
        });

        // Context menu handler
        if (window.contextMenu) {
            window.contextMenu.setItemClickHandler((action, target) => {
                this.handleContextMenuAction(action, target);
            });
        }
    }

    /**
     * Load accounts from storage
     */
    async loadAccounts() {
        try {
            const accountsData = await storage.loadAccounts();
            this.accounts = accountsData.map(data => new Account(data));
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load accounts:', error);
            this.accounts = [];
        }
    }

    /**
     * Save accounts to storage
     */
    async saveAccounts() {
        try {
            await storage.saveAccounts(this.accounts.map(account => account.toJSON()));
            return true;
        } catch (error) {
            console.error('Failed to save accounts:', error);
            Toast.error('Failed to save accounts');
            return false;
        }
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            this.settings = await storage.loadSettings();
            this.applySettingsToUI();
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = {};
        }
    }

    /**
     * Apply settings to UI elements
     */
    applySettingsToUI() {
        // Apply theme
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect && this.settings.theme) {
            themeSelect.value = this.settings.theme;
        }

        // Apply other settings
        const settingsMapping = {
            'autoLogin': 'autoLogin',
            'minimizeToTray': 'minimizeToTray',
            'checkUpdates': 'checkUpdates',
            'encryptData': 'encryptData',
            'requirePassword': 'requirePassword',
            'robloxPath': 'robloxPath',
            'refreshInterval': 'refreshInterval'
        };

        Object.entries(settingsMapping).forEach(([elementId, settingKey]) => {
            const element = document.getElementById(elementId);
            if (element && this.settings[settingKey] !== undefined) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[settingKey];
                } else {
                    element.value = this.settings[settingKey];
                }
            }
        });
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            // Collect settings from UI
            const settingsData = {
                theme: document.getElementById('themeSelect')?.value || 'dark',
                autoLogin: document.getElementById('autoLogin')?.checked || false,
                minimizeToTray: document.getElementById('minimizeToTray')?.checked || true,
                checkUpdates: document.getElementById('checkUpdates')?.checked || true,
                encryptData: document.getElementById('encryptData')?.checked || true,
                requirePassword: document.getElementById('requirePassword')?.checked || false,
                robloxPath: document.getElementById('robloxPath')?.value || '',
                refreshInterval: parseInt(document.getElementById('refreshInterval')?.value) || 5
            };

            this.settings = { ...this.settings, ...settingsData };
            await storage.saveSettings(this.settings);
            
            // Apply settings
            this.applyTheme(this.settings.theme);
            this.updateRefreshInterval();
            
            Modal.close('settingsModal');
            Toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            Toast.error('Failed to save settings');
        }
    }

    /**
     * Add new account
     */
    async addAccount(accountData) {
        try {
            const account = new Account(accountData);
            
            // Validate account
            const validation = account.validate();
            if (!validation.isValid) {
                Toast.error(validation.errors[0]);
                return false;
            }

            // Check for duplicate username
            if (this.accounts.some(acc => acc.username.toLowerCase() === account.username.toLowerCase())) {
                Toast.error('Account with this username already exists');
                return false;
            }

            // Try to get user info from Roblox API
            const userInfo = await robloxAPI.getUserByUsername(account.username);
            if (userInfo.success) {
                account.userId = userInfo.data.id;
                account.isPremium = userInfo.data.hasVerifiedBadge || false;
                account.joinDate = userInfo.data.created;
                
                // Get avatar
                const avatar = await robloxAPI.getUserAvatar(account.userId);
                if (avatar.success) {
                    account.avatar = avatar.url;
                }
            }

            this.accounts.push(account);
            await this.saveAccounts();
            this.applyFilters();
            this.renderAccounts();
            
            Toast.success('Account added successfully');
            return true;
        } catch (error) {
            console.error('Failed to add account:', error);
            Toast.error('Failed to add account');
            return false;
        }
    }

    /**
     * Edit existing account
     */
    async editAccount(accountId, updates) {
        try {
            const account = this.accounts.find(acc => acc.id === accountId);
            if (!account) {
                Toast.error('Account not found');
                return false;
            }

            account.update(updates);
            
            // Validate account
            const validation = account.validate();
            if (!validation.isValid) {
                Toast.error(validation.errors[0]);
                return false;
            }

            await this.saveAccounts();
            this.applyFilters();
            this.renderAccounts();
            
            Toast.success('Account updated successfully');
            return true;
        } catch (error) {
            console.error('Failed to edit account:', error);
            Toast.error('Failed to update account');
            return false;
        }
    }

    /**
     * Delete account
     */
    async deleteAccount(accountId) {
        try {
            const accountIndex = this.accounts.findIndex(acc => acc.id === accountId);
            if (accountIndex === -1) {
                Toast.error('Account not found');
                return false;
            }

            const account = this.accounts[accountIndex];
            
            Modal.confirm(
                'Delete Account',
                `Are you sure you want to delete the account "${account.getDisplayName()}"? This action cannot be undone.`,
                async () => {
                    this.accounts.splice(accountIndex, 1);
                    await this.saveAccounts();
                    this.applyFilters();
                    this.renderAccounts();
                    Toast.success('Account deleted successfully');
                }
            );
            
            return true;
        } catch (error) {
            console.error('Failed to delete account:', error);
            Toast.error('Failed to delete account');
            return false;
        }
    }

    /**
     * Launch Roblox for specific account
     */
    async launchAccount(accountId, gameId = null) {
        try {
            const account = this.accounts.find(acc => acc.id === accountId);
            if (!account) {
                Toast.error('Account not found');
                return false;
            }

            // Mark account as used
            account.markAsUsed();
            await this.saveAccounts();

            // If gameId is provided, launch specific game
            if (gameId) {
                const result = await robloxAPI.launchGame(gameId);
                if (result.success) {
                    Toast.success(`Launching game for ${account.getDisplayName()}`);
                } else {
                    Toast.error('Failed to launch game');
                    return false;
                }
            } else {
                // Launch Roblox client
                if (typeof Neutralino !== 'undefined') {
                    await Neutralino.os.open('roblox://');
                } else {
                    window.open('roblox://', '_blank');
                }
                Toast.success(`Launching Roblox for ${account.getDisplayName()}`);
            }

            this.renderAccounts();
            return true;
        } catch (error) {
            console.error('Failed to launch account:', error);
            Toast.error('Failed to launch Roblox');
            return false;
        }
    }

    /**
     * Refresh account information
     */
    async refreshAccount(accountId) {
        try {
            const account = this.accounts.find(acc => acc.id === accountId);
            if (!account) return false;

            if (account.userId) {
                // Get fresh user info
                const userInfo = await robloxAPI.getUserById(account.userId);
                if (userInfo.success) {
                    account.isPremium = userInfo.data.hasVerifiedBadge || false;
                }

                // Get presence info
                const presence = await robloxAPI.getUserPresence([account.userId]);
                if (presence.success && presence.data.length > 0) {
                    const presenceData = presence.data[0];
                    account.setOnlineStatus(
                        presenceData.userPresenceType > 0,
                        presenceData
                    );
                }

                // Get fresh avatar
                const avatar = await robloxAPI.getUserAvatar(account.userId);
                if (avatar.success) {
                    account.avatar = avatar.url;
                }
            }

            await this.saveAccounts();
            this.renderAccounts();
            return true;
        } catch (error) {
            console.error('Failed to refresh account:', error);
            return false;
        }
    }

    /**
     * Apply filters and sorting
     */
    applyFilters() {
        let filtered = [...this.accounts];

        // Apply online/offline filter
        if (!this.currentFilters.showOnline) {
            filtered = filtered.filter(acc => !acc.isOnline);
        }
        if (!this.currentFilters.showOffline) {
            filtered = filtered.filter(acc => acc.isOnline);
        }

        // Apply premium filter
        if (this.currentFilters.showPremium) {
            filtered = filtered.filter(acc => acc.isPremium);
        }

        // Apply search filter
        if (this.currentFilters.searchQuery) {
            const query = this.currentFilters.searchQuery.toLowerCase();
            filtered = filtered.filter(acc => 
                acc.username.toLowerCase().includes(query) ||
                acc.alias.toLowerCase().includes(query) ||
                acc.description.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'username':
                    return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
                case 'joinDate':
                    return new Date(b.joinDate || 0) - new Date(a.joinDate || 0);
                case 'lastUsed':
                    return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0);
                default:
                    return 0;
            }
        });

        this.filteredAccounts = filtered;
    }

    /**
     * Update filter
     */
    updateFilter(filterName, value) {
        this.currentFilters[filterName] = value;
        this.applyFilters();
        this.renderAccounts();
    }

    /**
     * Set sort order
     */
    setSortOrder(sortBy) {
        this.currentSort = sortBy;
        this.applyFilters();
        this.renderAccounts();
    }

    /**
     * Render accounts in the grid
     */
    renderAccounts() {
        const accountGrid = document.getElementById('accountGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!accountGrid) return;

        if (this.filteredAccounts.length === 0) {
            accountGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        accountGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        accountGrid.innerHTML = this.filteredAccounts.map(account => this.renderAccountCard(account)).join('');

        // Add context menus to account cards
        if (window.contextMenu) {
            window.contextMenu.addTo('.account-card', ContextMenu.getAccountMenuItems);
        }
    }

    /**
     * Render individual account card
     */
    renderAccountCard(account) {
        const summary = account.getSummary();
        const statusClass = summary.isOnline ? 'online' : 'offline';
        const premiumBadge = summary.isPremium ? '<i class="fas fa-crown" title="Premium"></i>' : '';
        
        return `
            <div class="account-card" data-account-id="${account.id}">
                <div class="account-header">
                    <div class="account-avatar">
                        ${summary.avatarUrl ? 
                            `<img src="${summary.avatarUrl}" alt="${summary.displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                            summary.initials
                        }
                    </div>
                    <div class="account-info">
                        <h4>${summary.displayName} ${premiumBadge}</h4>
                        ${account.alias ? `<div class="alias">@${account.username}</div>` : ''}
                    </div>
                </div>
                <div class="account-status">
                    <span class="status-indicator ${statusClass}"></span>
                    <span>${summary.isOnline ? 'Online' : 'Offline'}</span>
                    ${summary.lastUsed !== 'Never' ? `• Last used ${summary.lastUsed}` : ''}
                </div>
                ${account.description ? `<div class="account-description">${account.description}</div>` : ''}
                <div class="account-actions">
                    <button class="btn primary" onclick="accountManager.launchAccount('${account.id}')">
                        <i class="fas fa-play"></i> Launch
                    </button>
                    <button class="btn" onclick="accountManager.editAccountModal('${account.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle context menu actions
     */
    async handleContextMenuAction(action, target) {
        const accountId = target.dataset.accountId;
        if (!accountId) return;

        switch (action) {
            case 'launch':
                await this.launchAccount(accountId);
                break;
            case 'edit':
                this.editAccountModal(accountId);
                break;
            case 'copy':
                await this.copyUsername(accountId);
                break;
            case 'refresh':
                await this.refreshAccount(accountId);
                break;
            case 'viewProfile':
                this.viewProfile(accountId);
                break;
            case 'delete':
                await this.deleteAccount(accountId);
                break;
        }
    }

    /**
     * Handle add account form submission
     */
    async handleAddAccount() {
        const form = document.getElementById('accountForm');
        const formData = new FormData(form);
        
        const accountData = {
            username: formData.get('username'),
            password: formData.get('password'),
            alias: formData.get('alias'),
            description: formData.get('description')
        };

        const success = await this.addAccount(accountData);
        if (success) {
            Modal.close('addAccountModal');
            form.reset();
        }
    }

    /**
     * Handle edit account form submission
     */
    async handleEditAccount() {
        const form = document.getElementById('editAccountForm');
        const formData = new FormData(form);
        
        const accountId = formData.get('id');
        const updates = {
            username: formData.get('username'),
            password: formData.get('password'),
            alias: formData.get('alias'),
            description: formData.get('description')
        };

        const success = await this.editAccount(accountId, updates);
        if (success) {
            Modal.close('editAccountModal');
            form.reset();
        }
    }

    /**
     * Open add account modal
     */
    openAddAccountModal() {
        Modal.open('addAccountModal');
    }

    /**
     * Open edit account modal
     */
    editAccountModal(accountId) {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        // Populate form
        document.getElementById('editAccountId').value = account.id;
        document.getElementById('editUsername').value = account.username;
        document.getElementById('editPassword').value = account.password;
        document.getElementById('editAlias').value = account.alias;
        document.getElementById('editDescription').value = account.description;

        Modal.open('editAccountModal');
    }

    /**
     * Open settings modal
     */
    openSettings() {
        Modal.open('settingsModal');
    }

    /**
     * Copy username to clipboard
     */
    async copyUsername(accountId) {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        try {
            await navigator.clipboard.writeText(account.username);
            Toast.success('Username copied to clipboard');
        } catch (error) {
            console.error('Failed to copy username:', error);
            Toast.error('Failed to copy username');
        }
    }

    /**
     * View profile in browser
     */
    viewProfile(accountId) {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account || !account.userId) return;

        const profileUrl = `https://www.roblox.com/users/${account.userId}/profile`;
        
        if (typeof Neutralino !== 'undefined') {
            Neutralino.os.open(profileUrl);
        } else {
            window.open(profileUrl, '_blank');
        }
    }

    /**
     * Apply theme
     */
    applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        this.settings.theme = themeName;
    }

    /**
     * Launch all accounts
     */
    async launchAllAccounts() {
        if (this.filteredAccounts.length === 0) {
            Toast.warning('No accounts to launch');
            return;
        }

        Modal.confirm(
            'Launch All Accounts',
            `Are you sure you want to launch Roblox for all ${this.filteredAccounts.length} accounts?`,
            async () => {
                for (const account of this.filteredAccounts) {
                    await this.launchAccount(account.id);
                    // Add small delay between launches
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        );
    }

    /**
     * Refresh all accounts
     */
    async refreshAllAccounts() {
        Toast.info('Refreshing all accounts...');
        
        const promises = this.accounts.map(account => this.refreshAccount(account.id));
        await Promise.all(promises);
        
        Toast.success('All accounts refreshed');
    }

    /**
     * Import accounts
     */
    async importAccounts() {
        try {
            const importedAccounts = await storage.importAccounts();
            if (importedAccounts.length > 0) {
                for (const accountData of importedAccounts) {
                    if (!this.accounts.some(acc => acc.username === accountData.username)) {
                        this.accounts.push(new Account(accountData));
                    }
                }
                
                await this.saveAccounts();
                this.applyFilters();
                this.renderAccounts();
            }
        } catch (error) {
            console.error('Import failed:', error);
            Toast.error('Failed to import accounts');
        }
    }

    /**
     * Export accounts
     */
    async exportAccounts() {
        try {
            await storage.exportAccounts(this.accounts.map(acc => acc.exportData()));
        } catch (error) {
            console.error('Export failed:', error);
            Toast.error('Failed to export accounts');
        }
    }

    /**
     * Create backup
     */
    async createBackup() {
        try {
            await storage.createBackup();
        } catch (error) {
            console.error('Backup failed:', error);
            Toast.error('Failed to create backup');
        }
    }

    /**
     * Start refresh interval
     */
    startRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        const intervalMinutes = this.settings.refreshInterval || 5;
        this.refreshInterval = setInterval(() => {
            this.refreshAllAccounts();
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Update refresh interval
     */
    updateRefreshInterval() {
        this.startRefreshInterval();
    }

    /**
     * Minimize window
     */
    async minimizeWindow() {
        if (typeof Neutralino !== 'undefined') {
            try {
                await Neutralino.window.minimize();
            } catch (error) {
                console.error('Failed to minimize window:', error);
            }
        }
    }

    /**
     * Close application
     */
    async closeApplication() {
        Modal.confirm(
            'Close Application',
            'Are you sure you want to close the Roblox Account Manager?',
            async () => {
                if (typeof Neutralino !== 'undefined') {
                    try {
                        await Neutralino.app.exit();
                    } catch (error) {
                        console.error('Failed to close application:', error);
                    }
                } else {
                    window.close();
                }
            }
        );
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            totalAccounts: this.accounts.length,
            onlineAccounts: this.accounts.filter(acc => acc.isOnline).length,
            premiumAccounts: this.accounts.filter(acc => acc.isPremium).length,
            recentlyUsed: this.accounts.filter(acc => {
                if (!acc.lastUsed) return false;
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return new Date(acc.lastUsed) > dayAgo;
            }).length
        };
    }
}

// Create global instance
window.accountManager = new AccountManager();
