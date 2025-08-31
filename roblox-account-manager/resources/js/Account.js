/**
 * Account class for managing individual Roblox accounts
 */
class Account {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.username = data.username || '';
        this.password = data.password || '';
        this.alias = data.alias || '';
        this.description = data.description || '';
        this.avatar = data.avatar || null;
        this.userId = data.userId || null;
        this.isPremium = data.isPremium || false;
        this.joinDate = data.joinDate || null;
        this.lastUsed = data.lastUsed || null;
        this.isOnline = data.isOnline || false;
        this.presence = data.presence || null;
        this.gameInstance = data.gameInstance || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.settings = data.settings || {
            autoLaunch: false,
            customArguments: '',
            preferredServer: null
        };
    }

    /**
     * Generate a unique ID for the account
     */
    generateId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Update account data
     * @param {Object} updates - Object containing updates
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get display name (alias or username)
     */
    getDisplayName() {
        return this.alias || this.username;
    }

    /**
     * Check if account has valid credentials
     */
    isValid() {
        return this.username && this.password;
    }

    /**
     * Get account age in days
     */
    getAccountAge() {
        if (!this.joinDate) return null;
        
        const joinDateObj = new Date(this.joinDate);
        const now = new Date();
        const diffTime = Math.abs(now - joinDateObj);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get last used time in human readable format
     */
    getLastUsedFormatted() {
        if (!this.lastUsed) return 'Never';
        
        const lastUsedDate = new Date(this.lastUsed);
        const now = new Date();
        const diffTime = now - lastUsedDate;
        
        const minutes = Math.floor(diffTime / (1000 * 60));
        const hours = Math.floor(diffTime / (1000 * 60 * 60));
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    /**
     * Mark account as used (update lastUsed timestamp)
     */
    markAsUsed() {
        this.lastUsed = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Set online status
     * @param {boolean} online - Whether the account is online
     * @param {Object} presence - Presence information
     */
    setOnlineStatus(online, presence = null) {
        this.isOnline = online;
        this.presence = presence;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Set game instance
     * @param {Object} gameInstance - Game instance information
     */
    setGameInstance(gameInstance) {
        this.gameInstance = gameInstance;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Clear game instance
     */
    clearGameInstance() {
        this.gameInstance = null;
        this.isOnline = false;
        this.presence = null;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get avatar URL
     * @param {number} size - Avatar size (default: 100)
     */
    getAvatarUrl(size = 100) {
        if (this.avatar) {
            return this.avatar;
        }
        
        if (this.userId) {
            return `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${this.userId}&size=${size}x${size}&format=Png&isCircular=false`;
        }
        
        return null;
    }

    /**
     * Get initials for avatar placeholder
     */
    getInitials() {
        const name = this.getDisplayName();
        if (!name) return '?';
        
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        
        return name.substring(0, 2).toUpperCase();
    }

    /**
     * Export account data (without sensitive information)
     */
    exportData() {
        return {
            id: this.id,
            username: this.username,
            alias: this.alias,
            description: this.description,
            userId: this.userId,
            isPremium: this.isPremium,
            joinDate: this.joinDate,
            lastUsed: this.lastUsed,
            createdAt: this.createdAt,
            settings: { ...this.settings }
        };
    }

    /**
     * Get account summary for display
     */
    getSummary() {
        return {
            id: this.id,
            displayName: this.getDisplayName(),
            username: this.username,
            isOnline: this.isOnline,
            isPremium: this.isPremium,
            lastUsed: this.getLastUsedFormatted(),
            accountAge: this.getAccountAge(),
            avatarUrl: this.getAvatarUrl(),
            initials: this.getInitials()
        };
    }

    /**
     * Clone account (for editing without affecting original)
     */
    clone() {
        return new Account({
            id: this.id,
            username: this.username,
            password: this.password,
            alias: this.alias,
            description: this.description,
            avatar: this.avatar,
            userId: this.userId,
            isPremium: this.isPremium,
            joinDate: this.joinDate,
            lastUsed: this.lastUsed,
            isOnline: this.isOnline,
            presence: this.presence ? { ...this.presence } : null,
            gameInstance: this.gameInstance ? { ...this.gameInstance } : null,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            settings: { ...this.settings }
        });
    }

    /**
     * Validate account data
     * @returns {Object} Validation result with isValid and errors
     */
    validate() {
        const errors = [];
        
        if (!this.username || this.username.trim().length === 0) {
            errors.push('Username is required');
        }
        
        if (!this.password || this.password.trim().length === 0) {
            errors.push('Password is required');
        }
        
        if (this.username && this.username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        
        if (this.username && this.username.length > 20) {
            errors.push('Username must be no more than 20 characters');
        }
        
        if (this.alias && this.alias.length > 50) {
            errors.push('Alias must be no more than 50 characters');
        }
        
        if (this.description && this.description.length > 500) {
            errors.push('Description must be no more than 500 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            password: this.password,
            alias: this.alias,
            description: this.description,
            avatar: this.avatar,
            userId: this.userId,
            isPremium: this.isPremium,
            joinDate: this.joinDate,
            lastUsed: this.lastUsed,
            isOnline: this.isOnline,
            presence: this.presence,
            gameInstance: this.gameInstance,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            settings: this.settings
        };
    }

    /**
     * Create account from JSON data
     * @param {Object} jsonData - JSON data
     */
    static fromJSON(jsonData) {
        return new Account(jsonData);
    }
}
