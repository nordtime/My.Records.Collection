/**
 * Loading States & Optimistic UI Module
 * Provides skeleton loaders, optimistic updates, and loading indicators
 */

// Loading state management
let isLoading = false;
let loadingAbortController = null;

/**
 * Show skeleton loaders in the grid
 */
function showSkeletonLoaders(count = 6) {
    const grid = document.getElementById('recordsGrid');
    if (!grid) return;

    const skeletons = Array(count).fill(0).map(() => `
        <div class="record-card skeleton-card">
            <div class="skeleton-cover skeleton-shimmer"></div>
            <div class="skeleton-body">
                <div class="skeleton-text skeleton-shimmer"></div>
                <div class="skeleton-text skeleton-text-short skeleton-shimmer"></div>
                <div class="skeleton-badges">
                    <div class="skeleton-badge skeleton-shimmer"></div>
                    <div class="skeleton-badge skeleton-shimmer"></div>
                </div>
            </div>
        </div>
    `).join('');

    grid.innerHTML = skeletons;
    grid.classList.remove('hidden');
}

/**
 * Hide skeleton loaders
 */
function hideSkeletonLoaders() {
    const grid = document.getElementById('recordsGrid');
    if (!grid) return;
    
    const skeletons = grid.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());
}

/**
 * Show loading indicator in specific element
 */
function showLoadingIndicator(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const loadingHTML = `
        <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <p class="loading-text">${message}</p>
        </div>
    `;

    element.innerHTML = loadingHTML;
}

/**
 * Show global loading bar at top of page
 */
function showLoadingBar() {
    let loadingBar = document.getElementById('globalLoadingBar');
    
    if (!loadingBar) {
        loadingBar = document.createElement('div');
        loadingBar.id = 'globalLoadingBar';
        loadingBar.className = 'loading-bar';
        document.body.appendChild(loadingBar);
    }

    loadingBar.classList.add('loading-bar-active');
    
    // Animate progress
    setTimeout(() => {
        loadingBar.style.width = '70%';
    }, 100);
}

/**
 * Hide global loading bar
 */
function hideLoadingBar() {
    const loadingBar = document.getElementById('globalLoadingBar');
    if (!loadingBar) return;

    loadingBar.style.width = '100%';
    
    setTimeout(() => {
        loadingBar.classList.remove('loading-bar-active');
        setTimeout(() => {
            loadingBar.style.width = '0%';
        }, 300);
    }, 200);
}

/**
 * Show connection status indicator
 */
function showConnectionStatus(status = 'online') {
    let indicator = document.getElementById('connectionStatus');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connectionStatus';
        indicator.className = 'connection-status';
        document.body.appendChild(indicator);
    }

    const messages = {
        'online': '✓ Connected',
        'offline': '⚠ No Connection',
        'slow': '⚠ Slow Connection',
        'error': '✗ Connection Error'
    };

    const classes = {
        'online': 'connection-online',
        'offline': 'connection-offline',
        'slow': 'connection-slow',
        'error': 'connection-error'
    };

    indicator.textContent = messages[status] || messages.online;
    indicator.className = `connection-status ${classes[status] || ''}`;
    indicator.classList.add('connection-status-visible');

    // Auto-hide online status after 2 seconds
    if (status === 'online') {
        setTimeout(() => {
            indicator.classList.remove('connection-status-visible');
        }, 2000);
    }
}

/**
 * Optimistic update - immediately update UI, rollback on error
 */
async function optimisticUpdate(
    updateFn,
    optimisticUI,
    rollbackUI,
    errorHandler
) {
    // Apply optimistic update immediately
    if (optimisticUI) {
        optimisticUI();
    }

    try {
        // Perform actual update
        const result = await updateFn();
        return result;
    } catch (error) {
        // Rollback on error
        if (rollbackUI) {
            rollbackUI();
        }
        
        if (errorHandler) {
            errorHandler(error);
        }
        
        throw error;
    }
}

/**
 * Retry mechanism with exponential backoff
 */
