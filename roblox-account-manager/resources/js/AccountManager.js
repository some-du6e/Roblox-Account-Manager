/**
 * Main Account Manager class
 */
/**
 * Main Account Manager class - Windows Forms Style
 */
class AccountManager {
    constructor() {
        this.accounts = [];
        this.selectedAccounts = [];
        this.selectedAccount = null;
        this.lastValidAccount = null;
        this.recentGames = [];
        this.currentTheme = 'default';
        this.hideUsernames = false;
        this.currentPlaceId = '5315046213';
        this.currentJobId = '';
        this.currentUserId = '';
        this.showGroups = false;
        
        this.robloxAPI = new RobloxAPI();
        this.storage = new Storage();
        
        // Static properties matching original C#
        this.instance = this;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.loadAccounts();
            await this.loadSettings();
            this.setupEventListeners();
            this.applyTheme();
            this.renderAccounts();
            this.updatePlaceInfo();
            this.checkPasswordRequired();
        } catch (error) {
            console.error('Failed to initialize AccountManager:', error);
        }
    }

    /**
     * Setup event listeners - Windows Forms Style
     */
    setupEventListeners() {
        // Top icon controls
        document.getElementById('historyIcon')?.addEventListener('click', () => {
            this.showRecentGames();
        });

        document.getElementById('configBtn')?.addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('donateBtn')?.addEventListener('click', () => {
            this.openDonate();
        });

        // Add Account dropdown
        document.getElementById('addAccountBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown('addAccountMenu');
        });

        // Add Account menu items
        document.querySelectorAll('#addAccountMenu .menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleAddAccountAction(action);
                this.hideDropdowns();
            });
        });

        // Remove button
        document.getElementById('removeBtn')?.addEventListener('click', () => {
            this.removeSelectedAccounts();
        });

        // Open Browser dropdown
        document.getElementById('openBrowserBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown('openBrowserMenu');
        });

        // Open Browser menu items
        document.querySelectorAll('#openBrowserMenu .menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleOpenBrowserAction(action);
                this.hideDropdowns();
            });
        });

        // Theme and control buttons
        document.getElementById('editThemeBtn')?.addEventListener('click', () => {
            this.openThemeEditor();
        });

        document.getElementById('accountControlBtn')?.addEventListener('click', () => {
            this.openAccountControl();
        });

        // Place and Job ID controls
        document.getElementById('placeId')?.addEventListener('input', (e) => {
            this.currentPlaceId = e.target.value;
            this.updatePlaceInfo();
        });

        document.getElementById('placeId')?.addEventListener('click', (e) => {
            e.target.select(); // Select all text for easy replacement
        });

        document.getElementById('jobId')?.addEventListener('input', (e) => {
            this.currentJobId = e.target.value;
        });

        document.getElementById('jobId')?.addEventListener('click', (e) => {
            e.target.select(); // Select all text for easy replacement
        });

        document.getElementById('shuffleIcon')?.addEventListener('click', () => {
            this.shuffleJobId();
        });

        // User controls
        document.getElementById('userId')?.addEventListener('input', (e) => {
            this.currentUserId = e.target.value;
        });

        document.getElementById('followBtn')?.addEventListener('click', () => {
            this.followUser();
        });

        document.getElementById('setAliasBtn')?.addEventListener('click', () => {
            this.setAlias();
        });

        document.getElementById('utilitiesBtn')?.addEventListener('click', () => {
            this.openUtilities();
        });

        // Join controls
        document.getElementById('joinServerBtn')?.addEventListener('click', () => {
            this.joinServer();
        });

        // Description controls
        document.getElementById('setDescriptionBtn')?.addEventListener('click', () => {
            this.setDescription();
        });

        // Additional controls
        document.getElementById('saveToAccountBtn')?.addEventListener('click', () => {
            this.saveToAccount();
        });

        document.getElementById('browserBtn')?.addEventListener('click', () => {
            this.openBrowser();
        });

        document.getElementById('argumentsBtn')?.addEventListener('click', () => {
            this.openArguments();
        });

        document.getElementById('joinDiscordBtn')?.addEventListener('click', () => {
            this.joinDiscord();
        });

        // Hide usernames checkbox
        document.getElementById('hideUsernames')?.addEventListener('change', (e) => {
            this.hideUsernames = e.target.checked;
            this.saveSettings();
            this.renderAccounts();
        });

        // Account list interactions
        document.getElementById('accountsView')?.addEventListener('click', (e) => {
            const row = e.target.closest('.account-row');
            if (row) {
                this.selectAccount(row.dataset.accountId, e.ctrlKey);
            }
        });

        // Context menu
        document.getElementById('accountsView')?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const row = e.target.closest('.account-row');
            if (row) {
                this.selectAccount(row.dataset.accountId, false);
                this.showContextMenu(e.clientX, e.clientY);
            }
        });

        // Password panel controls
        document.getElementById('defaultEncryptionBtn')?.addEventListener('click', () => {
            this.selectDefaultEncryption();
        });

        document.getElementById('passwordEncryptionBtn')?.addEventListener('click', () => {
            this.selectPasswordEncryption();
        });

        document.getElementById('unlockBtn')?.addEventListener('click', () => {
            this.unlockWithPassword();
        });

        document.getElementById('setPasswordBtn')?.addEventListener('click', () => {
            this.setPassword();
        });

        document.getElementById('passwordTextBox')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.unlockWithPassword();
            }
        });

        document.getElementById('passwordSetupTextBox')?.addEventListener('input', (e) => {
            document.getElementById('setPasswordBtn').disabled = e.target.value.length < 3;
        });

        // Global click handler to hide dropdowns
        document.addEventListener('click', () => {
            this.hideDropdowns();
        });

        // Context menu hide
        document.addEventListener('click', () => {
            document.getElementById('accountContextMenu').style.display = 'none';
        });
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

    // Windows Forms Specific Methods

    /**
     * Update place information based on Place ID
     */
    async updatePlaceInfo() {
        const placeId = document.getElementById('placeId')?.value;
        if (!placeId || isNaN(placeId)) {
            document.getElementById('currentPlace').textContent = 'Invalid Place ID';
            return;
        }

        try {
            const placeInfo = await this.robloxAPI.getPlaceInfo(placeId);
            document.getElementById('currentPlace').textContent = placeInfo.name || 'Unknown Place';
        } catch (error) {
            document.getElementById('currentPlace').textContent = 'Error loading place';
        }
    }

    /**
     * Shuffle Job ID
     */
    shuffleJobId() {
        // Generate a random Job ID (similar to Roblox format)
        const jobId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        
        document.getElementById('jobId').value = jobId;
        this.currentJobId = jobId;
    }

    /**
     * Toggle dropdown menu visibility
     */
    toggleDropdown(menuId) {
        const menu = document.getElementById(menuId);
        if (menu) {
            const isShown = menu.classList.contains('show');
            this.hideDropdowns();
            if (!isShown) {
                menu.classList.add('show');
            }
        }
    }

    /**
     * Hide all dropdown menus
     */
    hideDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    /**
     * Handle Add Account dropdown actions
     */
    handleAddAccountAction(action) {
        switch (action) {
            case 'manual':
                this.openAddAccountModal();
                break;
            case 'userpass':
                this.showBulkImportDialog();
                break;
            case 'cookie':
                this.showCookieImportDialog();
                break;
            case 'custom':
                this.showCustomImportDialog();
                break;
        }
    }

    /**
     * Handle Open Browser dropdown actions
     */
    handleOpenBrowserAction(action) {
        switch (action) {
            case 'customurl':
                this.openCustomURL();
                break;
            case 'urljs':
                this.openURLWithJS();
                break;
            case 'joingroup':
                this.showJoinGroupDialog();
                break;
        }
    }

    /**
     * Render accounts in Windows Forms ListView style
     */
    renderAccounts() {
        const accountsView = document.getElementById('accountsView');
        if (!accountsView) return;

        accountsView.innerHTML = '';

        this.accounts.forEach(account => {
            const row = document.createElement('div');
            row.className = 'account-row';
            row.dataset.accountId = account.id;

            const usernameCell = document.createElement('div');
            usernameCell.className = 'account-cell';
            usernameCell.style.width = this.hideUsernames ? '0px' : '130px';
            usernameCell.textContent = this.hideUsernames ? '' : account.username;

            const aliasCell = document.createElement('div');
            aliasCell.className = 'account-cell';
            aliasCell.style.width = '120px';
            aliasCell.textContent = account.alias || '';

            const descriptionCell = document.createElement('div');
            descriptionCell.className = 'account-cell';
            descriptionCell.style.width = '200px';
            descriptionCell.textContent = account.description || '';

            row.appendChild(usernameCell);
            row.appendChild(aliasCell);
            row.appendChild(descriptionCell);

            accountsView.appendChild(row);
        });

        // Update column header visibility
        const usernameHeader = document.querySelector('.column-header:first-child');
        if (usernameHeader) {
            usernameHeader.style.width = this.hideUsernames ? '0px' : '130px';
        }
    }

    /**
     * Select account(s)
     */
    selectAccount(accountId, multiSelect = false) {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        if (!multiSelect) {
            this.selectedAccounts = [account];
            this.selectedAccount = account;
        } else {
            const index = this.selectedAccounts.findIndex(acc => acc.id === accountId);
            if (index >= 0) {
                this.selectedAccounts.splice(index, 1);
            } else {
                this.selectedAccounts.push(account);
            }
            this.selectedAccount = this.selectedAccounts[0] || null;
        }

        this.updateAccountSelection();
        this.updateSelectedAccountControls();
    }

    /**
     * Update visual selection in account list
     */
    updateAccountSelection() {
        document.querySelectorAll('.account-row').forEach(row => {
            const accountId = row.dataset.accountId;
            const isSelected = this.selectedAccounts.some(acc => acc.id === accountId);
            row.classList.toggle('selected', isSelected);
        });
    }

    /**
     * Update controls based on selected account
     */
    updateSelectedAccountControls() {
        if (this.selectedAccount) {
            document.getElementById('aliasBox').value = this.selectedAccount.alias || '';
            document.getElementById('descriptionBox').value = this.selectedAccount.description || '';
        } else {
            document.getElementById('aliasBox').value = '';
            document.getElementById('descriptionBox').value = '';
        }
    }

    /**
     * Show context menu
     */
    showContextMenu(x, y) {
        const menu = document.getElementById('accountContextMenu');
        if (menu) {
            menu.style.display = 'block';
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
        }
    }

    /**
     * Remove selected accounts
     */
    removeSelectedAccounts() {
        if (this.selectedAccounts.length === 0) return;

        const confirmMessage = `Are you sure you want to remove ${this.selectedAccounts.length} account(s)?`;
        if (confirm(confirmMessage)) {
            this.selectedAccounts.forEach(account => {
                const index = this.accounts.findIndex(acc => acc.id === account.id);
                if (index >= 0) {
                    this.accounts.splice(index, 1);
                }
            });

            this.selectedAccounts = [];
            this.selectedAccount = null;
            this.saveAccounts();
            this.renderAccounts();
        }
    }

    /**
     * Join server with selected accounts
     */
    async joinServer() {
        if (this.selectedAccounts.length === 0) {
            alert('Please select at least one account');
            return;
        }

        const placeId = this.currentPlaceId;
        const jobId = this.currentJobId;

        if (!placeId) {
            alert('Please enter a Place ID');
            return;
        }

        // In the original, this would launch Roblox
        // For web version, we'll show a message
        alert(`Launching ${this.selectedAccounts.length} account(s) to Place ${placeId}${jobId ? ` (Job: ${jobId})` : ''}`);
    }

    /**
     * Follow user
     */
    async followUser() {
        const userId = this.currentUserId;
        if (!userId) {
            alert('Please enter a username or user ID');
            return;
        }

        if (this.selectedAccounts.length === 0) {
            alert('Please select at least one account');
            return;
        }

        alert(`Following user ${userId} with ${this.selectedAccounts.length} account(s)`);
    }

    /**
     * Set alias for selected account
     */
    setAlias() {
        if (!this.selectedAccount) {
            alert('Please select an account');
            return;
        }

        const alias = document.getElementById('aliasBox').value;
        this.selectedAccount.alias = alias;
        this.saveAccounts();
        this.renderAccounts();
    }

    /**
     * Set description for selected account
     */
    setDescription() {
        if (!this.selectedAccount) {
            alert('Please select an account');
            return;
        }

        const description = document.getElementById('descriptionBox').value;
        this.selectedAccount.description = description;
        this.saveAccounts();
        this.renderAccounts();
    }

    /**
     * Save current settings to selected account
     */
    saveToAccount() {
        if (!this.selectedAccount) {
            alert('Please select an account');
            return;
        }

        // Save current place/job IDs as favorites or recent
        const data = {
            placeId: this.currentPlaceId,
            jobId: this.currentJobId,
            timestamp: Date.now()
        };

        if (!this.selectedAccount.savedData) {
            this.selectedAccount.savedData = [];
        }

        this.selectedAccount.savedData.push(data);
        this.saveAccounts();
        alert('Settings saved to account');
    }

    /**
     * Open utilities (server list, etc.)
     */
    openUtilities() {
        alert('Utilities panel would open here (Server List, Games List, Favorites)');
    }

    /**
     * Open theme editor
     */
    openThemeEditor() {
        alert('Theme editor would open here');
    }

    /**
     * Open account control (Nexus)
     */
    openAccountControl() {
        alert('Account Control (Nexus) would open here');
    }

    /**
     * Open browser
     */
    openBrowser() {
        alert('Browser would open here');
    }

    /**
     * Open arguments dialog
     */
    openArguments() {
        alert('Arguments dialog would open here');
    }

    /**
     * Join Discord
     */
    joinDiscord() {
        alert('Opening Discord invite...');
    }

    /**
     * Show recent games
     */
    showRecentGames() {
        alert('Recent games panel would show here');
    }

    /**
     * Open donate page
     */
    openDonate() {
        alert('Opening donation page...');
    }

    /**
     * Check if password is required
     */
    checkPasswordRequired() {
        const hasPassword = this.storage.hasPasswordProtection();
        if (hasPassword) {
            this.showPasswordPanel();
        }
    }

    /**
     * Show password panel
     */
    showPasswordPanel() {
        document.getElementById('passwordPanel').style.display = 'flex';
        document.getElementById('passwordInput').style.display = 'block';
    }

    /**
     * Select default encryption
     */
    selectDefaultEncryption() {
        document.getElementById('encryptionSelection').style.display = 'none';
        document.getElementById('passwordPanel').style.display = 'none';
    }

    /**
     * Select password encryption
     */
    selectPasswordEncryption() {
        document.getElementById('encryptionSelection').style.display = 'none';
        document.getElementById('passwordSetup').style.display = 'block';
    }

    /**
     * Unlock with password
     */
    unlockWithPassword() {
        const password = document.getElementById('passwordTextBox').value;
        if (this.storage.verifyPassword(password)) {
            document.getElementById('passwordPanel').style.display = 'none';
        } else {
            alert('Invalid password');
        }
    }

    /**
     * Set password
     */
    setPassword() {
        const password = document.getElementById('passwordSetupTextBox').value;
        if (password.length >= 3) {
            this.storage.setPassword(password);
            document.getElementById('passwordPanel').style.display = 'none';
            alert('Password set successfully');
        }
    }

    /**
     * Open Add Account Modal
     */
    openAddAccountModal() {
        Modal.open('addAccountModal');
    }
}

// Create global instance
window.accountManager = new AccountManager();
