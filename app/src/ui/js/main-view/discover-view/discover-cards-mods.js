import { applyDynamicColor } from '../../../utils/dynamic-color.js';
import { gameBananaApi } from '../../../../core/config/api/gamebanana.js';
import { installMod } from '../../../../backend/utils/fileSystem/downloader/mods.js';
import { isModInstalled } from '../../../../backend/utils/fileSystem/mods-library.js';
import { initCards } from '../../../utils/components/cards/cards.js';

/**
 * Web Component representing a single Mod Card.
 * Uses Light DOM to inherit global styles such as '.md3-component-card'.
 * @extends HTMLElement
 */
export class ModCard extends HTMLElement {
    /**
     * Initializes the ModCard component.
     */
    constructor() {
        super();
        this._mod = null;
    }

    /**
     * Sets the mod data and triggers a re-render if the component is connected to the DOM.
     * @param {Object} data - The mod data object.
     */
    set mod(data) {
        this._mod = data;
        if (this.isConnected) {
            this.render();
        }
    }

    /**
     * Gets the current mod data.
     * @returns {Object} The mod data object.
     */
    get mod() {
        return this._mod;
    }

    /**
     * Invoked when the custom element is first connected to the document's DOM.
     * Triggers the initial render if mod data is already provided.
     */
    connectedCallback() {
        if (this._mod && !this.hasChildNodes()) {
            this.render();
        }
    }

    /**
     * Renders the card by cloning the template and injecting data securely.
     */
    render() {
        if (!this._mod) return;
        
        const template = document.querySelector('#mod-card-template');
        if (!template) {
            console.error('mod-card-template not found in the DOM');
            return;
        }

        /**
         * Securely clone the template.
         * Using .textContent prevents XSS vulnerabilities when injecting dynamic data.
         */
        const clone = template.content.cloneNode(true);
        
        const card = clone.querySelector('.md3-component-card');
        const engineBadge = clone.querySelector('.card-badge-engine');
        const img = clone.querySelector('.mod-thumbnail');
        const title = clone.querySelector('.mod-title');
        const authorStats = clone.querySelector('.mod-author-stats');
        const downloadBtn = clone.querySelector('.download-btn');

        engineBadge.textContent = this._mod.engineId || 'Unknown Engine';
        title.textContent = this._mod.title;
        
        const formatNumber = num => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
        authorStats.textContent = `${this._mod.author} • ${formatNumber(this._mod.views)} views • ${this._mod.timeAgo}`;

        img.src = this._mod.image || '';
        img.alt = this._mod.title || 'Mod Thumbnail';
        
        isModInstalled(this._mod.id).then(installed => {
            if (installed) {
                downloadBtn.textContent = 'Instalado';
                downloadBtn.style.backgroundColor = 'var(--m3-component-primary)';
                downloadBtn.style.color = 'var(--m3-component-on-primary)';
                downloadBtn.disabled = true;
            }
        });
        
        this.addEventListeners(card, downloadBtn);
        
        this.appendChild(clone);
        
        const cardElement = this.querySelector('.md3-component-card');
        const imgElement = this.querySelector('.mod-thumbnail');
        applyDynamicColor(cardElement, imgElement);
        
        /**
         * Initialize ripple effects on the newly rendered card.
         */
        initCards(this);
    }