async function retryWithBackoff(
    fn,
    maxRetries = 3,
    initialDelay = 1000,
    onRetry = null
) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                
                if (onRetry) {
                    onRetry(attempt + 1, maxRetries, delay);
                }
                
                await sleep(delay);
            }
        }
    }
    
    throw lastError;
}

/**
 * Sleep helper for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Progressive loading with intersection observer
 */
class ProgressiveLoader {
    constructor(options = {}) {
        this.pageSize = options.pageSize || 20;
        this.currentPage = 0;
        this.allItems = [];
        this.hasMore = true;
        this.isLoading = false;
        this.container = options.container || document.getElementById('recordsGrid');
        this.onLoadMore = options.onLoadMore || null;
        
        this.initObserver();
    }

    initObserver() {
        // Create sentinel element for infinite scroll
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'loading-sentinel';
        this.sentinel.style.height = '1px';
        
        this.observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !this.isLoading && this.hasMore) {
                    this.loadMore();
                }
            },
            { threshold: 0.1 }
        );
    }

    setItems(items) {
        this.allItems = items;
        this.currentPage = 0;
        this.hasMore = items.length > this.pageSize;
    }

    async loadMore() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        const chunk = this.allItems.slice(start, end);

        if (this.onLoadMore) {
            await this.onLoadMore(chunk, this.currentPage);
        }

        this.currentPage++;
        this.hasMore = end < this.allItems.length;
        this.isLoading = false;

        // Attach sentinel if more items exist
        if (this.hasMore && this.container) {
            if (!this.container.contains(this.sentinel)) {
                this.container.appendChild(this.sentinel);
                this.observer.observe(this.sentinel);
            }
        } else {
            this.detachSentinel();
        }
    }

    detachSentinel() {
        if (this.sentinel && this.observer) {
            this.observer.unobserve(this.sentinel);
            if (this.sentinel.parentNode) {
                this.sentinel.parentNode.removeChild(this.sentinel);
            }
        }
    }

    reset() {
        this.currentPage = 0;
        this.hasMore = true;
        this.isLoading = false;
        this.detachSentinel();
    }

    destroy() {
        this.detachSentinel();
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Cancel ongoing requests
 */
function cancelOngoingRequests() {
    if (loadingAbortController) {
        loadingAbortController.abort();
        loadingAbortController = null;
    }
}

/**
 * Create abort controller for cancellable requests
 */
function createAbortController() {
    cancelOngoingRequests();
    loadingAbortController = new AbortController();
    return loadingAbortController;
}

/**
 * Monitor network connection
 */
function monitorConnection() {
    window.addEventListener('online', () => {
        showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
        showConnectionStatus('offline');
    });

    // Check initial status
    if (!navigator.onLine) {
        showConnectionStatus('offline');
    }
}

/**
 * Show action feedback (for optimistic updates)
 */
function showActionFeedback(message, type = 'info', duration = 2000) {
    let feedback = document.getElementById('actionFeedback');
    
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'actionFeedback';
        feedback.className = 'action-feedback';
        document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.className = `action-feedback action-feedback-${type} action-feedback-visible`;

    setTimeout(() => {
        feedback.classList.remove('action-feedback-visible');
    }, duration);
}

/**
 * Preload images for better UX
 */
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Batch preload multiple images
 */
async function preloadImages(urls, onProgress = null) {
    const promises = urls.map((url, index) => 
        preloadImage(url).then(() => {
            if (onProgress) {
                onProgress(index + 1, urls.length);
            }
        }).catch(() => {
            // Silently fail for individual images
            if (onProgress) {
                onProgress(index + 1, urls.length);
            }
        })
    );

    await Promise.allSettled(promises);
}

// Auto-initialize connection monitoring
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorConnection);
} else {
    monitorConnection();
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LoadingStates = {
        showSkeletonLoaders,
        hideSkeletonLoaders,
        showLoadingIndicator,
        showLoadingBar,
        hideLoadingBar,
        showConnectionStatus,
        optimisticUpdate,
        retryWithBackoff,
        ProgressiveLoader,
        cancelOngoingRequests,
        createAbortController,
        showActionFeedback,
        preloadImages
    };
}
