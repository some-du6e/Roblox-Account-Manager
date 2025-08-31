class Storage {
    constructor() {
        this.cache = new Map();
        this.encryptionKey = null;
        this.initialized = false;
    }

    // Initialize storage
    async init() {
        try {
            // Check if Neutralino storage is available
            if (typeof Neutralino !== 'undefined' && Neutralino.storage) {
                this.storageType = 'neutralino';
            } else {
                this.storageType = 'localStorage';
            }

            // Generate or load encryption key
            await this.initializeEncryption();
            
            this.initialized = true;
            console.log(`Storage initialized with ${this.storageType} backend`);
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            this.storageType = 'localStorage';
            this.initialized = true;
        }
    }

    // Initialize encryption for sensitive data
    async initializeEncryption() {
        try {
            // Try to load existing key
            let keyData = await this.getRaw('encryption_key');
            
            if (!keyData) {
                // Generate new key
                const key = this.generateEncryptionKey();
                await this.setRaw('encryption_key', key);
                this.encryptionKey = key;
            } else {
                this.encryptionKey = keyData;
            }
        } catch (error) {
            console.error('Failed to initialize encryption:', error);
            // Continue without encryption
        }
    }

    // Generate encryption key
    generateEncryptionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Get data from storage
    async get(key, defaultValue = null) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Check cache first
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            let data = await this.getRaw(key);
            
            if (data === null) {
                return defaultValue;
            }

            // Parse JSON data
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (error) {
                    console.error('Failed to parse JSON data:', error);
                    return defaultValue;
                }
            }

            // Cache the result
            this.cache.set(key, data);
            return data;

        } catch (error) {
            console.error('Failed to get data from storage:', error);
            return defaultValue;
        }
    }

    // Set data in storage
    async set(key, value) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Update cache
            this.cache.set(key, value);

            // Serialize data
            const serializedData = JSON.stringify(value);

            // Store data
            await this.setRaw(key, serializedData);

        } catch (error) {
            console.error('Failed to set data in storage:', error);
            throw error;
        }
    }

    // Get encrypted data
    async getSecure(key, defaultValue = null) {
        if (!this.encryptionKey) {
            return this.get(key, defaultValue);
        }

        try {
            const encryptedData = await this.getRaw(`secure_${key}`);
            if (!encryptedData) {
                return defaultValue;
            }

            const decryptedData = await this.decrypt(encryptedData);
            return decryptedData ? JSON.parse(decryptedData) : defaultValue;

        } catch (error) {
            console.error('Failed to get secure data:', error);
            return defaultValue;
        }
    }

    // Set encrypted data
    async setSecure(key, value) {
        if (!this.encryptionKey) {
            return this.set(key, value);
        }

        try {
            const serializedData = JSON.stringify(value);
            const encryptedData = await this.encrypt(serializedData);
            await this.setRaw(`secure_${key}`, encryptedData);

        } catch (error) {
            console.error('Failed to set secure data:', error);
            throw error;
        }
    }

    // Remove data from storage
    async remove(key) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Remove from cache
            this.cache.delete(key);

            // Remove from storage
            if (this.storageType === 'neutralino') {
                await Neutralino.storage.removeData(key);
            } else {
                localStorage.removeItem(key);
            }

        } catch (error) {
            console.error('Failed to remove data from storage:', error);
        }
    }

    // Clear all data
    async clear() {
        try {
            // Clear cache
            this.cache.clear();

            // Clear storage
            if (this.storageType === 'neutralino') {
                // Neutralino doesn't have a clear all method, so we skip this
                console.warn('Clear all not supported with Neutralino storage');
            } else {
                localStorage.clear();
            }

        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    }

    // Get all keys
    async getKeys() {
        try {
            if (this.storageType === 'neutralino') {
                // Neutralino doesn't provide a way to get all keys
                return Array.from(this.cache.keys());
            } else {
                return Object.keys(localStorage);
            }
        } catch (error) {
            console.error('Failed to get storage keys:', error);
            return [];
        }
    }

    // Export all data
    async exportData() {
        try {
            const keys = await this.getKeys();
            const data = {};

            for (const key of keys) {
                if (!key.startsWith('encryption_') && !key.startsWith('secure_')) {
                    data[key] = await this.get(key);
                }
            }

            return data;

        } catch (error) {
            console.error('Failed to export data:', error);
            return {};
        }
    }

    // Import data
    async importData(data) {
        try {
            for (const [key, value] of Object.entries(data)) {
                await this.set(key, value);
            }
        } catch (error) {
            console.error('Failed to import data:', error);
            throw error;
        }
    }

    // Raw storage operations
    async getRaw(key) {
        try {
            if (this.storageType === 'neutralino') {
                return await Neutralino.storage.getData(key);
            } else {
                return localStorage.getItem(key);
            }
        } catch (error) {
            console.error('Failed to get raw data:', error);
            return null;
        }
    }

    async setRaw(key, value) {
        try {
            if (this.storageType === 'neutralino') {
                await Neutralino.storage.setData(key, value);
            } else {
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('Failed to set raw data:', error);
            throw error;
        }
    }

    // Encryption methods (simplified - in production use proper encryption library)
    async encrypt(data) {
        if (!this.encryptionKey) return data;

        try {
            // Simple XOR encryption (not secure for production)
            const key = this.encryptionKey;
            let encrypted = '';
            
            for (let i = 0; i < data.length; i++) {
                const keyChar = key[i % key.length];
                const dataChar = data.charCodeAt(i);
                const keyCode = keyChar.charCodeAt(0);
                encrypted += String.fromCharCode(dataChar ^ keyCode);
            }
            
            return btoa(encrypted);
        } catch (error) {
            console.error('Failed to encrypt data:', error);
            return data;
        }
    }

    async decrypt(encryptedData) {
        if (!this.encryptionKey) return encryptedData;

        try {
            // Simple XOR decryption
            const key = this.encryptionKey;
            const encrypted = atob(encryptedData);
            let decrypted = '';
            
            for (let i = 0; i < encrypted.length; i++) {
                const keyChar = key[i % key.length];
                const encryptedChar = encrypted.charCodeAt(i);
                const keyCode = keyChar.charCodeAt(0);
                decrypted += String.fromCharCode(encryptedChar ^ keyCode);
            }
            
            return decrypted;
        } catch (error) {
            console.error('Failed to decrypt data:', error);
            return encryptedData;
        }
    }

    // Backup and restore
    async createBackup() {
        try {
            const data = await this.exportData();
            const backup = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: data
            };

            return JSON.stringify(backup, null, 2);

        } catch (error) {
            console.error('Failed to create backup:', error);
            throw error;
        }
    }

    async restoreBackup(backupData) {
        try {
            const backup = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
            
            if (!backup.data) {
                throw new Error('Invalid backup format');
            }

            await this.importData(backup.data);
            
            // Clear cache to force reload
            this.cache.clear();

        } catch (error) {
            console.error('Failed to restore backup:', error);
            throw error;
        }
    }

    // Storage info
    async getStorageInfo() {
        try {
            const keys = await this.getKeys();
            let totalSize = 0;

            for (const key of keys) {
                const data = await this.getRaw(key);
                if (data) {
                    totalSize += new Blob([data]).size;
                }
            }

            return {
                storageType: this.storageType,
                keyCount: keys.length,
                totalSize: totalSize,
                cacheSize: this.cache.size,
                encrypted: !!this.encryptionKey
            };

        } catch (error) {
            console.error('Failed to get storage info:', error);
            return {
                storageType: this.storageType,
                keyCount: 0,
                totalSize: 0,
                cacheSize: this.cache.size,
                encrypted: !!this.encryptionKey
            };
        }
    }

    // Cache management
    clearCache() {
        this.cache.clear();
    }

    getCacheSize() {
        return this.cache.size;
    }

    // Check if storage is available
    isAvailable() {
        try {
            if (this.storageType === 'neutralino') {
                return typeof Neutralino !== 'undefined' && Neutralino.storage;
            } else {
                return typeof localStorage !== 'undefined';
            }
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
window.Storage = new Storage();
