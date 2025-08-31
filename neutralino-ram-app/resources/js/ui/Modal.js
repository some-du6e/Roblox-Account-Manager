class Modal {
    constructor(modalId) {
        this.modalId = modalId;
        this.modal = document.getElementById(modalId);
        this.isVisible = false;
        
        if (this.modal) {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Cancel button
        const cancelBtn = this.modal.querySelector('[data-dismiss="modal"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hide());
        }
    }

    show() {
        if (this.modal) {
            this.modal.classList.add('show');
            this.isVisible = true;
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = this.modal.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    hide() {
        if (this.modal) {
            this.modal.classList.remove('show');
            this.isVisible = false;
            document.body.style.overflow = '';
        }
    }

    setTitle(title) {
        const titleElement = this.modal.querySelector('#modalTitle, .modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    getFormData() {
        const form = this.modal.querySelector('form');
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    setFormData(data) {
        const form = this.modal.querySelector('form');
        if (!form) return;

        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = value;
                } else {
                    input.value = value || '';
                }
            }
        });
    }

    clearForm() {
        const form = this.modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    static create(options = {}) {
        const modalId = options.id || `modal_${Date.now()}`;
        const title = options.title || 'Modal';
        const content = options.content || '';
        const buttons = options.buttons || [];

        const modalHTML = `
            <div id="${modalId}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button type="button" class="btn ${btn.class || 'btn-secondary'}" 
                                    data-action="${btn.action || ''}"
                                    ${btn.dismiss ? 'data-dismiss="modal"' : ''}>
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        return new Modal(modalId);
    }

    static confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modal = Modal.create({
                title: title,
                content: `<p>${message}</p>`,
                buttons: [
                    { text: 'Cancel', class: 'btn-secondary', dismiss: true, action: 'cancel' },
                    { text: 'Confirm', class: 'btn-primary', action: 'confirm' }
                ]
            });

            modal.modal.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    modal.hide();
                    resolve(true);
                } else if (action === 'cancel') {
                    modal.hide();
                    resolve(false);
                }
            });

            modal.show();
        });
    }

    static alert(message, title = 'Alert') {
        return new Promise((resolve) => {
            const modal = Modal.create({
                title: title,
                content: `<p>${message}</p>`,
                buttons: [
                    { text: 'OK', class: 'btn-primary', dismiss: true, action: 'ok' }
                ]
            });

            modal.modal.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'ok') {
                    modal.hide();
                    resolve();
                }
            });

            modal.show();
        });
    }

    static prompt(message, defaultValue = '', title = 'Input') {
        return new Promise((resolve) => {
            const modal = Modal.create({
                title: title,
                content: `
                    <div class="form-group">
                        <label>${message}</label>
                        <input type="text" class="form-control" id="promptInput" value="${defaultValue}">
                    </div>
                `,
                buttons: [
                    { text: 'Cancel', class: 'btn-secondary', dismiss: true, action: 'cancel' },
                    { text: 'OK', class: 'btn-primary', action: 'ok' }
                ]
            });

            const input = modal.modal.querySelector('#promptInput');

            modal.modal.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'ok') {
                    modal.hide();
                    resolve(input.value);
                } else if (action === 'cancel') {
                    modal.hide();
                    resolve(null);
                }
            });

            // Enter key to confirm
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    modal.hide();
                    resolve(input.value);
                }
            });

            modal.show();
        });
    }
}

// Account Modal Manager
class AccountModal extends Modal {
    constructor() {
        super('accountModal');
        this.currentAccount = null;
        this.isEditMode = false;
        this.setupAccountModalListeners();
    }

    setupAccountModalListeners() {
        if (!this.modal) return;

        const saveBtn = document.getElementById('saveAccountBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAccount());
        }

        // Form submission
        const form = this.modal.querySelector('#accountForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAccount();
            });
        }
    }

    showAddAccount() {
        this.isEditMode = false;
        this.currentAccount = null;
        this.setTitle('Add Account');
        this.clearForm();
        
        // Populate group dropdown
        this.updateGroupDropdown();
        
        this.show();
    }

    showEditAccount(account) {
        this.isEditMode = true;
        this.currentAccount = account;
        this.setTitle('Edit Account');
        
        // Populate form with account data
        this.setFormData({
            username: account.username,
            password: account.password,
            alias: account.alias,
            group: account.group,
            description: account.description
        });
        
        this.updateGroupDropdown();
        this.show();
    }

    updateGroupDropdown() {
        const groupSelect = this.modal.querySelector('#group');
        if (!groupSelect) return;

        // Clear existing options
        groupSelect.innerHTML = '';

        // Add existing groups
        AccountManager.instance.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
        });

        // Add "Add New Group" option
        const newGroupOption = document.createElement('option');
        newGroupOption.value = '__new__';
        newGroupOption.textContent = '+ Add New Group';
        groupSelect.appendChild(newGroupOption);

        // Handle new group creation
        groupSelect.addEventListener('change', (e) => {
            if (e.target.value === '__new__') {
                this.createNewGroup();
            }
        });
    }

    async createNewGroup() {
        const groupName = await Modal.prompt('Enter group name:', '', 'New Group');
        
        if (groupName && groupName.trim()) {
            const trimmedName = groupName.trim();
            
            // Check if group already exists
            if (AccountManager.instance.groups.includes(trimmedName)) {
                Toast.show('Group Exists', 'A group with this name already exists', 'warning');
                return;
            }

            // Add new group
            AccountManager.instance.groups.push(trimmedName);
            await AccountManager.instance.saveData();
            
            // Update dropdown
            this.updateGroupDropdown();
            
            // Select the new group
            const groupSelect = this.modal.querySelector('#group');
            if (groupSelect) {
                groupSelect.value = trimmedName;
            }

            Toast.show('Group Created', `Group "${trimmedName}" created successfully`, 'success');
        }
    }

    async saveAccount() {
        try {
            const formData = this.getFormData();
            
            // Validate form data
            if (!formData.username || !formData.password) {
                Toast.show('Validation Error', 'Username and password are required', 'error');
                return;
            }

            if (this.isEditMode && this.currentAccount) {
                // Update existing account
                await AccountManager.instance.updateAccount(this.currentAccount.id, formData);
            } else {
                // Add new account
                await AccountManager.instance.addAccount(formData);
            }

            this.hide();

        } catch (error) {
            console.error('Failed to save account:', error);
            // Error toast will be shown by AccountManager
        }
    }
}

// Settings Modal
class SettingsModal extends Modal {
    constructor() {
        super('settingsModal');
        this.setupSettingsModal();
    }

    setupSettingsModal() {
        // Create settings modal if it doesn't exist
        if (!this.modal) {
            this.createSettingsModal();
        }
    }

    createSettingsModal() {
        const modalHTML = `
            <div id="settingsModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Settings</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="settingsForm">
                            <div class="form-group">
                                <label for="theme">Theme:</label>
                                <select id="theme" name="theme">
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="blue">Blue</option>
                                    <option value="green">Green</option>
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>
                                    <option value="red">Red</option>
                                    <option value="roblox">Roblox</option>
                                    <option value="high-contrast">High Contrast</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="autoLaunch"> Auto-launch on startup
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="checkOnStartup"> Check accounts on startup
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="savePasswords"> Save passwords (encrypted)
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="showNotifications"> Show notifications
                                </label>
                            </div>
                            <div class="form-group">
                                <label for="maxRecentGames">Max recent games:</label>
                                <input type="number" id="maxRecentGames" name="maxRecentGames" min="5" max="50" value="10">
                            </div>
                            <div class="form-group">
                                <label for="launchMethod">Launch method:</label>
                                <select id="launchMethod" name="launchMethod">
                                    <option value="browser">Browser</option>
                                    <option value="app">Roblox App</option>
                                    <option value="protocol">Protocol Handler</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="browserProfile">Browser profile:</label>
                                <select id="browserProfile" name="browserProfile">
                                    <option value="isolated">Isolated (Recommended)</option>
                                    <option value="shared">Shared</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" id="saveSettingsBtn" class="btn btn-primary">Save Settings</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('settingsModal');
        this.setupEventListeners();

        // Setup save button
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }
    }

    showSettings() {
        // Load current settings
        const settings = AccountManager.instance.settings;
        this.setFormData(settings);
        this.show();
    }

    async saveSettings() {
        try {
            const formData = this.getFormData();
            
            // Update settings
            Object.assign(AccountManager.instance.settings, formData);
            
            // Apply theme
            if (formData.theme) {
                AccountManager.instance.applyTheme(formData.theme);
            }

            // Save settings
            await AccountManager.instance.saveData();

            this.hide();
            Toast.show('Settings Saved', 'Settings have been saved successfully', 'success');

        } catch (error) {
            console.error('Failed to save settings:', error);
            Toast.show('Save Failed', 'Failed to save settings', 'error');
        }
    }
}

// Create global instances
window.Modal = Modal;
window.AccountModal = new AccountModal();
window.SettingsModal = new SettingsModal();
