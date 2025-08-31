/**
 * Toast notification utility class
 */
class Toast {
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, warning, error, info)
     * @param {number} duration - How long to show the toast in milliseconds
     */
    static show(message, type = 'info', duration = 4000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.warn('Toast container not found');
            return;
        }

        // Create unique ID for this toast
        const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Determine icon based on type
        let iconClass = 'fas fa-info-circle';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
                break;
            case 'error':
                iconClass = 'fas fa-times-circle';
                break;
        }

        // Create toast HTML
        const toastHtml = `
            <div id="${toastId}" class="toast ${type}">
                <i class="toast-icon ${iconClass}"></i>
                <div class="toast-message">${message}</div>
                <button class="toast-close" onclick="Toast.close('${toastId}')">&times;</button>
            </div>
        `;

        // Add toast to container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.close(toastId);
            }, duration);
        }

        return toastId;
    }

    /**
     * Close a specific toast
     * @param {string} toastId - The ID of the toast to close
     */
    static close(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    /**
     * Close all toasts
     */
    static closeAll() {
        const toasts = document.querySelectorAll('.toast');
        toasts.forEach(toast => {
            this.close(toast.id);
        });
    }

    /**
     * Show a success toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the toast
     */
    static success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show a warning toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the toast
     */
    static warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show an error toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the toast
     */
    static error(message, duration = 6000) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show an info toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the toast
     */
    static info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Initialize toast system
     */
    static init() {
        // Add CSS for slide out animation if not present
        if (!document.querySelector('#toastAnimations')) {
            const style = document.createElement('style');
            style.id = 'toastAnimations';
            style.textContent = `
                @keyframes toastSlideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Ensure toast container exists
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Toast.init());
} else {
    Toast.init();
}
