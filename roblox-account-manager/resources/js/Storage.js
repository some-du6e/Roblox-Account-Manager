/**
 * Storage utility class for managing application data
 */
class Storage {
    constructor() {
        this.isNeutralinoAvailable = typeof Neutralino !== 'undefined';
        this.storageFile = 'accounts.json';
        this.settingsFile = 'settings.json';
    }

    /**
     * Initialize storage system
     */
    async init() {
        try {
            if (this.isNeutralinoAvailable) {
                // Initialize Neutralino storage
                await Neutralino.init();
            }
            return true;
        } catch (error) {
            console.warn('Storage initialization failed:', error);
            return false;
        }
    }

    /**
     * Save data to storage
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     */
    async save(key, data) {
        try {
            const jsonData = JSON.stringify(data, null, 2);
            
            if (this.isNeutralinoAvailable) {
                await Neutralino.storage.setData(key, jsonData);
            } else {
                // Fallback to localStorage
                localStorage.setItem(key, jsonData);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }

    /**
     * Load data from storage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     */
    async load(key, defaultValue = null) {
        try {
            let jsonData;
            
            if (this.isNeutralinoAvailable) {
                try {
                    jsonData = await Neutralino.storage.getData(key);
                } catch (error) {
                    // Key doesn't exist, return default
                    return defaultValue;
                }
            } else {
                // Fallback to localStorage
                jsonData = localStorage.getItem(key);
                if (jsonData === null) {
                    return defaultValue;
                }
            }
            
            return JSON.parse(jsonData);
        } catch (error) {
            console.error('Failed to load data:', error);
            return defaultValue;
        }
    }

    /**
     * Delete data from storage
     * @param {string} key - Storage key
     */
    async delete(key) {
        try {
            if (this.isNeutralinoAvailable) {
                await Neutralino.storage.setData(key, '');
            } else {
                localStorage.removeItem(key);
            }
            return true;
        } catch (error) {
            console.error('Failed to delete data:', error);
            return false;
        }
    }

    /**
     * Save accounts to storage
     * @param {Array} accounts - Array of account objects
     */
    async saveAccounts(accounts) {
        return await this.save('accounts', accounts);
    }

    /**
     * Load accounts from storage
     */
    async loadAccounts() {
        return await this.load('accounts', []);
    }

    /**
     * Save settings to storage
     * @param {Object} settings - Settings object
     */
    async saveSettings(settings) {
        return await this.save('settings', settings);
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        const defaultSettings = {
            theme: 'dark',
            autoLogin: false,
            minimizeToTray: true,
            checkUpdates: true,
            encryptData: true,
            requirePassword: false,
            robloxPath: '',
            refreshInterval: 5,
            lastBackup: null,
            windowState: {
                width: 1200,
                height: 800,
                maximized: false
            }
        };
        
        return await this.load('settings', defaultSettings);
    }

    /**
     * Export accounts to file
     * @param {Array} accounts - Accounts to export
     */
    async exportAccounts(accounts) {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                accounts: accounts.map(account => ({
                    ...account,
                    password: '[ENCRYPTED]' // Don't export actual passwords
                }))
            };

            const jsonData = JSON.stringify(exportData, null, 2);
            const filename = `roblox_accounts_export_${new Date().toISOString().split('T')[0]}.json`;

            if (this.isNeutralinoAvailable) {
                await Neutralino.os.showSaveDialog('Save Accounts Export', {
                    defaultPath: filename,
                    filters: [
                        { name: 'JSON files', extensions: ['json'] }
                    ]
                }).then(async (result) => {
                    if (result) {
                        await Neutralino.filesystem.writeFile(result, jsonData);
                        Toast.success('Accounts exported successfully');
                    }
                });
            } else {
                // Browser fallback - download file
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
                Toast.success('Accounts exported successfully');
            }

            return true;
        } catch (error) {
            console.error('Export failed:', error);
            Toast.error('Failed to export accounts');
            return false;
        }
    }

    /**
     * Import accounts from file
     */
    async importAccounts() {
        try {
            if (this.isNeutralinoAvailable) {
                const result = await Neutralino.os.showOpenDialog('Import Accounts', {
                    multiSelections: false,
                    filters: [
                        { name: 'JSON files', extensions: ['json'] }
                    ]
                });

                if (result && result.length > 0) {
                    const fileContent = await Neutralino.filesystem.readFile(result[0]);
                    const importData = JSON.parse(fileContent);
                    
                    if (importData.accounts && Array.isArray(importData.accounts)) {
                        Toast.success(`Imported ${importData.accounts.length} accounts`);
                        return importData.accounts;
                    } else {
                        throw new Error('Invalid file format');
                    }
                }
            } else {
                // Browser fallback - file input
                return new Promise((resolve, reject) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                try {
                                    const importData = JSON.parse(e.target.result);
                                    if (importData.accounts && Array.isArray(importData.accounts)) {
                                        Toast.success(`Imported ${importData.accounts.length} accounts`);
                                        resolve(importData.accounts);
                                    } else {
                                        throw new Error('Invalid file format');
                                    }
                                } catch (error) {
                                    Toast.error('Failed to parse import file');
                                    reject(error);
                                }
                            };
                            reader.readAsText(file);
                        }
                    };
                    input.click();
                });
            }

            return [];
        } catch (error) {
            console.error('Import failed:', error);
            Toast.error('Failed to import accounts');
            return [];
        }
    }

    /**
     * Create backup of all data
     */
    async createBackup() {
        try {
            const accounts = await this.loadAccounts();
            const settings = await this.loadSettings();
            
            const backupData = {
                version: '1.0',
                backupDate: new Date().toISOString(),
                accounts: accounts,
                settings: settings
            };

            const jsonData = JSON.stringify(backupData, null, 2);
            const filename = `roblox_manager_backup_${new Date().toISOString().split('T')[0]}.json`;

            if (this.isNeutralinoAvailable) {
                await Neutralino.os.showSaveDialog('Create Backup', {
                    defaultPath: filename,
                    filters: [
                        { name: 'JSON files', extensions: ['json'] }
                    ]
                }).then(async (result) => {
                    if (result) {
                        await Neutralino.filesystem.writeFile(result, jsonData);
                        
                        // Update last backup time in settings
                        settings.lastBackup = new Date().toISOString();
                        await this.saveSettings(settings);
                        
                        Toast.success('Backup created successfully');
                    }
                });
            } else {
                // Browser fallback
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
                
                settings.lastBackup = new Date().toISOString();
                await this.saveSettings(settings);
                
                Toast.success('Backup created successfully');
            }

            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            Toast.error('Failed to create backup');
            return false;
        }
    }

    /**
     * Get storage usage information
     */
    async getStorageInfo() {
        try {
            const accounts = await this.loadAccounts();
            const settings = await this.loadSettings();
            
            const accountsSize = JSON.stringify(accounts).length;
            const settingsSize = JSON.stringify(settings).length;
            const totalSize = accountsSize + settingsSize;
            
            return {
                accountCount: accounts.length,
                accountsSize: accountsSize,
                settingsSize: settingsSize,
                totalSize: totalSize,
                formattedSize: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Number of bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create global instance
window.storage = new Storage();
