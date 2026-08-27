/**
 * Toast Notifications Enhancement
 * Priority 1.5 - Advanced toast system with actions, stacking, and progress
 */

(function() {
    'use strict';

    const ToastNotifications = {
        // Configuration
        config: {
            maxToasts: 5,
            defaultDuration: 4000,
            positions: {
                'top-right': { top: '1rem', right: '1rem' },
                'top-left': { top: '1rem', left: '1rem' },
                'top-center': { top: '1rem', left: '50%', transform: 'translateX(-50%)' },
                'bottom-right': { bottom: '1rem', right: '1rem' },
                'bottom-left': { bottom: '1rem', left: '1rem' },
                'bottom-center': { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }
            },
            defaultPosition: 'bottom-center'
        },

        // Active toasts tracking
        activeToasts: [],
        toastCounter: 0,

        /**
         * Initialize toast container
         */
        init() {
            if (!document.getElementById('toast-container')) {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
        },

        /**
         * Show a toast notification
         * @param {string} message - Toast message
         * @param {string} type - Toast type: success, error, warning, info
         * @param {Object} options - Additional options
         * @returns {Object} Toast instance with dismiss method
         */
        show(message, type = 'info', options = {}) {
            this.init();

            const toastOptions = {
                duration: options.duration ?? this.config.defaultDuration,
                position: options.position ?? this.config.defaultPosition,
                actions: options.actions ?? [],
                dismissible: options.dismissible !== false,
                showProgress: options.showProgress !== false,
                icon: options.icon ?? this.getDefaultIcon(type),
                onDismiss: options.onDismiss ?? null
            };

            // Create toast element
            const toast = this.createToast(message, type, toastOptions);

            // Add to container
            const container = document.getElementById('toast-container');
            container.appendChild(toast.element);

            // Track active toast
            this.activeToasts.push(toast);

            // Auto-dismiss if duration > 0
            if (toastOptions.duration > 0) {
                this.startProgressBar(toast, toastOptions.duration);
                toast.dismissTimeout = setTimeout(() => {
                    this.dismiss(toast.id);
                }, toastOptions.duration);
            }

            // Limit number of toasts
            if (this.activeToasts.length > this.config.maxToasts) {
                this.dismiss(this.activeToasts[0].id);
            }

            // Animate in
            requestAnimationFrame(() => {
                toast.element.classList.add('toast-show');
            });

            return {
                id: toast.id,
                dismiss: () => this.dismiss(toast.id),
                update: (newMessage) => this.updateMessage(toast.id, newMessage)
            };
        },

        /**
         * Create toast DOM element
         */
        createToast(message, type, options) {
            const id = ++this.toastCounter;
            const element = document.createElement('div');
            element.className = `toast toast-${type}`;
            element.setAttribute('data-toast-id', id);
            element.setAttribute('role', 'alert');
            element.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

            let actionsHTML = '';
            if (options.actions.length > 0) {
                actionsHTML = '<div class="toast-actions">';
                options.actions.forEach((action, idx) => {
                    actionsHTML += `
                        <button class="toast-action-btn" data-action-idx="${idx}">
                            ${action.label}
                        </button>
                    `;
                });
                actionsHTML += '</div>';
            }

            const dismissBtn = options.dismissible
                ? '<button class="toast-dismiss" aria-label="Dismiss">&times;</button>'
                : '';

            const progressBar = options.showProgress && options.duration > 0
                ? '<div class="toast-progress"><div class="toast-progress-bar"></div></div>'
                : '';

            element.innerHTML = `
                <div class="toast-content">
                    ${options.icon ? `<span class="toast-icon">${options.icon}</span>` : ''}
                    <div class="toast-message">${message}</div>
                    ${dismissBtn}
                </div>
                ${actionsHTML}
                ${progressBar}
            `;

            // Bind events
            if (options.dismissible) {
                element.querySelector('.toast-dismiss').addEventListener('click', () => {
                    this.dismiss(id);
                });
            }

            // Bind action buttons
            if (options.actions.length > 0) {
                element.querySelectorAll('.toast-action-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.target.getAttribute('data-action-idx'));
                        const action = options.actions[idx];
                        if (action.onClick) {
                            action.onClick();
                        }
                        if (action.dismissOnClick !== false) {
                            this.dismiss(id);
                        }
                    });
                });
            }

            return {
                id,
                element,
                type,
                options,
                dismissTimeout: null
            };
        },

        /**
         * Start progress bar animation
         */
        startProgressBar(toast, duration) {
            const progressBar = toast.element.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.transition = `width ${duration}ms linear`;
                requestAnimationFrame(() => {
                    progressBar.style.width = '0%';
                });
            }
        },

        /**
         * Dismiss a toast
         */
        dismiss(toastId) {
            const toastIndex = this.activeToasts.findIndex(t => t.id === toastId);
            if (toastIndex === -1) return;

            const toast = this.activeToasts[toastIndex];

            // Clear timeout
            if (toast.dismissTimeout) {
                clearTimeout(toast.dismissTimeout);
            }

            // Animate out
            toast.element.classList.remove('toast-show');
            toast.element.classList.add('toast-hide');

            // Call onDismiss callback
            if (toast.options.onDismiss) {
                toast.options.onDismiss();
            }

            // Remove from DOM after animation
            setTimeout(() => {
                if (toast.element.parentNode) {
                    toast.element.parentNode.removeChild(toast.element);
                }
            }, 300);

            // Remove from tracking
            this.activeToasts.splice(toastIndex, 1);
        },

        /**
         * Update toast message
         */
        updateMessage(toastId, newMessage) {
            const toast = this.activeToasts.find(t => t.id === toastId);
            if (toast) {
                const messageEl = toast.element.querySelector('.toast-message');
                if (messageEl) {
                    messageEl.textContent = newMessage;
                }
            }
        },

        /**
         * Dismiss all toasts
         */
        dismissAll() {
            [...this.activeToasts].forEach(toast => {
                this.dismiss(toast.id);
            });
        },

        /**
         * Get default icon for toast type
         */
        getDefaultIcon(type) {
            const icons = {
                success: '✓',
                error: '✗',
                warning: '⚠',
                info: 'ℹ'
            };
            return icons[type] || icons.info;
        },

        // Convenience methods
        success(message, options = {}) {
            return this.show(message, 'success', options);
        },

        error(message, options = {}) {
            return this.show(message, 'error', {
                ...options,
                duration: options.duration ?? 6000 // Errors stay longer
            });
        },

        warning(message, options = {}) {
            return this.show(message, 'warning', options);
        },

        info(message, options = {}) {
            return this.show(message, 'info', options);
        },

        /**
         * Show toast with undo action
         */
        showWithUndo(message, onUndo, options = {}) {
            return this.show(message, 'success', {
                ...options,
                actions: [
                    {
                        label: 'Undo',
                        onClick: onUndo
                    }
                ]
            });
        },

        /**
         * Show loading toast
         */
        showLoading(message, options = {}) {
            return this.show(message, 'info', {
                ...options,
                duration: 0, // Don't auto-dismiss
                dismissible: false,
                icon: '<span class="toast-spinner"></span>',
                showProgress: false
            });
        },

        /**
         * Show promise-based toast (loading → success/error)
         */
        async promise(promise, messages = {}) {
            const defaultMessages = {
                loading: 'Loading...',
                success: 'Success!',
                error: 'Error occurred'
            };

            const msgs = { ...defaultMessages, ...messages };

            // Show loading toast
            const loadingToast = this.showLoading(msgs.loading);

            try {
                const result = await promise;
                loadingToast.dismiss();
                this.success(msgs.success);
                return result;
            } catch (error) {
                loadingToast.dismiss();
                this.error(msgs.error);
                throw error;
            }
        }
    };

    // Expose globally
    window.ToastNotifications = ToastNotifications;

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ToastNotifications.init());
    } else {
        ToastNotifications.init();
    }

})();
