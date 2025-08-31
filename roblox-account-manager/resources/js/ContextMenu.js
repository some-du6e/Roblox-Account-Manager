/**
 * Context menu utility class
 */
class ContextMenu {
    constructor() {
        this.currentMenu = null;
        this.currentTarget = null;
        this.init();
    }

    /**
     * Initialize context menu system
     */
    init() {
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hide();
            }
        });

        // Hide context menu on scroll
        document.addEventListener('scroll', () => {
            this.hide();
        });

        // Hide context menu on window resize
        window.addEventListener('resize', () => {
            this.hide();
        });

        // Handle context menu item clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('context-menu-item')) {
                const action = e.target.dataset.action;
                if (action && this.onItemClick) {
                    this.onItemClick(action, this.currentTarget);
                }
                this.hide();
            }
        });
    }

    /**
     * Show context menu at specified position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} items - Array of menu items
     * @param {HTMLElement} target - Target element that triggered the menu
     */
    show(x, y, items = null, target = null) {
        this.currentTarget = target;

        let menu = document.getElementById('contextMenu');
        
        // If custom items provided, create custom menu
        if (items) {
            menu = this.createCustomMenu(items);
        }

        if (!menu) {
            console.warn('Context menu not found');
            return;
        }

        this.currentMenu = menu;

        // Position the menu
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // Adjust position if menu goes off screen
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (rect.right > windowWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }

        if (rect.bottom > windowHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }

        // Ensure menu stays within viewport
        if (parseInt(menu.style.left) < 0) {
            menu.style.left = '10px';
        }
        if (parseInt(menu.style.top) < 0) {
            menu.style.top = '10px';
        }
    }

    /**
     * Hide the context menu
     */
    hide() {
        if (this.currentMenu) {
            this.currentMenu.style.display = 'none';
            
            // Remove custom menus
            if (this.currentMenu.id.startsWith('customContextMenu')) {
                this.currentMenu.remove();
            }
            
            this.currentMenu = null;
        }
        this.currentTarget = null;
    }

    /**
     * Create a custom context menu
     * @param {Array} items - Array of menu items
     * @returns {HTMLElement} The created menu element
     */
    createCustomMenu(items) {
        const menuId = 'customContextMenu_' + Date.now();
        
        let menuHtml = `<div id="${menuId}" class="context-menu">`;
        
        items.forEach(item => {
            if (item.separator) {
                menuHtml += '<div class="context-menu-separator"></div>';
            } else {
                const iconHtml = item.icon ? `<i class="${item.icon}"></i>` : '';
                const classes = ['context-menu-item'];
                if (item.danger) classes.push('danger');
                if (item.disabled) classes.push('disabled');
                
                menuHtml += `
                    <div class="${classes.join(' ')}" data-action="${item.action}" ${item.disabled ? 'style="pointer-events: none; opacity: 0.5;"' : ''}>
                        ${iconHtml}
                        ${item.label}
                    </div>
                `;
            }
        });
        
        menuHtml += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', menuHtml);
        return document.getElementById(menuId);
    }

    /**
     * Set callback for menu item clicks
     * @param {Function} callback - Callback function (action, target) => {}
     */
    setItemClickHandler(callback) {
        this.onItemClick = callback;
    }

    /**
     * Add context menu to elements
     * @param {string|NodeList|HTMLElement} selector - Elements to add context menu to
     * @param {Array|Function} items - Menu items or function that returns items
     */
    addTo(selector, items) {
        let elements;
        
        if (typeof selector === 'string') {
            elements = document.querySelectorAll(selector);
        } else if (selector instanceof NodeList) {
            elements = selector;
        } else if (selector instanceof HTMLElement) {
            elements = [selector];
        } else {
            console.warn('Invalid selector for context menu');
            return;
        }

        elements.forEach(element => {
            element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                
                const menuItems = typeof items === 'function' ? items(element) : items;
                this.show(e.clientX, e.clientY, menuItems, element);
            });
        });
    }

    /**
     * Get default account context menu items
     * @param {HTMLElement} accountElement - The account element
     * @returns {Array} Menu items
     */
    static getAccountMenuItems(accountElement) {
        const accountId = accountElement.dataset.accountId;
        const isOnline = accountElement.classList.contains('online');
        
        return [
            {
                label: 'Launch',
                icon: 'fas fa-play',
                action: 'launch'
            },
            {
                label: 'Edit',
                icon: 'fas fa-edit',
                action: 'edit'
            },
            {
                label: 'Copy Username',
                icon: 'fas fa-copy',
                action: 'copy'
            },
            { separator: true },
            {
                label: 'Refresh',
                icon: 'fas fa-sync-alt',
                action: 'refresh'
            },
            {
                label: 'View Profile',
                icon: 'fas fa-user',
                action: 'viewProfile'
            },
            { separator: true },
            {
                label: 'Delete',
                icon: 'fas fa-trash',
                action: 'delete',
                danger: true
            }
        ];
    }
}

// Create global instance
window.contextMenu = new ContextMenu();