    /**
     * Attaches interaction events to the card and its download button.
     * @param {HTMLElement} cardElement - The main card container element.
     * @param {HTMLElement} downloadBtn - The download button element.
     */
    addEventListeners(cardElement, downloadBtn) {
        const modId = this._mod.id;
        const modTitle = this._mod.title;

        cardElement.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            if (window.Neutralino) {
                Neutralino.os.open(`https://gamebanana.com/mods/${modId}`);
            } else {
                window.open(`https://gamebanana.com/mods/${modId}`, '_blank');
            }
        });

        // Evita que el ripple de la tarjeta se active al presionar el botón
        downloadBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Cargando...';
            downloadBtn.disabled = true;
            
            try {
                const details = await gameBananaApi.getModDetails(modId);
                const options = details?.downloadOptions || [];
                
                if (options.length === 0) {
                    throw new Error("No download URL found for this mod.");
                }
                
                if (options.length === 1) {
                    await this.handleDownloadOption(options[0], downloadBtn, modId, modTitle, details.engineId, originalText);
                } else {
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                    this.showDropdown(cardElement, downloadBtn, options, modId, modTitle, details.engineId, originalText);
                }
            } catch (error) {
                console.error("Error fetching mod details:", error);
                downloadBtn.textContent = 'Error';
                setTimeout(() => {
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                }, 3000);
            }
        });
    }

    /**
     * Procesa la opción de descarga seleccionada.
     */
    async handleDownloadOption(option, downloadBtn, modId, modTitle, engineId, originalText) {
        await this.startDownload(downloadBtn, modId, modTitle, engineId, option.downloadUrl, originalText);
    }

    /**
     * Inicia el proceso de descarga.
     */
    async startDownload(downloadBtn, modId, modTitle, engineId, downloadUrl, originalText) {
        downloadBtn.textContent = 'Descargando...';
        downloadBtn.disabled = true;
        try {
            const result = await installMod(modId, modTitle, engineId || this._mod.engineId || 'Unknown Engine', downloadUrl);
            
            if (result.success) {
                downloadBtn.textContent = 'Instalado';
                downloadBtn.style.backgroundColor = 'var(--m3-component-primary)';
                downloadBtn.style.color = 'var(--m3-component-on-primary)';
                downloadBtn.disabled = true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error during mod installation:", error);
            downloadBtn.textContent = 'Error';
            setTimeout(() => {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }, 3000);
        }
    }

    /**
     * Muestra el menú de opciones múltiples de descarga.
     */
    showDropdown(cardElement, downloadBtn, options, modId, modTitle, engineId, originalText) {
        const dropdown = cardElement.querySelector('.download-dropdown');
        if (!dropdown) return;
        
        // Evitamos que los clics en el dropdown burbujeen hacia la tarjeta
        dropdown.addEventListener('click', (e) => e.stopPropagation());
        dropdown.addEventListener('pointerdown', (e) => e.stopPropagation());
        
        // Limpiamos opciones previas
        dropdown.innerHTML = '';
        
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'download-dropdown-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'dropdown-item-name';
            nameSpan.textContent = option.name;
            
            const sizeSpan = document.createElement('span');
            sizeSpan.className = 'dropdown-item-size';
            sizeSpan.textContent = option.fileSizeStr || '';
            
            btn.appendChild(nameSpan);
            btn.appendChild(sizeSpan);
            
            btn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
            });
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.remove('show');
                this.handleDownloadOption(option, downloadBtn, modId, modTitle, engineId, originalText);
            });
            
            dropdown.appendChild(btn);
        });
        
        // Alternamos la visibilidad
        dropdown.classList.toggle('show');
        
        // Cerrar si se hace clic afuera
        const outsideClickListener = (event) => {
            if (!dropdown.contains(event.target) && !downloadBtn.contains(event.target)) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', outsideClickListener);
            }
        };
        
        if (dropdown.classList.contains('show')) {
            document.addEventListener('click', outsideClickListener);
        }
    }
}

if (!customElements.get('mod-card')) {
    customElements.define('mod-card', ModCard);
}

/**
 * Renders the provided mods into the grid container securely.
 * @param {HTMLElement} container - The main discover view container.
 * @param {Array} mods - Array of mod objects to render.
 */
export function renderModsGrid(container, mods) {
    const grid = container.querySelector('#mods-grid');
    if (!grid) return;
    
    /**
     * Safely clear the grid using child removal instead of innerHTML.
     */
    while(grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    
    mods.forEach(mod => {
        const card = document.createElement('mod-card');
        card.mod = mod;
        grid.appendChild(card);
    });
}

/**
 * Fetches popular mods from the GameBanana API and triggers rendering.
 * @param {HTMLElement} container - The main discover view container.
 * @returns {Promise<void>}
 */
export async function loadDiscoverMods(container) {
    try {
        const response = await gameBananaApi.getGridMods('popular', 1);
        const mods = Array.isArray(response) ? response : response.mods || [];
        renderModsGrid(container, mods);
    } catch (err) {
        console.error('Error loading GameBanana mods for grid:', err);
    }
}
