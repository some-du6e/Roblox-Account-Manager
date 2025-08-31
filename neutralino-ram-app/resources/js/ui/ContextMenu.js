class ContextMenu {
    constructor() {
        this.menu = this.createMenu();
        this.currentAccount = null;
        this.isVisible = false;
        this.setupEventListeners();
    }

    createMenu() {
        let menu = document.getElementById('contextMenu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'contextMenu';
            menu.className = 'context-menu';
            menu.innerHTML = `
                <div class="context-item" data-action="launch">
                    <i class="fas fa-play"></i> Launch
                </div>
                <div class="context-item" data-action="launch-private">
                    <i class="fas fa-user-secret"></i> Launch Private Server
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="edit">
                    <i class="fas fa-edit"></i> Edit
                </div>
                <div class="context-item" data-action="duplicate">
                    <i class="fas fa-copy"></i> Duplicate
                </div>
                <div class="context-item" data-action="delete">
                    <i class="fas fa-trash"></i> Delete
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="copy-username">
                    <i class="fas fa-copy"></i> Copy Username
                </div>
                <div class="context-item" data-action="copy-user-id">
                    <i class="fas fa-copy"></i> Copy User ID
                </div>
                <div class="context-item" data-action="copy-profile-link">
                    <i class="fas fa-link"></i> Copy Profile Link
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="check-status">
                    <i class="fas fa-sync"></i> Check Status
                </div>
                <div class="context-item" data-action="refresh-token">
                    <i class="fas fa-key"></i> Refresh Token
                </div>
                <div class="context-item" data-action="clear-data">
                    <i class="fas fa-broom"></i> Clear Browser Data
                </div>
                <div class="context-separator"></div>
                <div class="context-item" data-action="view-profile">
                    <i class="fas fa-user"></i> View Profile
                </div>
                <div class="context-item" data-action="view-inventory">
                    <i class="fas fa-box"></i> View Inventory
                </div>
                <div class="context-item" data-action="view-friends">
                    <i class="fas fa-users"></i> View Friends
                </div>
            `;
            document.body.appendChild(menu);
        }
        return menu;
    }

    setupEventListeners() {
        // Hide menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target)) {
                this.hide();
            }
        });

        // Hide menu on scroll
        document.addEventListener('scroll', () => {
            this.hide();
        });

        // Handle menu item clicks
        this.menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action && this.currentAccount) {
                this.handleAction(action, this.currentAccount);
                this.hide();
            }
        });

        // Prevent default context menu
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.account-card')) {
                e.preventDefault();
            }
        });

        // Hide on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show(x, y, account) {
        this.currentAccount = account;
        this.isVisible = true;

        // Update menu items based on account state
        this.updateMenuItems(account);

        // Position menu
        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
        this.menu.style.display = 'block';

        // Ensure menu stays within viewport
        this.adjustPosition();
    }

    hide() {
        this.menu.style.display = 'none';
        this.isVisible = false;
        this.currentAccount = null;
    }

    updateMenuItems(account) {
        // Enable/disable items based on account state
        const refreshTokenItem = this.menu.querySelector('[data-action="refresh-token"]');
        const checkStatusItem = this.menu.querySelector('[data-action="check-status"]');
        const copyUserIdItem = this.menu.querySelector('[data-action="copy-user-id"]');
        const viewProfileItem = this.menu.querySelector('[data-action="view-profile"]');

        if (refreshTokenItem) {
            refreshTokenItem.style.opacity = account.securityToken ? '1' : '0.5';
        }

        if (copyUserIdItem) {
            copyUserIdItem.style.opacity = account.userId ? '1' : '0.5';
        }

        if (viewProfileItem) {
            viewProfileItem.style.opacity = account.userId ? '1' : '0.5';
        }
    }

    adjustPosition() {
        const rect = this.menu.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let { left, top } = this.menu.style;
        left = parseInt(left);
        top = parseInt(top);

        // Adjust horizontal position
        if (left + rect.width > viewport.width) {
            left = viewport.width - rect.width - 10;
        }
        if (left < 10) {
            left = 10;
        }

        // Adjust vertical position
        if (top + rect.height > viewport.height) {
            top = viewport.height - rect.height - 10;
        }
        if (top < 10) {
            top = 10;
        }

        this.menu.style.left = `${left}px`;
        this.menu.style.top = `${top}px`;
    }

    async handleAction(action, account) {
        try {
            switch (action) {
                case 'launch':
                    await account.launch();
                    break;

                case 'launch-private':
                    await this.launchPrivateServer(account);
                    break;

                case 'edit':
                    AccountModal.showEditAccount(account);
                    break;

                case 'duplicate':
                    await this.duplicateAccount(account);
                    break;

                case 'delete':
                    await this.deleteAccount(account);
                    break;

                case 'copy-username':
                    await this.copyToClipboard(account.username);
                    Toast.show('Copied', 'Username copied to clipboard', 'success');
                    break;

                case 'copy-user-id':
                    if (account.userId) {
                        await this.copyToClipboard(account.userId.toString());
                        Toast.show('Copied', 'User ID copied to clipboard', 'success');
                    } else {
                        Toast.show('No User ID', 'User ID not available', 'warning');
                    }
                    break;

                case 'copy-profile-link':
                    if (account.userId) {
                        const profileUrl = `https://www.roblox.com/users/${account.userId}/profile`;
                        await this.copyToClipboard(profileUrl);
                        Toast.show('Copied', 'Profile link copied to clipboard', 'success');
                    } else {
                        Toast.show('No User ID', 'Cannot generate profile link without User ID', 'warning');
                    }
                    break;

                case 'check-status':
                    Loading.show('Checking account status...');
                    const isValid = await account.checkStatus();
                    Loading.hide();
                    if (isValid) {
                        Toast.show('Status Check', `${account.getDisplayName()} is valid`, 'success');
                    } else {
                        Toast.show('Status Check', `${account.getDisplayName()} is invalid`, 'error');
                    }
                    await AccountManager.instance.saveAccounts();
                    await AccountManager.instance.updateUI();
                    break;

                case 'refresh-token':
                    if (account.securityToken) {
                        Loading.show('Refreshing token...');
                        const refreshed = await account.refreshToken();
                        Loading.hide();
                        if (refreshed) {
                            Toast.show('Token Refreshed', `Token refreshed for ${account.getDisplayName()}`, 'success');
                        } else {
                            Toast.show('Refresh Failed', `Failed to refresh token for ${account.getDisplayName()}`, 'error');
                        }
                        await AccountManager.instance.saveAccounts();
                        await AccountManager.instance.updateUI();
                    } else {
                        Toast.show('No Token', 'No security token available to refresh', 'warning');
                    }
                    break;

                case 'clear-data':
                    const confirmClear = await Modal.confirm(
                        `Clear all browser data for ${account.getDisplayName()}?`,
                        'Clear Browser Data'
                    );
                    if (confirmClear) {
                        await account.clearBrowserData();
                    }
                    break;

                case 'view-profile':
                    if (account.userId) {
                        const profileUrl = `https://www.roblox.com/users/${account.userId}/profile`;
                        await Neutralino.os.open(profileUrl);
                    } else {
                        Toast.show('No User ID', 'Cannot open profile without User ID', 'warning');
                    }
                    break;

                case 'view-inventory':
                    if (account.userId) {
                        const inventoryUrl = `https://www.roblox.com/users/${account.userId}/inventory`;
                        await Neutralino.os.open(inventoryUrl);
                    } else {
                        Toast.show('No User ID', 'Cannot open inventory without User ID', 'warning');
                    }
                    break;

                case 'view-friends':
                    if (account.userId) {
                        const friendsUrl = `https://www.roblox.com/users/${account.userId}/friends`;
                        await Neutralino.os.open(friendsUrl);
                    } else {
                        Toast.show('No User ID', 'Cannot open friends list without User ID', 'warning');
                    }
                    break;

                default:
                    console.warn('Unknown context menu action:', action);
            }
        } catch (error) {
            console.error('Context menu action failed:', error);
            Toast.show('Action Failed', error.message, 'error');
        }
    }

    async launchPrivateServer(account) {
        const serverCode = await Modal.prompt(
            'Enter private server code or link:',
            '',
            'Private Server'
        );

        if (serverCode) {
            try {
                // Extract server code from link if provided
                let code = serverCode.trim();
                const match = code.match(/privateServerLinkCode=([^&]+)/);
                if (match) {
                    code = match[1];
                }

                // Launch with private server code
                const gameUrl = `https://www.roblox.com/games/start?privateServerLinkCode=${code}`;
                await account.openInBrowser(gameUrl);
                
                Toast.show('Private Server', `Launching private server for ${account.getDisplayName()}`, 'success');
            } catch (error) {
                Toast.show('Launch Failed', 'Failed to launch private server', 'error');
            }
        }
    }

    async duplicateAccount(account) {
        const newAlias = await Modal.prompt(
            'Enter alias for the duplicated account:',
            `${account.getDisplayName()} (Copy)`,
            'Duplicate Account'
        );

        if (newAlias) {
            try {
                const duplicateData = {
                    ...account.toJSON(),
                    id: undefined, // Will generate new ID
                    alias: newAlias,
                    securityToken: '', // Don't copy security token
                    valid: null // Reset validation status
                };

                await AccountManager.instance.addAccount(duplicateData);
                Toast.show('Account Duplicated', `${newAlias} has been created`, 'success');
            } catch (error) {
                Toast.show('Duplicate Failed', error.message, 'error');
            }
        }
    }

    async deleteAccount(account) {
        const confirmDelete = await Modal.confirm(
            `Are you sure you want to delete ${account.getDisplayName()}?\n\nThis action cannot be undone.`,
            'Delete Account'
        );

        if (confirmDelete) {
            await AccountManager.instance.deleteAccount(account.id);
        }
    }

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            throw new Error('Failed to copy to clipboard');
        }
    }

    // Static methods for easy access
    static show(x, y, account) {
        if (!window.contextMenuInstance) {
            window.contextMenuInstance = new ContextMenu();
        }
        return window.contextMenuInstance.show(x, y, account);
    }

    static hide() {
        if (window.contextMenuInstance) {
            window.contextMenuInstance.hide();
        }
    }
}

