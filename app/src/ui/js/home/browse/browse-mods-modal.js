import { Md3Modal } from '../../../utils/components/modal/modal.js';
import { gameBananaApi } from '../../../../core/config/api/gamebanana.js';
import { initCarousels } from '../../../utils/components/carousel/carousel.js';
import { installMod } from '../../../../backend/utils/fileSystem/downloader/mods.js';
import { isModInstalled } from '../../../../backend/utils/fileSystem/mods-library.js';

/**
 * Mod Details Modal Component
 * Displays GameBanana mod details using VanillaJS OOP, BEM, and strict XSS prevention.
 */
export class BrowseModModal {
    /**
     * Initializes a new Mod Modal instance.
     * @param {number|string} modId - The GameBanana Mod ID.
     */
    constructor(modId) {
        this.modId = modId;
        this.container = null;
        this.modal = null;
        this._listeners = []; // Track listeners for garbage collection
        
        this._init();
    }

    /**
     * Internal async initialization.
     * @private
     */
    async _init() {
        // Ensure template is in the DOM
        let template = document.getElementById('browse-mod-modal-template');
        if (!template) {
            try {
                const response = await fetch('src/ui/html/app-html/home/browse/browse-mods-modal.html');
                const html = await response.text();
                const div = document.createElement('div');
                div.innerHTML = html; // SAFE: Fetching our own local static trusted HTML template
                template = div.querySelector('template');
                document.body.appendChild(template);
            } catch (err) {
                console.error('[BrowseModModal] Failed to load modal template', err);
                return;
            }
        }

        this.modal = new Md3Modal('browse-mod-modal-template', {
            width: '90vw',
            height: '90vh'
        });
        
        this.container = this.modal.container;
        
        const titleEl = this.container.querySelector('#bmm-title');
        if (titleEl) titleEl.textContent = 'Loading Mod Details...';

        this._setupSkeletons();
        
        this.modal.open();
        
        // Ensure Modal destroys cleanly when closed, removing our listeners too
        const originalClose = this.modal.close.bind(this.modal);
        this.modal.close = () => {
            this._cleanup();
            originalClose();
        };

        try {
            const details = await gameBananaApi.getModDetails(this.modId);
            if (!details) throw new Error("No details returned.");
            this._populate(details);
        } catch (error) {
            console.error('[BrowseModModal] Error loading mod details:', error);
            if (titleEl) titleEl.textContent = 'Failed to load mod details.';
        }
    }

    /**
     * Initializes skeletons while loading.
     * @private
     */
    _setupSkeletons() {
        const sidebar = this.container.querySelector('#bmm-info-list');
        if (sidebar) {
            sidebar.innerHTML = `
                <div style="height: 40px; background: var(--surface-container-highest); border-radius: 8px; margin-bottom: 12px; animation: pulse 1.5s infinite;"></div>
                <div style="height: 40px; background: var(--surface-container-highest); border-radius: 8px; margin-bottom: 12px; animation: pulse 1.5s infinite;"></div>
                <div style="height: 40px; background: var(--surface-container-highest); border-radius: 8px; margin-bottom: 12px; animation: pulse 1.5s infinite;"></div>
            `;
        }

        const downloads = this.container.querySelector('#bmm-downloads-list');
        if (downloads) {
            downloads.innerHTML = `
                <div style="height: 60px; background: var(--surface-container); border-radius: 12px; animation: pulse 1.5s infinite;"></div>
            `;
        }

        const desc = this.container.querySelector('#bmm-description-content');
        if (desc) {
            desc.innerHTML = `
                <div style="height: 20px; width: 80%; background: var(--surface-container-highest); border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
                <div style="height: 20px; width: 60%; background: var(--surface-container-highest); border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
                <div style="height: 20px; width: 90%; background: var(--surface-container-highest); border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
            `;
        }
    }

    /**
     * Populates the modal safely.
     * @param {Object} mod - The mod data object.
     * @private
     */
    _populate(mod) {
        // 1. Header (Title, Stats, Favorite)
        this._setupHeaderBar(mod);

        // 2. Carousel
        this._setupCarousel(mod.images || []);

        // 3. Downloads (Connected to Backend)
        this._setupDownloads(mod);

        // 4. Description (Sanitized HTML injection)
        this._setupDescription(mod.description || '');

        // 5. Sidebar details (Credits & Authors)
        this._setupSidebar(mod);
    }
    
