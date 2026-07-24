/**
 * Md3Modal - Global Modal Component based on Material Design 3.
 * Uses HTML <template> tags for fully customizable content.
 * Follows BEM methodology and provides XSS protection by avoiding innerHTML.
 */
export class Md3Modal {
    /**
     * Creates a new Modal instance.
     * @param {string} templateId - The ID of the HTML <template> to inject into the modal.
     * @param {Object} [config={}] - Optional configuration object.
     * @param {string} [config.backdropBlur] - Blur amount (e.g., '4px').
     * @param {string} [config.backdropOpacity] - Opacity of the backdrop (e.g., '0.5').
     * @param {string} [config.backdropColor] - Background color of the backdrop (default: var(--surface-container)).
     * @param {string} [config.width] - Modal width (default: 'auto').
     * @param {string} [config.height] - Modal height (default: 'auto').
     * @param {string} [config.marginTop] - Top margin/positioning (default: 'auto').
     * @param {string} [config.marginBottom] - Bottom margin/positioning (default: 'auto').
     */
    constructor(templateId, config = {}) {
        this.templateId = templateId;
        
        // Find the root container in the DOM
        this.rootContainer = document.getElementById('md3-modal-root');
        if (!this.rootContainer) {
            throw new Error('Fatal: #md3-modal-root not found in the DOM.');
        }

        const template = document.getElementById(this.templateId);
        if (!template) {
            throw new Error(`Fatal: Template #${this.templateId} not found in the DOM.`);
        }

        // Parse config falling back to template data attributes, then defaults
        this.config = {
            backdropBlur: config.backdropBlur || template.dataset.backdropBlur || '4px',
            backdropOpacity: config.backdropOpacity || template.dataset.backdropOpacity || '0.5',
            backdropColor: config.backdropColor || template.dataset.backdropColor || 'var(--surface-container)',
            width: config.width || template.dataset.width || 'auto',
            height: config.height || template.dataset.height || 'auto',
            marginTop: config.marginTop || template.dataset.marginTop || 'auto',
            marginBottom: config.marginBottom || template.dataset.marginBottom || 'auto'
        };

        this._buildDOM(template);
        this._bindEvents();
    }

    /**
     * Builds the Modal DOM structure securely.
     * @param {HTMLTemplateElement} template - The template to clone.
     * @private
     */
    _buildDOM(template) {
        // Main wrapper acting as the backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'md3-component-modal__backdrop';
        
        // Apply backdrop dynamic styles
        this.backdrop.style.setProperty('--modal-backdrop-blur', this.config.backdropBlur);
        this.backdrop.style.setProperty('--modal-backdrop-opacity', this.config.backdropOpacity);
        this.backdrop.style.setProperty('--modal-backdrop-color', this.config.backdropColor);

        // The modal container holding the content
        this.container = document.createElement('div');
        this.container.className = 'md3-component-modal__container';
        
        // Apply layout dynamic styles
        this.container.style.width = this.config.width;
        this.container.style.height = this.config.height;
        this.container.style.marginTop = this.config.marginTop;
        this.container.style.marginBottom = this.config.marginBottom;

        // Clone and inject the template content securely
        const contentClone = template.content.cloneNode(true);
        this.container.appendChild(contentClone);

        this.backdrop.appendChild(this.container);
    }

    /**
     * Binds internal event listeners.
     * @private
     */
    _bindEvents() {
        this._listeners = {
            backdropClick: (e) => {
                // Close only if the click was directly on the backdrop, not its children
                if (e.target === this.backdrop) {
                    this.close();
                }
            },
            escapeKey: (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            }
        };

        this.backdrop.addEventListener('click', this._listeners.backdropClick);
        document.addEventListener('keydown', this._listeners.escapeKey);
    }

    /**
     * Opens the modal by appending it to the root container.
     */
    open() {
        this.rootContainer.appendChild(this.backdrop);
        
        // Trigger reflow for CSS transitions to apply
        void this.backdrop.offsetWidth;
        this.backdrop.classList.add('md3-component-modal__backdrop--visible');
        this.container.classList.add('md3-component-modal__container--visible');
    }

    /**
     * Closes the modal with an animation and automatically destroys it afterwards.
     */
    close() {
        this.backdrop.classList.remove('md3-component-modal__backdrop--visible');
        this.container.classList.remove('md3-component-modal__container--visible');

        // Wait for the CSS transition to finish before destroying
        setTimeout(() => {
            this.destroy();
        }, 200); // 200ms matches the CSS transition duration
    }

    /**
     * Cleans up the DOM, event listeners, and memory references.
     */
    destroy() {
        if (this._listeners) {
            this.backdrop.removeEventListener('click', this._listeners.backdropClick);
            document.removeEventListener('keydown', this._listeners.escapeKey);
            this._listeners = null;
        }

        if (this.backdrop.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }

        // Wipe internal HTML just to be safe with memory
        this.backdrop.textContent = '';
        this.backdrop = null;
        this.container = null;
    }

    /**
     * Static helper to quickly instantiate and open a modal.
     * @param {string} templateId - The ID of the HTML <template>.
     * @param {Object} [config={}] - Optional configuration object.
     * @returns {Md3Modal} The modal instance.
     */
    static show(templateId, config = {}) {
        const modal = new Md3Modal(templateId, config);
        modal.open();
        return modal;
    }
}