// Game Context Menu
class GameContextMenu extends ContextMenu {
    constructor() {
        super();
        this.currentGame = null;
        this.createGameMenu();
    }

    createGameMenu() {
        const gameMenu = document.createElement('div');
        gameMenu.id = 'gameContextMenu';
        gameMenu.className = 'context-menu';
        gameMenu.innerHTML = `
            <div class="context-item" data-action="launch-game">
                <i class="fas fa-play"></i> Launch Game
            </div>
            <div class="context-item" data-action="launch-with-account">
                <i class="fas fa-user-plus"></i> Launch with Account
            </div>
            <div class="context-separator"></div>
            <div class="context-item" data-action="copy-game-id">
                <i class="fas fa-copy"></i> Copy Game ID
            </div>
            <div class="context-item" data-action="copy-game-link">
                <i class="fas fa-link"></i> Copy Game Link
            </div>
            <div class="context-separator"></div>
            <div class="context-item" data-action="view-game-page">
                <i class="fas fa-external-link-alt"></i> View Game Page
            </div>
            <div class="context-item" data-action="view-game-stats">
                <i class="fas fa-chart-bar"></i> View Game Stats
            </div>
            <div class="context-separator"></div>
            <div class="context-item" data-action="add-to-favorites">
                <i class="fas fa-star"></i> Add to Favorites
            </div>
            <div class="context-item" data-action="remove-from-recent">
                <i class="fas fa-trash"></i> Remove from Recent
            </div>
        `;
        document.body.appendChild(gameMenu);
        this.gameMenu = gameMenu;

        // Setup game menu event listeners
        this.gameMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action && this.currentGame) {
                this.handleGameAction(action, this.currentGame);
                this.hideGameMenu();
            }
        });
    }

    showGameMenu(x, y, game) {
        this.currentGame = game;
        
        // Update menu items
        this.updateGameMenuItems(game);

        // Position and show menu
        this.gameMenu.style.left = `${x}px`;
        this.gameMenu.style.top = `${y}px`;
        this.gameMenu.style.display = 'block';

        // Adjust position
        this.adjustGameMenuPosition();
    }

    hideGameMenu() {
        this.gameMenu.style.display = 'none';
        this.currentGame = null;
    }

    updateGameMenuItems(game) {
        const favoriteItem = this.gameMenu.querySelector('[data-action="add-to-favorites"]');
        if (favoriteItem) {
            if (game.isFavorite) {
                favoriteItem.innerHTML = '<i class="fas fa-star"></i> Remove from Favorites';
                favoriteItem.dataset.action = 'remove-from-favorites';
            } else {
                favoriteItem.innerHTML = '<i class="fas fa-star"></i> Add to Favorites';
                favoriteItem.dataset.action = 'add-to-favorites';
            }
        }
    }

    adjustGameMenuPosition() {
        const rect = this.gameMenu.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let { left, top } = this.gameMenu.style;
        left = parseInt(left);
        top = parseInt(top);

        if (left + rect.width > viewport.width) {
            left = viewport.width - rect.width - 10;
        }
        if (left < 10) left = 10;

        if (top + rect.height > viewport.height) {
            top = viewport.height - rect.height - 10;
        }
        if (top < 10) top = 10;

        this.gameMenu.style.left = `${left}px`;
        this.gameMenu.style.top = `${top}px`;
    }

    async handleGameAction(action, game) {
        try {
            switch (action) {
                case 'launch-game':
                    await game.launch();
                    break;

                case 'launch-with-account':
                    // Show account selection modal
                    await this.showAccountSelection(game);
                    break;

                case 'copy-game-id':
                    await this.copyToClipboard(game.id);
                    Toast.show('Copied', 'Game ID copied to clipboard', 'success');
                    break;

                case 'copy-game-link':
                    await this.copyToClipboard(game.getGameUrl());
                    Toast.show('Copied', 'Game link copied to clipboard', 'success');
                    break;

                case 'view-game-page':
                    await Neutralino.os.open(game.getGameUrl());
                    break;

                case 'view-game-stats':
                    // Show game stats modal
                    await this.showGameStats(game);
                    break;

                case 'add-to-favorites':
                    game.toggleFavorite();
                    Toast.show('Favorites', `${game.name} added to favorites`, 'success');
                    break;

                case 'remove-from-favorites':
                    game.toggleFavorite();
                    Toast.show('Favorites', `${game.name} removed from favorites`, 'success');
                    break;

                case 'remove-from-recent':
                    AccountManager.instance.recentGames = AccountManager.instance.recentGames.filter(g => g.id !== game.id);
                    await AccountManager.instance.saveData();
                    AccountManager.instance.updateRecentGamesUI();
                    Toast.show('Recent Games', `${game.name} removed from recent games`, 'success');
                    break;

                default:
                    console.warn('Unknown game context menu action:', action);
            }
        } catch (error) {
            console.error('Game context menu action failed:', error);
            Toast.show('Action Failed', error.message, 'error');
        }
    }

    async showAccountSelection(game) {
        // Create a simple account selection modal
        const accounts = AccountManager.instance.accounts.filter(acc => acc.isValid());
        
        if (accounts.length === 0) {
            Toast.show('No Accounts', 'No valid accounts available', 'warning');
            return;
        }

        const accountOptions = accounts.map(acc => `
            <div class="account-option" data-account-id="${acc.id}">
                <div class="account-avatar">
                    ${acc.avatarUrl ? `<img src="${acc.avatarUrl}" alt="${acc.getDisplayName()}">` : '<i class="fas fa-user"></i>'}
                </div>
                <div class="account-info">
                    <div class="account-name">${acc.getDisplayName()}</div>
                    <div class="account-username">${acc.username}</div>
                </div>
            </div>
        `).join('');

        const modal = Modal.create({
            title: 'Select Account',
            content: `
                <p>Select an account to launch ${game.name}:</p>
                <div class="account-selection">
                    ${accountOptions}
                </div>
                <style>
                    .account-selection {
                        max-height: 300px;
                        overflow-y: auto;
                        margin-top: 16px;
                    }
                    .account-option {
                        display: flex;
                        align-items: center;
                        padding: 12px;
                        border: 1px solid var(--border);
                        border-radius: 4px;
                        margin-bottom: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .account-option:hover {
                        border-color: var(--accent-primary);
                        background: var(--hover);
                    }
                    .account-option .account-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        margin-right: 12px;
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: var(--bg-tertiary);
                    }
                    .account-option .account-avatar img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .account-option .account-info {
                        flex: 1;
                    }
                    .account-option .account-name {
                        font-weight: 600;
                        color: var(--text-primary);
                    }
                    .account-option .account-username {
                        font-size: 12px;
                        color: var(--text-muted);
                    }
                </style>
            `,
            buttons: [
                { text: 'Cancel', class: 'btn-secondary', dismiss: true }
            ]
        });

        // Handle account selection
        modal.modal.addEventListener('click', async (e) => {
            const accountOption = e.target.closest('.account-option');
            if (accountOption) {
                const accountId = accountOption.dataset.accountId;
                const account = accounts.find(acc => acc.id === accountId);
                if (account) {
                    modal.hide();
                    await account.launch(game.id);
                }
            }
        });

        modal.show();
    }

    async showGameStats(game) {
        const modal = Modal.create({
            title: game.name,
            content: `
                <div class="game-stats">
                    <div class="stat-row">
                        <span class="stat-label">Playing Now:</span>
                        <span class="stat-value">${game.getFormattedPlayerCount()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Total Visits:</span>
                        <span class="stat-value">${game.getFormattedVisitCount()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Rating:</span>
                        <span class="stat-value">${game.getRatingPercentage()}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Creator:</span>
                        <span class="stat-value">${game.creator}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Genre:</span>
                        <span class="stat-value">${game.genre}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Max Players:</span>
                        <span class="stat-value">${game.maxPlayers}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Last Played:</span>
                        <span class="stat-value">${game.getTimeSinceLastPlayed()}</span>
                    </div>
                </div>
                <style>
                    .game-stats {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .stat-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 0;
                        border-bottom: 1px solid var(--border);
                    }
                    .stat-row:last-child {
                        border-bottom: none;
                    }
                    .stat-label {
                        font-weight: 500;
                        color: var(--text-secondary);
                    }
                    .stat-value {
                        font-weight: 600;
                        color: var(--text-primary);
                    }
                </style>
            `,
            buttons: [
                { text: 'Close', class: 'btn-primary', dismiss: true }
            ]
        });

        modal.show();
    }
}

// Create global instances
window.ContextMenu = ContextMenu;
window.GameContextMenu = new GameContextMenu();
