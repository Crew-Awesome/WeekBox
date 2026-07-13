import { FS } from './filesystem.js';
import { appEvents } from '../core/events.js';

class GlobalDownloadToast {
    constructor() {
        this.el = null;
        this.currentView = 'engines';
        this.lastData = null;
        this.createUI();
        this.bindEvents();
    }
    
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

    bindEvents() {
        FS.addEventListener('dl:update', (e) => this.handleUpdate(e.detail));
        
        appEvents.addEventListener('view:loaded', (e) => {
            this.currentView = e.detail;
            this.checkVisibility();
        });
    }

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

    checkVisibility() {
        if (!this.el) return;
        if (this.lastData && this.currentView !== 'engines') {
            this.el.classList.add('show');
        } else {
            this.el.classList.remove('show');
        }
    }
}

export const globalDownloadToast = new GlobalDownloadToast();
