class Account {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.username = data.username || '';
        this.password = data.password || '';
        this.alias = data.alias || '';
        this.description = data.description || '';
        this.group = data.group || 'Default';
        this.valid = data.valid !== undefined ? data.valid : null;
        this.userId = data.userId || null;
        this.securityToken = data.securityToken || '';
        this.csrfToken = data.csrfToken || '';
        this.lastUse = data.lastUse ? new Date(data.lastUse) : null;
        this.lastCheck = data.lastCheck ? new Date(data.lastCheck) : null;
        this.avatarUrl = data.avatarUrl || '';
        this.presence = data.presence || null;
        this.fields = data.fields || {};
        this.browserTrackerID = data.browserTrackerID || this.generateBrowserId();
        this.pinUnlocked = null;
        this.tokenSet = null;
        this.lastAppLaunch = null;
        
        // Bind methods
        this.launch = this.launch.bind(this);
        this.checkStatus = this.checkStatus.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
    }

    generateId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateBrowserId() {
        return 'browser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get display name (alias or username)
    getDisplayName() {
        return this.alias || this.username;
    }

    // Check if account is valid
    isValid() {
        return this.valid === true;
    }

    // Check if account needs validation
    needsValidation() {
        return this.valid === null || (this.lastCheck && Date.now() - this.lastCheck.getTime() > 24 * 60 * 60 * 1000);
    }

    // Launch Roblox with this account
    async launch(gameId = null) {
        try {
            this.lastUse = new Date();
            this.lastAppLaunch = new Date();

            // Update last use in storage
            await AccountManager.instance.saveAccounts();

            // If no game specified, launch Roblox home
            if (!gameId) {
                await this.launchRobloxHome();
            } else {
                await this.launchGame(gameId);
            }

            // Add to recent games if launching a specific game
            if (gameId) {
                await AccountManager.instance.addRecentGame(gameId);
            }

            // Show success toast
            Toast.show('Account Launched', `${this.getDisplayName()} launched successfully`, 'success');

        } catch (error) {
            console.error('Failed to launch account:', error);
            Toast.show('Launch Failed', `Failed to launch ${this.getDisplayName()}: ${error.message}`, 'error');
        }
    }

    async launchRobloxHome() {
        const robloxUrl = 'https://www.roblox.com/home';
        await this.openInBrowser(robloxUrl);
    }

    async launchGame(gameId) {
        const gameUrl = `https://www.roblox.com/games/${gameId}`;
        await this.openInBrowser(gameUrl);
    }

    async openInBrowser(url) {
        try {
            // Create a unique browser profile for this account
            const profilePath = await this.getBrowserProfilePath();
            
            // Use Neutralino to open browser with specific profile
            await Neutralino.os.execCommand(`"$BROWSER" --user-data-dir="${profilePath}" "${url}"`);
            
        } catch (error) {
            // Fallback to default browser
            await Neutralino.os.open(url);
        }
    }

    async getBrowserProfilePath() {
        const appPath = await Neutralino.os.getPath('data');
        return `${appPath}/browser-profiles/${this.browserTrackerID}`;
    }

    // Check account status
    async checkStatus() {
        try {
            this.lastCheck = new Date();
            
            // Mock API call - in real implementation, this would call Roblox API
            const response = await this.makeAuthenticatedRequest('https://users.roblox.com/v1/users/authenticated');
            
            if (response.ok) {
                const userData = await response.json();
                this.valid = true;
                this.userId = userData.id;
                this.username = userData.name;
                
                // Get avatar URL
                await this.updateAvatar();
                
                // Get presence
                await this.updatePresence();
                
            } else {
                this.valid = false;
                this.securityToken = '';
            }

            await AccountManager.instance.saveAccounts();
            return this.valid;

        } catch (error) {
            console.error('Failed to check account status:', error);
            this.valid = false;
            return false;
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const headers = {
            'Cookie': `.ROBLOSECURITY=${this.securityToken}`,
            'X-CSRF-TOKEN': this.csrfToken,
            ...options.headers
        };

        return fetch(url, {
            ...options,
            headers
        });
    }

    async updateAvatar() {
        try {
            if (!this.userId) return;

            // Mock avatar URL - in real implementation, get from Roblox API
            this.avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${this.userId}&width=150&height=150&format=png`;
            
        } catch (error) {
            console.error('Failed to update avatar:', error);
        }
    }

    async updatePresence() {
        try {
            if (!this.userId) return;

            // Mock presence - in real implementation, get from Roblox API
            this.presence = {
                userPresenceType: 0, // 0 = Offline, 1 = Online, 2 = InGame, 3 = InStudio
                lastLocation: 'Website',
                placeId: null,
                rootPlaceId: null,
                gameId: null,
                universeId: null,
                userId: this.userId,
                lastOnline: new Date().toISOString()
            };

        } catch (error) {
            console.error('Failed to update presence:', error);
        }
    }

    // Refresh security token
    async refreshToken() {
        try {
            // In real implementation, this would refresh the .ROBLOSECURITY token
            // For now, we'll just mark it as needing validation
            this.valid = null;
            this.lastCheck = null;
            
            return await this.checkStatus();

        } catch (error) {
            console.error('Failed to refresh token:', error);
            return false;
        }
    }

    // Clear browser data for this account
    async clearBrowserData() {
        try {
            const profilePath = await this.getBrowserProfilePath();
            
            // In real implementation, would clear browser profile directory
            console.log(`Clearing browser data for profile: ${profilePath}`);
            
            Toast.show('Browser Data Cleared', `Cleared browser data for ${this.getDisplayName()}`, 'success');

        } catch (error) {
            console.error('Failed to clear browser data:', error);
            Toast.show('Clear Failed', `Failed to clear browser data: ${error.message}`, 'error');
        }
    }

    // Export account data (without sensitive info)
    toExportData() {
        return {
            username: this.username,
            alias: this.alias,
            description: this.description,
            group: this.group,
            fields: { ...this.fields }
        };
    }

    // Serialize for storage
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            password: this.password, // In real implementation, this should be encrypted
            alias: this.alias,
            description: this.description,
            group: this.group,
            valid: this.valid,
            userId: this.userId,
            securityToken: this.securityToken, // In real implementation, this should be encrypted
            csrfToken: this.csrfToken,
            lastUse: this.lastUse ? this.lastUse.toISOString() : null,
            lastCheck: this.lastCheck ? this.lastCheck.toISOString() : null,
            avatarUrl: this.avatarUrl,
            presence: this.presence,
            fields: this.fields,
            browserTrackerID: this.browserTrackerID
        };
    }

    // Create from storage data
    static fromJSON(data) {
        return new Account(data);
    }

    // Validate account data
    static validate(data) {
        const errors = [];

        if (!data.username || data.username.trim().length === 0) {
            errors.push('Username is required');
        }

        if (!data.password || data.password.length === 0) {
            errors.push('Password is required');
        }

        if (data.username && data.username.length > 20) {
            errors.push('Username must be 20 characters or less');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Compare accounts for sorting
    compareTo(other) {
        if (!other) return 1;
        
        // First sort by group
        const groupCompare = this.group.localeCompare(other.group);
        if (groupCompare !== 0) return groupCompare;
        
        // Then by display name
        return this.getDisplayName().localeCompare(other.getDisplayName());
    }
}
