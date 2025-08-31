class AccountManager {
    constructor() {
        this.accounts = [];
        this.selectedAccounts = [];
        this.recentGames = [];
        this.groups = ['Default'];
        this.settings = {
            theme: 'dark',
            autoLaunch: false,
            checkOnStartup: true,
            savePasswords: true,
            defaultGroup: 'Default',
            maxRecentGames: 10,
            autoRefreshTokens: true,
            showNotifications: true,
            launchMethod: 'browser', // browser, app, protocol
            browserProfile: 'isolated' // isolated, shared, custom
        };
        
        // UI state
        this.currentView = 'grid'; // grid, list
        this.searchQuery = '';
        this.selectedGroup = '';
        this.sortBy = 'username';
        this.sortOrder = 'asc';
        
        // Event listeners
        this.eventListeners = {
            accountsChanged: [],
            accountSelected: [],
            accountLaunched: [],
            settingsChanged: []
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.loadData = this.loadData.bind(this);
        this.saveData = this.saveData.bind(this);
        this.addAccount = this.addAccount.bind(this);
        this.updateAccount = this.updateAccount.bind(this);
        this.deleteAccount = this.deleteAccount.bind(this);
        this.selectAccount = this.selectAccount.bind(this);
        this.launchSelected = this.launchSelected.bind(this);
        this.checkAllAccounts = this.checkAllAccounts.bind(this);
    }

    // Initialize the account manager
    async init() {
        try {
            await this.loadData();
            await this.setupEventListeners();
            await this.updateUI();
            
            // Check accounts on startup if enabled
            if (this.settings.checkOnStartup) {
                await this.checkAllAccounts();
            }

            console.log('AccountManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AccountManager:', error);
            Toast.show('Initialization Error', error.message, 'error');
        }
    }

    // Load data from storage
    async loadData() {
        try {
            // Load accounts
            const accountsData = await Storage.get('accounts', []);
            this.accounts = accountsData.map(data => Account.fromJSON(data));

            // Load recent games
            const recentGamesData = await Storage.get('recentGames', []);
            this.recentGames = recentGamesData.map(data => Game.fromJSON(data));

            // Load groups
            this.groups = await Storage.get('groups', ['Default']);

            // Load settings
            const savedSettings = await Storage.get('settings', {});
            this.settings = { ...this.settings, ...savedSettings };

            // Apply theme
            this.applyTheme(this.settings.theme);

        } catch (error) {
            console.error('Failed to load data:', error);
            throw error;
        }
    }

    // Save data to storage
    async saveData() {
        try {
            await Storage.set('accounts', this.accounts.map(acc => acc.toJSON()));
            await Storage.set('recentGames', this.recentGames.map(game => game.toJSON()));
            await Storage.set('groups', this.groups);
            await Storage.set('settings', this.settings);
        } catch (error) {
            console.error('Failed to save data:', error);
            throw error;
        }
    }

    // Save accounts only
    async saveAccounts() {
        try {
            await Storage.set('accounts', this.accounts.map(acc => acc.toJSON()));
        } catch (error) {
            console.error('Failed to save accounts:', error);
        }
    }

    // Add new account
    async addAccount(accountData) {
        try {
            // Validate account data
            const validation = Account.validate(accountData);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Check for duplicate username
            const existingAccount = this.accounts.find(acc => 
                acc.username.toLowerCase() === accountData.username.toLowerCase()
            );
            if (existingAccount) {
                throw new Error('An account with this username already exists');
            }

            // Create new account
            const account = new Account(accountData);
            this.accounts.push(account);

            // Add group if it doesn't exist
            if (account.group && !this.groups.includes(account.group)) {
                this.groups.push(account.group);
            }

            // Save and update UI
            await this.saveData();
            await this.updateUI();
            this.emit('accountsChanged', { type: 'add', account });

            // Check account status
            if (this.settings.checkOnStartup) {
                await account.checkStatus();
                await this.saveAccounts();
                await this.updateUI();
            }

            Toast.show('Account Added', `${account.getDisplayName()} has been added successfully`, 'success');
            return account;

        } catch (error) {
            console.error('Failed to add account:', error);
            Toast.show('Add Account Failed', error.message, 'error');
            throw error;
        }
    }

    // Update existing account
    async updateAccount(accountId, updates) {
        try {
            const accountIndex = this.accounts.findIndex(acc => acc.id === accountId);
            if (accountIndex === -1) {
                throw new Error('Account not found');
            }

            // Validate updates
            const updatedData = { ...this.accounts[accountIndex], ...updates };
            const validation = Account.validate(updatedData);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Check for duplicate username (excluding current account)
            if (updates.username) {
                const existingAccount = this.accounts.find(acc => 
                    acc.id !== accountId && 
                    acc.username.toLowerCase() === updates.username.toLowerCase()
                );
                if (existingAccount) {
                    throw new Error('An account with this username already exists');
                }
            }

            // Update account
            Object.assign(this.accounts[accountIndex], updates);

            // Add group if it doesn't exist
            if (updates.group && !this.groups.includes(updates.group)) {
                this.groups.push(updates.group);
            }

            // Save and update UI
            await this.saveData();
            await this.updateUI();
            this.emit('accountsChanged', { type: 'update', account: this.accounts[accountIndex] });

            Toast.show('Account Updated', `${this.accounts[accountIndex].getDisplayName()} has been updated`, 'success');
            return this.accounts[accountIndex];

        } catch (error) {
            console.error('Failed to update account:', error);
            Toast.show('Update Account Failed', error.message, 'error');
            throw error;
        }
    }

    // Delete account
    async deleteAccount(accountId) {
        try {
            const accountIndex = this.accounts.findIndex(acc => acc.id === accountId);
            if (accountIndex === -1) {
                throw new Error('Account not found');
            }

            const account = this.accounts[accountIndex];
            
            // Remove from selected accounts
            this.selectedAccounts = this.selectedAccounts.filter(acc => acc.id !== accountId);

            // Remove account
            this.accounts.splice(accountIndex, 1);

            // Clear browser data
            await account.clearBrowserData();

            // Save and update UI
            await this.saveData();
            await this.updateUI();
            this.emit('accountsChanged', { type: 'delete', account });

            Toast.show('Account Deleted', `${account.getDisplayName()} has been deleted`, 'success');

        } catch (error) {
            console.error('Failed to delete account:', error);
            Toast.show('Delete Account Failed', error.message, 'error');
        }
    }

    // Select/deselect account
    selectAccount(accountId, selected = true) {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        if (selected) {
            if (!this.selectedAccounts.find(acc => acc.id === accountId)) {
                this.selectedAccounts.push(account);
            }
        } else {
            this.selectedAccounts = this.selectedAccounts.filter(acc => acc.id !== accountId);
        }

        this.emit('accountSelected', { account, selected, selectedCount: this.selectedAccounts.length });
        this.updateSelectionUI();
    }

    // Select all filtered accounts
    selectAll(selected = true) {
        const filteredAccounts = this.getFilteredAccounts();
        
        if (selected) {
            filteredAccounts.forEach(account => {
                if (!this.selectedAccounts.find(acc => acc.id === account.id)) {
                    this.selectedAccounts.push(account);
                }
            });
        } else {
            this.selectedAccounts = this.selectedAccounts.filter(selectedAcc => 
                !filteredAccounts.find(filteredAcc => filteredAcc.id === selectedAcc.id)
            );
        }

        this.updateSelectionUI();
        this.updateAccountsUI();
    }

    // Launch selected accounts
    async launchSelected(gameId = null) {
        if (this.selectedAccounts.length === 0) {
            Toast.show('No Selection', 'Please select one or more accounts to launch', 'warning');
            return;
        }

        try {
            const promises = this.selectedAccounts.map(account => 
                account.launch(gameId).catch(error => {
                    console.error(`Failed to launch ${account.getDisplayName()}:`, error);
                    return { account, error };
                })
            );

            const results = await Promise.allSettled(promises);
            const failures = results.filter(result => result.status === 'rejected' || result.value?.error);

            if (failures.length > 0) {
                Toast.show('Launch Partially Failed', `${failures.length} account(s) failed to launch`, 'warning');
            } else {
                Toast.show('Accounts Launched', `${this.selectedAccounts.length} account(s) launched successfully`, 'success');
            }

            this.emit('accountLaunched', { accounts: this.selectedAccounts, gameId });

        } catch (error) {
            console.error('Failed to launch selected accounts:', error);
            Toast.show('Launch Failed', error.message, 'error');
        }
    }

    // Check all accounts status
    async checkAllAccounts() {
        try {
            Loading.show('Checking account status...');

            const promises = this.accounts.map(account => 
                account.checkStatus().catch(error => {
                    console.error(`Failed to check ${account.getDisplayName()}:`, error);
                    return false;
                })
            );

            await Promise.allSettled(promises);
            await this.saveAccounts();
            await this.updateUI();

            const validCount = this.accounts.filter(acc => acc.isValid()).length;
            const totalCount = this.accounts.length;

            Toast.show('Status Check Complete', `${validCount}/${totalCount} accounts are valid`, 'info');

        } catch (error) {
            console.error('Failed to check all accounts:', error);
            Toast.show('Status Check Failed', error.message, 'error');
        } finally {
            Loading.hide();
        }
    }

    // Import accounts from file
    async importAccounts(data) {
        try {
            let importedAccounts = [];
            let skippedCount = 0;

            // Parse import data
            if (typeof data === 'string') {
                // Handle different formats
                if (data.startsWith('[') || data.startsWith('{')) {
                    // JSON format
                    const parsed = JSON.parse(data);
                    importedAccounts = Array.isArray(parsed) ? parsed : [parsed];
                } else {
                    // Text format (username:password per line)
                    const lines = data.split('\n').filter(line => line.trim());
                    importedAccounts = lines.map(line => {
                        const [username, password] = line.split(':');
                        return { username: username?.trim(), password: password?.trim() };
                    });
                }
            } else if (Array.isArray(data)) {
                importedAccounts = data;
            }

            // Process each account
            for (const accountData of importedAccounts) {
                try {
                    // Skip if username already exists
                    const existingAccount = this.accounts.find(acc => 
                        acc.username.toLowerCase() === accountData.username?.toLowerCase()
                    );
                    if (existingAccount) {
                        skippedCount++;
                        continue;
                    }

                    // Validate and add account
                    const validation = Account.validate(accountData);
                    if (validation.valid) {
                        const account = new Account(accountData);
                        this.accounts.push(account);

                        // Add group if it doesn't exist
                        if (account.group && !this.groups.includes(account.group)) {
                            this.groups.push(account.group);
                        }
                    } else {
                        skippedCount++;
                    }
                } catch (error) {
                    console.error('Failed to import account:', error);
                    skippedCount++;
                }
            }

            await this.saveData();
            await this.updateUI();

            const importedCount = importedAccounts.length - skippedCount;
            Toast.show('Import Complete', `${importedCount} accounts imported, ${skippedCount} skipped`, 'success');

        } catch (error) {
            console.error('Failed to import accounts:', error);
            Toast.show('Import Failed', error.message, 'error');
        }
    }

    // Export accounts
    async exportAccounts(format = 'json', includePasswords = false) {
        try {
            const exportData = this.accounts.map(account => {
                if (includePasswords) {
                    return account.toJSON();
                } else {
                    return account.toExportData();
                }
            });

            let exportString;
            if (format === 'json') {
                exportString = JSON.stringify(exportData, null, 2);
            } else if (format === 'csv') {
                const headers = ['Username', 'Alias', 'Group', 'Description'];
                const rows = exportData.map(acc => [
                    acc.username,
                    acc.alias || '',
                    acc.group || 'Default',
                    acc.description || ''
                ]);
                exportString = [headers, ...rows].map(row => row.join(',')).join('\n');
            } else {
                // Text format
                exportString = exportData.map(acc => 
                    includePasswords ? `${acc.username}:${acc.password}` : acc.username
                ).join('\n');
            }

            // Save to file
            const filename = `roblox-accounts-${new Date().toISOString().split('T')[0]}.${format}`;
            await this.saveToFile(exportString, filename);

            Toast.show('Export Complete', `${this.accounts.length} accounts exported`, 'success');

        } catch (error) {
            console.error('Failed to export accounts:', error);
            Toast.show('Export Failed', error.message, 'error');
        }
    }

    // Save content to file
    async saveToFile(content, filename) {
        try {
            const downloadsPath = await Neutralino.os.getPath('downloads');
            const filePath = `${downloadsPath}/${filename}`;
            await Neutralino.filesystem.writeFile(filePath, content);
            return filePath;
        } catch (error) {
            // Fallback to browser download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    // Add recent game
    async addRecentGame(gameData) {
        try {
            let game;
            if (gameData instanceof Game) {
                game = gameData;
            } else if (typeof gameData === 'object') {
                game = new Game(gameData);
            } else {
                // Assume it's a game ID
                game = await Game.fetchGameDetails(gameData);
            }

            // Remove if already exists
            this.recentGames = this.recentGames.filter(g => g.id !== game.id);

            // Add to beginning
            this.recentGames.unshift(game);

            // Limit to max recent games
            if (this.recentGames.length > this.settings.maxRecentGames) {
                this.recentGames = this.recentGames.slice(0, this.settings.maxRecentGames);
            }

            await Storage.set('recentGames', this.recentGames.map(g => g.toJSON()));
            this.updateRecentGamesUI();

        } catch (error) {
            console.error('Failed to add recent game:', error);
        }
    }

    // Get filtered accounts
    getFilteredAccounts() {
        let filtered = [...this.accounts];

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(account => 
                account.username.toLowerCase().includes(query) ||
                account.alias.toLowerCase().includes(query) ||
                account.description.toLowerCase().includes(query)
            );
        }

        // Filter by group
        if (this.selectedGroup) {
            filtered = filtered.filter(account => account.group === this.selectedGroup);
        }

        // Sort
        filtered.sort((a, b) => {
            let result = 0;
            switch (this.sortBy) {
                case 'username':
                    result = a.username.localeCompare(b.username);
                    break;
                case 'alias':
                    result = a.getDisplayName().localeCompare(b.getDisplayName());
                    break;
                case 'group':
                    result = a.group.localeCompare(b.group);
                    break;
                case 'lastUse':
                    const aTime = a.lastUse ? a.lastUse.getTime() : 0;
                    const bTime = b.lastUse ? b.lastUse.getTime() : 0;
                    result = bTime - aTime;
                    break;
                case 'status':
                    result = (b.valid === true ? 1 : 0) - (a.valid === true ? 1 : 0);
                    break;
                default:
                    result = a.compareTo(b);
            }
            
            return this.sortOrder === 'desc' ? -result : result;
        });

        return filtered;
    }

    // Update UI
    async updateUI() {
        this.updateAccountsUI();
        this.updateStatsUI();
        this.updateGroupsUI();
        this.updateRecentGamesUI();
        this.updateSelectionUI();
    }

    // Update accounts UI
    updateAccountsUI() {
        const accountsList = document.getElementById('accountsList');
        if (!accountsList) return;

        const filteredAccounts = this.getFilteredAccounts();
        
        // Clear existing accounts
        accountsList.innerHTML = '';

        // Set view class
        accountsList.className = this.currentView === 'grid' ? 'accounts-grid' : 'accounts-list';

        // Render accounts
        filteredAccounts.forEach(account => {
            const accountElement = this.createAccountElement(account);
            accountsList.appendChild(accountElement);
        });
    }

    // Create account element
    createAccountElement(account) {
        const element = document.createElement('div');
        element.className = 'account-card';
        element.dataset.accountId = account.id;

        const isSelected = this.selectedAccounts.find(acc => acc.id === account.id);
        if (isSelected) {
            element.classList.add('selected');
        }

        const statusClass = account.valid === true ? 'valid' : account.valid === false ? 'invalid' : 'unknown';
        const statusText = account.valid === true ? 'Valid' : account.valid === false ? 'Invalid' : 'Unknown';
        const statusIcon = account.valid === true ? 'check-circle' : account.valid === false ? 'times-circle' : 'question-circle';

        element.innerHTML = `
            <input type="checkbox" class="account-checkbox" ${isSelected ? 'checked' : ''}>
            <div class="account-avatar">
                ${account.avatarUrl ? 
                    `<img src="${account.avatarUrl}" alt="${account.getDisplayName()}" onerror="this.style.display='none';">` :
                    `<i class="fas fa-user placeholder"></i>`
                }
            </div>
            <div class="account-info">
                <div class="account-username">${account.getDisplayName()}</div>
                ${account.alias ? `<div class="account-alias">${account.username}</div>` : ''}
                <div class="account-status ${statusClass}">
                    <i class="fas fa-${statusIcon}"></i>
                    ${statusText}
                </div>
                <div class="account-details">
                    <div class="account-group">${account.group}</div>
                    <div class="account-last-use">${account.lastUse ? this.formatTime(account.lastUse) : 'Never'}</div>
                </div>
            </div>
        `;

        // Add event listeners
        element.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                this.selectAccount(account.id, !isSelected);
            }
        });

        element.addEventListener('dblclick', () => {
            account.launch();
        });

        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            ContextMenu.show(e.clientX, e.clientY, account);
        });

        const checkbox = element.querySelector('.account-checkbox');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.selectAccount(account.id, checkbox.checked);
        });

        return element;
    }

    // Other UI update methods...
    updateStatsUI() {
        const totalElement = document.getElementById('totalAccounts');
        const validElement = document.getElementById('validAccounts');
        const onlineElement = document.getElementById('onlineAccounts');

        if (totalElement) totalElement.textContent = this.accounts.length;
        if (validElement) validElement.textContent = this.accounts.filter(acc => acc.isValid()).length;
        if (onlineElement) onlineElement.textContent = this.accounts.filter(acc => acc.presence?.userPresenceType > 0).length;
    }

    updateGroupsUI() {
        const groupFilter = document.getElementById('groupFilter');
        if (!groupFilter) return;

        groupFilter.innerHTML = '<option value="">All Groups</option>';
        this.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            if (group === this.selectedGroup) {
                option.selected = true;
            }
            groupFilter.appendChild(option);
        });
    }

    updateRecentGamesUI() {
        const recentGamesContainer = document.getElementById('recentGames');
        if (!recentGamesContainer) return;

        recentGamesContainer.innerHTML = '';

        this.recentGames.slice(0, 5).forEach(game => {
            const gameElement = document.createElement('div');
            gameElement.className = 'recent-game-item';
            gameElement.innerHTML = `
                <div class="recent-game-icon">
                    ${game.iconUrl ? 
                        `<img src="${game.getIconUrl(32)}" alt="${game.name}">` :
                        `<i class="fas fa-gamepad"></i>`
                    }
                </div>
                <div class="recent-game-info">
                    <div class="recent-game-name">${game.name}</div>
                    <div class="recent-game-time">${game.getTimeSinceLastPlayed()}</div>
                </div>
            `;

            gameElement.addEventListener('click', () => {
                if (this.selectedAccounts.length > 0) {
                    this.launchSelected(game.id);
                } else {
                    game.launch();
                }
            });

            recentGamesContainer.appendChild(gameElement);
        });
    }

    updateSelectionUI() {
        const selectedCountElement = document.getElementById('selectedCount');
        const selectAllCheckbox = document.getElementById('selectAll');

        if (selectedCountElement) {
            selectedCountElement.textContent = `${this.selectedAccounts.length} selected`;
        }

        if (selectAllCheckbox) {
            const filteredAccounts = this.getFilteredAccounts();
            const allSelected = filteredAccounts.length > 0 && 
                filteredAccounts.every(acc => this.selectedAccounts.find(sel => sel.id === acc.id));
            selectAllCheckbox.checked = allSelected;
        }
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }

    // Setup event listeners
    async setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.updateAccountsUI();
            });
        }

        // Group filter
        const groupFilter = document.getElementById('groupFilter');
        if (groupFilter) {
            groupFilter.addEventListener('change', (e) => {
                this.selectedGroup = e.target.value;
                this.updateAccountsUI();
            });
        }

        // View buttons
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');

        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.currentView = 'grid';
                gridViewBtn.classList.add('active');
                listViewBtn?.classList.remove('active');
                this.updateAccountsUI();
            });
        }

        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.currentView = 'list';
                listViewBtn.classList.add('active');
                gridViewBtn?.classList.remove('active');
                this.updateAccountsUI();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.selectAll(e.target.checked);
            });
        }

        // Action buttons
        const launchSelectedBtn = document.getElementById('launchSelectedBtn');
        if (launchSelectedBtn) {
            launchSelectedBtn.addEventListener('click', () => {
                this.launchSelected();
            });
        }

        const checkAllBtn = document.getElementById('checkAllBtn');
        if (checkAllBtn) {
            checkAllBtn.addEventListener('click', () => {
                this.checkAllAccounts();
            });
        }
    }

    // Apply theme
    applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        this.settings.theme = themeName;
        this.saveData();
        this.emit('settingsChanged', { theme: themeName });
    }

    // Utility methods
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Recently';
    }
}

// Create global instance
AccountManager.instance = new AccountManager();