    /**
     * Sets up the Header Bar below the carousel (Title, Stats, Favorite).
     * @param {Object} mod 
     */
    _setupHeaderBar(mod) {
        const titleEl = this.container.querySelector('#bmm-title');
        if (titleEl) {
            titleEl.textContent = mod.title || 'Unknown Mod';
            titleEl.href = mod.gameBananaUrl || '#';
        }

        const statsRow = this.container.querySelector('#bmm-stats-row');
        if (statsRow) {
            statsRow.textContent = ''; // Clear skeletons if any
            statsRow.style.display = 'flex';
            statsRow.style.gap = '16px';
            
            const createStat = (iconPath, value) => {
                const statEl = document.createElement('div');
                statEl.style.display = 'flex';
                statEl.style.alignItems = 'center';
                statEl.style.gap = '6px';
                statEl.style.fontSize = '13px';
                statEl.style.fontWeight = '500';
                
                const icon = document.createElement('img');
                icon.src = iconPath;
                icon.style.width = '16px';
                icon.style.opacity = '0.8';
                if (iconPath.includes('calendar')) icon.style.filter = 'brightness(0) invert(1)';
                
                const text = document.createElement('span');
                text.textContent = value;
                
                statEl.appendChild(icon);
                statEl.appendChild(text);
                return statEl;
            };

            statsRow.appendChild(createStat('assets/app/icons/eye.svg', (mod.views || 0).toLocaleString()));
            statsRow.appendChild(createStat('assets/app/icons/likes.svg', (mod.likes || 0).toLocaleString()));
            statsRow.appendChild(createStat('assets/app/icons/calendar.svg', mod.timeAgo));
        }

        const favBtn = this.container.querySelector('#bmm-favorite-btn');
        if (favBtn) {
            // Heart SVG
            favBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            `;
            const toggleFav = () => {
                favBtn.classList.toggle('is-active');
            };
            favBtn.addEventListener('click', toggleFav);
            this._listeners.push({ el: favBtn, type: 'click', handler: toggleFav });
        }
    }

    /**
     * Secures and injects HTML content using DOMParser.
     * @param {string} html - Raw HTML from API.
     * @private
     */
    _setupDescription(html) {
        const container = this.container.querySelector('#bmm-description-content');
        if (!container) return;
        
        container.textContent = ''; // Clear skeleton

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove dangerous tags
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form'];
        dangerousTags.forEach(tag => {
            const elements = doc.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });

        // Strip dangerous attributes (on*)
        const allElements = doc.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on') || attr.name.toLowerCase() === 'javascript:') {
                    el.removeAttribute(attr.name);
                }
            });
            // Ensure links open in new tab
            if (el.tagName.toLowerCase() === 'a') {
                el.setAttribute('target', '_blank');
            }
        });

        // Move sanitized nodes securely to container
        while (doc.body.firstChild) {
            container.appendChild(doc.body.firstChild);
        }
    }

    /**
     * Sets up the GameBanana details sidebar.
     * @param {Object} mod - The mod data.
     * @private
     */
    _setupSidebar(mod) {
        const list = this.container.querySelector('#bmm-info-list');
        if (!list) return;
        
        list.textContent = ''; // Clear skeletons

        // Add Uploader
        const uploaderTitle = document.createElement('h4');
        uploaderTitle.style.fontSize = '12px';
        uploaderTitle.style.fontWeight = '600';
        uploaderTitle.style.color = 'var(--md3-sys-color-primary, var(--primary))';
        uploaderTitle.style.margin = '0 0 8px 0';
        uploaderTitle.style.textTransform = 'uppercase';
        uploaderTitle.textContent = 'Uploader';
        list.appendChild(uploaderTitle);
        
        const uploaderContainer = document.createElement('div');
        uploaderContainer.style.display = 'flex';
        uploaderContainer.style.marginBottom = '16px';
        
        const createChip = (name, role, avatarUrl) => {
            const chip = document.createElement('div');
            chip.className = 'browse-mod-modal__credit-chip';
            
            if (avatarUrl) {
                const img = document.createElement('img');
                img.src = avatarUrl;
                img.className = 'browse-mod-modal__credit-avatar';
                chip.appendChild(img);
            } else {
                const fallback = document.createElement('div');
                fallback.className = 'browse-mod-modal__credit-avatar-fallback';
                fallback.textContent = name.charAt(0).toUpperCase();
                chip.appendChild(fallback);
            }
            
            const textWrap = document.createElement('div');
            textWrap.className = 'browse-mod-modal__credit-text';
            
            const nameEl = document.createElement('span');
            nameEl.className = 'browse-mod-modal__credit-name';
            nameEl.textContent = name;
            
            const roleEl = document.createElement('span');
            roleEl.className = 'browse-mod-modal__credit-role';
            roleEl.textContent = role;
            
            textWrap.appendChild(nameEl);
            textWrap.appendChild(roleEl);
            chip.appendChild(textWrap);
            
            return chip;
        };

        uploaderContainer.appendChild(createChip(mod.author, 'Uploader', mod.authorAvatar));
        list.appendChild(uploaderContainer);
        
        // Add Credits
        if (mod.credits && mod.credits.length > 0) {
            mod.credits.forEach(creditCategory => {
                if (!creditCategory._aAuthors || creditCategory._aAuthors.length === 0) return;
                
                const groupTitle = document.createElement('h4');
                groupTitle.style.fontSize = '12px';
                groupTitle.style.fontWeight = '600';
                groupTitle.style.color = 'var(--md3-sys-color-primary, var(--primary))';
                groupTitle.style.margin = '0 0 8px 0';
                groupTitle.style.textTransform = 'uppercase';
                groupTitle.textContent = creditCategory._sGroupName || 'Credits';
                list.appendChild(groupTitle);

                const groupContainer = document.createElement('div');
                groupContainer.className = 'browse-mod-modal__credit-group';
                
                creditCategory._aAuthors.forEach(author => {
                    groupContainer.appendChild(createChip(author._sName, author._sRole || 'Contributor', author._sAvatarUrl));
                });
                
                list.appendChild(groupContainer);
            });
        }

        // Credits and Groups already added above, no stats here anymore since they moved to the header bar.
    }

    /**
     * Sets up the download buttons securely.
     * @param {Object} mod - The full mod object to pass to installMod.
     * @private
     */
    async _setupDownloads(mod) {
        const downloads = mod.downloadOptions || [];
        const list = this.container.querySelector('#bmm-downloads-list');
        if (!list) return;
        
        list.textContent = ''; // Clear skeletons
        
        // Check if this mod is already in the local index
        const isInstalled = await isModInstalled(this.modId).catch(() => false);

        if (downloads.length === 0) {
            const empty = document.createElement('span');
            empty.textContent = 'No downloads available.';
            empty.style.opacity = '0.7';
            empty.style.fontSize = '14px';
            list.appendChild(empty);
            return;
        }

        downloads.forEach(dl => {
            const item = document.createElement('div');
            item.className = 'browse-mod-modal__download-item';

            const info = document.createElement('div');
            info.className = 'browse-mod-modal__download-info';
            
            const name = document.createElement('span');
            name.className = 'browse-mod-modal__download-name';
            name.textContent = dl.name || 'Download';
            
            let label = dl.type === 'external' ? 'External Link' : 'GameBanana File';
            let sizeText = dl.fileSizeStr || 'Unknown size';
            
            if (dl.type === 'external' && dl.fileSizeStr && dl.fileSizeStr.includes(' • ')) {
                const parts = dl.fileSizeStr.split(' • ');
                label = parts[0];
                sizeText = parts[1];
            } else if (dl.type === 'external' && dl.fileSizeStr && !dl.fileSizeStr.includes(' • ')) {
                label = dl.fileSizeStr; 
                sizeText = 'Unknown size';
            }

            const subName = document.createElement('span');
            subName.className = 'browse-mod-modal__download-subname';
            subName.textContent = label;
            
            info.appendChild(name);
            info.appendChild(subName);

            const action = document.createElement('div');
            action.className = 'browse-mod-modal__download-action';

            const btn = document.createElement('button');
            btn.className = 'browse-mod-modal__download-btn';
            
            const svgWrap = document.createElement('div');
            svgWrap.style.display = 'flex';
            svgWrap.style.alignItems = 'center';
            svgWrap.style.gap = '8px';

            const svgIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
            `;
            svgWrap.innerHTML = svgIcon;
            
            const btnText = document.createTextNode('Download');
            svgWrap.appendChild(btnText);
            
            const size = document.createElement('span');
            size.className = 'browse-mod-modal__download-size';
            size.textContent = sizeText;

            btn.appendChild(svgWrap);
            btn.appendChild(size);

            if (isInstalled) {
                btnText.textContent = 'Already Installed';
                btn.style.backgroundColor = 'var(--md3-sys-color-tertiary-container, var(--tertiary-container))';
                btn.style.color = 'var(--md3-sys-color-on-tertiary-container, var(--on-tertiary-container))';
                btn.style.pointerEvents = 'none'; // Lock the button if it's already installed
            } else {
                const clickHandler = async () => {
                    if (!dl.downloadUrl) return;
                    
                    // Update UI visually
                    btnText.textContent = 'Installing...';
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.7';

                    try {
                        const result = await installMod(this.modId, mod.title, mod.categoryId, dl.downloadUrl);
                        if (result && result.success) {
                            btnText.textContent = 'Installed';
                            btn.style.backgroundColor = 'var(--md3-sys-color-tertiary-container, var(--tertiary-container))';
                            btn.style.color = 'var(--md3-sys-color-on-tertiary-container, var(--on-tertiary-container))';
                        } else {
                            throw new Error(result ? result.error : 'Unknown error');
                        }
                    } catch (error) {
                        console.error('[BrowseModModal] Install failed:', error);
                        btnText.textContent = 'Error';
                        btn.style.backgroundColor = 'var(--md3-sys-color-error-container, var(--error-container))';
                        btn.style.color = 'var(--md3-sys-color-on-error-container, var(--on-error-container))';
                        
                        // Allow retry on error
                        setTimeout(() => {
                            btnText.textContent = 'Download';
                            btn.style.pointerEvents = 'auto';
                            btn.style.opacity = '1';
                            btn.style.backgroundColor = '';
                            btn.style.color = '';
                        }, 3000);
                    }
                };
                btn.addEventListener('click', clickHandler);
                this._listeners.push({ el: btn, type: 'click', handler: clickHandler });
            }

            action.appendChild(btn);

            item.appendChild(info);
            item.appendChild(action);
            list.appendChild(item);
        });
    }

    /**
     * Sets up the automatic infinite carousel.
     * @param {Array} images - Array of image URLs.
     * @private
     */
    _setupCarousel(images) {
        const scroller = this.container.querySelector('#bmm-carousel-scroller');
        if (!scroller || images.length === 0) return;

        images.forEach(imgUrl => {
            const item = document.createElement('div');
            item.className = 'm3-carousel-item';
            
            const card = document.createElement('div');
            card.className = 'm3-card';
            
            const img = document.createElement('img');
            img.className = 'm3-card-img';
            img.src = imgUrl;
            img.alt = 'Mod Image';
            
            card.appendChild(img);
            item.appendChild(card);
            scroller.appendChild(item);
        });

        const carouselEl = this.container.querySelector('.browse-mod-modal__carousel');
        
        // Let the global initCarousels process this specific element
        // (Assuming initCarousels scans the DOM, but it might only scan document.
        // We will call the underlying component logic directly, or re-run initCarousels with container)
        initCarousels(this.container); 

        const api = carouselEl.m3CarouselAPI;
        if (api) {
            this._setupCarouselControls(api, images.length);
        }
    }

    /**
     * Logic for carousel pills and buttons.
     * @private
     */
    _setupCarouselControls(api, totalItems) {
        const controls = this.container.querySelector('.browse-mod-modal__carousel-controls');
        if (!controls) return;
        
        const prevBtn = controls.querySelector('.browse-carousel-prev');
        const nextBtn = controls.querySelector('.browse-carousel-next');
        const pillsContainer = controls.querySelector('.browse-carousel-pills');
        
        if (!prevBtn || !nextBtn || !pillsContainer) return;

        const maxPills = Math.min(totalItems, 4); // Maximo 4 pastillas
        
        const prevHandler = () => api.goToLogicalIndex(api.currentIndex - 1);
        const nextHandler = () => api.goToLogicalIndex(api.currentIndex + 1);
        
        prevBtn.addEventListener('click', prevHandler);
        nextBtn.addEventListener('click', nextHandler);
        
        this._listeners.push({ el: prevBtn, type: 'click', handler: prevHandler });
        this._listeners.push({ el: nextBtn, type: 'click', handler: nextHandler });

        const pills = [];
        for (let i = 0; i < maxPills; i++) {
            const pill = document.createElement('div');
            pill.className = 'browse-carousel-pill';
            const fill = document.createElement('div');
            fill.className = 'browse-carousel-pill-fill';
            pill.appendChild(fill);
            
            const pillHandler = () => {
                // Approximate logic to jump:
                api.goToLogicalIndex(i);
            };
            pill.addEventListener('click', pillHandler);
            this._listeners.push({ el: pill, type: 'click', handler: pillHandler });
            
            pillsContainer.appendChild(pill);
            pills.push(pill);
        }
        
        const slideHandler = (e) => {
            const index = e.detail.index; 
            const pillIndex = index % maxPills; 
            
            pills.forEach((p, i) => {
                if (i === pillIndex) {
                    p.classList.remove('is-active');
                    void p.offsetWidth;
                    p.classList.add('is-active');
                    const fill = p.querySelector('.browse-carousel-pill-fill');
                    if (fill) fill.style.animationDuration = '3s';
                } else {
                    p.classList.remove('is-active');
                }
            });
        };
        
        api.element.addEventListener('m3-carousel-slide-change', slideHandler);
        this._listeners.push({ el: api.element, type: 'm3-carousel-slide-change', handler: slideHandler });
        
        if (pills[0]) {
            pills[0].classList.add('is-active');
            const fill = pills[0].querySelector('.browse-carousel-pill-fill');
            if (fill) fill.style.animationDuration = '3s';
        }
    }

    /**
     * Garbage collection optimization: removes event listeners before destroying.
     * @private
     */
    _cleanup() {
        this._listeners.forEach(({ el, type, handler }) => {
            if (el) el.removeEventListener(type, handler);
        });
        this._listeners = [];
        this.container = null;
        this.modal = null;
    }
}
