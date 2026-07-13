import { FS } from './filesystem.js';
import { appEvents } from '../core/events.js';

/**
 * Class representing a global toast notification for tracking download progress.
 * It creates a floating UI element that persists across different views
 * to keep the user informed about the current download state.
 */
class GlobalDownloadToast {
    /**
     * Initializes the toast notification, sets the default view context,
     * and binds the necessary event listeners.
     */
    constructor() {
        this.el = null;
        this.currentView = 'engines';
        this.lastData = null;
        this.createUI();
        this.bindEvents();
    }
    
    /**
     * Constructs and injects the DOM elements for the toast notification
     * if they do not already exist in the document.
     */
    createUI() {
        if (document.getElementById('global-dl-toast')) return;
        this.el = document.createElement('div');
        this.el.className = 'global-dl-toast';
        this.el.innerHTML = `
            <span class="toast-title" id="toast-title">Downloading Engine</span>
            <span class="toast-status" id="toast-status">0%</span>
        `;
        document.body.appendChild(this.el);
    }

    /**
     * Binds internal events to external application triggers, such as
     * file system updates and view changes.
     */
    bindEvents() {
        FS.addEventListener('dl:update', (e) => this.handleUpdate(e.detail));
        
        appEvents.addEventListener('view:loaded', (e) => {
            this.currentView = e.detail;
            this.checkVisibility();
        });
    }

    /**
     * Processes download progress data and updates the textual content
     * of the toast notification.
     * 
     * @param {Object} data - The download progress payload.
     */
    handleUpdate(data) {
        this.lastData = data;
        if (!data || data.state === 'finished' || data.state === 'cancelled' || data.state === 'error') {
            this.lastData = null;
        } else if (this.el) {
            document.getElementById('toast-title').textContent = `Downloading ${data.engineName}`;
            document.getElementById('toast-status').textContent = data.text;
        }
        this.checkVisibility();
    }

    /**
     * Evaluates whether the toast should be visible based on the presence
     * of active download data and the user's current view.
     */
    checkVisibility() {
        if (!this.el) return;
        if (this.lastData && this.currentView !== 'engines') {
            this.el.classList.add('show');
        } else {
            this.el.classList.remove('show');
        }
    }
}

// Inicializamos y exportamos la instancia para que viva globalmente al ser importada
export const globalDownloadToast = new GlobalDownloadToast();