/**
 * Modal utility class for managing modal dialogs
 */
class Modal {
    /**
     * Open a modal by ID
     * @param {string} modalId - The ID of the modal to open
     */
    static open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            // Focus first input if available
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close a modal by ID
     * @param {string} modalId - The ID of the modal to close
     */
    static close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Clear form if it exists
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    /**
     * Close all open modals
     */
    static closeAll() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            this.close(modal.id);
        });
    }

    /**
     * Initialize modal event listeners
     */
    static init() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.close(e.target.id);
            }
        });

        // Close modal when clicking close button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || 
                e.target.parentElement.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.close(modal.id);
                }
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                if (openModals.length > 0) {
                    const lastModal = openModals[openModals.length - 1];
                    this.close(lastModal.id);
                }
            }
        });
    }

    /**
     * Create a confirmation modal
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {Function} onConfirm - Callback for confirm action
     * @param {Function} onCancel - Callback for cancel action
     */
    static confirm(title, message, onConfirm, onCancel = null) {
        const modalId = 'confirmModal';
        
        // Remove existing confirm modal
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHtml = `
            <div id="${modalId}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn" id="confirmCancel">Cancel</button>
                        <button type="button" class="btn primary" id="confirmOk">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listeners
        document.getElementById('confirmOk').addEventListener('click', () => {
            this.close(modalId);
            if (onConfirm) onConfirm();
        });

        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.close(modalId);
            if (onCancel) onCancel();
        });

        // Open modal
        this.open(modalId);
    }

    /**
     * Create an alert modal
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {string} type - Alert type (success, warning, error)
     * @param {Function} onClose - Callback for close action
     */
    static alert(title, message, type = 'info', onClose = null) {
        const modalId = 'alertModal';
        
        // Remove existing alert modal
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

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

        // Create modal HTML
        const modalHtml = `
            <div id="${modalId}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="${iconClass}"></i> ${title}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn primary" id="alertOk">OK</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listener
        document.getElementById('alertOk').addEventListener('click', () => {
            this.close(modalId);
            if (onClose) onClose();
        });

        // Open modal
        this.open(modalId);
    }
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Modal.init());
} else {
    Modal.init();
}
