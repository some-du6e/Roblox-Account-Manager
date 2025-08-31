class Toast {
    constructor() {
        this.container = this.createContainer();
        this.toasts = [];
        this.maxToasts = 5;
        this.defaultDuration = 5000;
    }

    createContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(title, message = '', type = 'info', duration = null) {
        // Don't show toasts if notifications are disabled
        if (AccountManager.instance && AccountManager.instance.settings && !AccountManager.instance.settings.showNotifications) {
            return;
        }

        const toast = this.createToast(title, message, type, duration || this.defaultDuration);
        this.addToast(toast);
        return toast;
    }

    createToast(title, message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.type = type;

        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        const icon = iconMap[type] || 'info-circle';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        // Click to dismiss
        toast.addEventListener('click', (e) => {
            if (e.target !== closeBtn && !closeBtn.contains(e.target)) {
                this.removeToast(toast);
            }
        });

        return toast;
    }

    addToast(toast) {
        // Remove oldest toast if we have too many
        if (this.toasts.length >= this.maxToasts) {
            const oldestToast = this.toasts.shift();
            this.removeToast(oldestToast);
        }

        this.toasts.push(toast);
        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });
    }

    removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        // Remove from array
        const index = this.toasts.indexOf(toast);
        if (index > -1) {
            this.toasts.splice(index, 1);
        }

        // Animate out
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    clear() {
        this.toasts.forEach(toast => this.removeToast(toast));
        this.toasts = [];
    }

    // Static methods for easy access
    static show(title, message = '', type = 'info', duration = null) {
        if (!window.toastInstance) {
            window.toastInstance = new Toast();
        }
        return window.toastInstance.show(title, message, type, duration);
    }

    static success(title, message = '', duration = null) {
        return Toast.show(title, message, 'success', duration);
    }

    static error(title, message = '', duration = null) {
        return Toast.show(title, message, 'error', duration || 8000);
    }

    static warning(title, message = '', duration = null) {
        return Toast.show(title, message, 'warning', duration || 6000);
    }

    static info(title, message = '', duration = null) {
        return Toast.show(title, message, 'info', duration);
    }

    static clear() {
        if (window.toastInstance) {
            window.toastInstance.clear();
        }
    }
}

// Loading overlay manager
class Loading {
    constructor() {
        this.overlay = this.createOverlay();
        this.isVisible = false;
        this.loadingText = '';
    }

    createOverlay() {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p id="loadingText">Loading...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    show(text = 'Loading...') {
        this.loadingText = text;
        const textElement = this.overlay.querySelector('#loadingText');
        if (textElement) {
            textElement.textContent = text;
        }

        this.overlay.classList.add('show');
        this.isVisible = true;
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.overlay.classList.remove('show');
        this.isVisible = false;
        document.body.style.overflow = '';
    }

    updateText(text) {
        this.loadingText = text;
        const textElement = this.overlay.querySelector('#loadingText');
        if (textElement) {
            textElement.textContent = text;
        }
    }

    // Static methods for easy access
    static show(text = 'Loading...') {
        if (!window.loadingInstance) {
            window.loadingInstance = new Loading();
        }
        return window.loadingInstance.show(text);
    }

    static hide() {
        if (window.loadingInstance) {
            window.loadingInstance.hide();
        }
    }

    static updateText(text) {
        if (window.loadingInstance) {
            window.loadingInstance.updateText(text);
        }
    }
}

// Progress bar component
class ProgressBar {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            min: 0,
            max: 100,
            value: 0,
            showLabel: true,
            animated: true,
            striped: false,
            ...options
        };
        
        this.create();
    }

    create() {
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        
        if (this.options.striped) {
            this.progressBar.classList.add('striped');
        }
        
        if (this.options.animated) {
            this.progressBar.classList.add('animated');
        }

        this.progressFill = document.createElement('div');
        this.progressFill.className = 'progress-fill';

        if (this.options.showLabel) {
            this.progressLabel = document.createElement('div');
            this.progressLabel.className = 'progress-label';
            this.progressLabel.textContent = '0%';
            this.progressBar.appendChild(this.progressLabel);
        }

        this.progressBar.appendChild(this.progressFill);
        this.container.appendChild(this.progressBar);

        // Add CSS if not already present
        this.addStyles();
    }

    addStyles() {
        if (!document.getElementById('progressBarStyles')) {
            const styles = document.createElement('style');
            styles.id = 'progressBarStyles';
            styles.textContent = `
                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: var(--bg-tertiary);
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--accent-primary);
                    border-radius: 10px;
                    transition: width 0.3s ease;
                    width: 0%;
                }

                .progress-bar.striped .progress-fill {
                    background-image: linear-gradient(45deg,
                        rgba(255,255,255,0.1) 25%,
                        transparent 25%,
                        transparent 50%,
                        rgba(255,255,255,0.1) 50%,
                        rgba(255,255,255,0.1) 75%,
                        transparent 75%,
                        transparent);
                    background-size: 20px 20px;
                }

                .progress-bar.animated .progress-fill {
                    animation: progressMove 1s linear infinite;
                }

                .progress-label {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 12px;
                    font-weight: bold;
                    color: var(--text-primary);
                    z-index: 1;
                }

                @keyframes progressMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 20px 0; }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    setValue(value) {
        this.options.value = Math.max(this.options.min, Math.min(this.options.max, value));
        const percentage = ((this.options.value - this.options.min) / (this.options.max - this.options.min)) * 100;
        
        this.progressFill.style.width = `${percentage}%`;
        
        if (this.progressLabel) {
            this.progressLabel.textContent = `${Math.round(percentage)}%`;
        }
    }

    getValue() {
        return this.options.value;
    }

    setMax(max) {
        this.options.max = max;
        this.setValue(this.options.value);
    }

    setMin(min) {
        this.options.min = min;
        this.setValue(this.options.value);
    }

    reset() {
        this.setValue(this.options.min);
    }

    complete() {
        this.setValue(this.options.max);
    }

    destroy() {
        if (this.progressBar && this.progressBar.parentNode) {
            this.progressBar.parentNode.removeChild(this.progressBar);
        }
    }
}

// Create global instances
window.Toast = Toast;
window.Loading = Loading;
window.ProgressBar = ProgressBar;
