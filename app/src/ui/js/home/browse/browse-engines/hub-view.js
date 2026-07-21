import { gameBananaApi } from '../../../../../core/config/api/gamebanana.js';
import { ENGINE_CATEGORY_IDS, ENGINE_DETAILS } from '../../../../../core/config/engines.js';
import { createModCard } from './mod-card.js';
import { openCategoryView } from './category-view.js';

let isPopstateAttached = false;
let currentContainer = null;

/**
 * Initializes the main hub view for browse, loading horizontal sliders for each engine category.
 * @param {HTMLElement} container - The main browse container.
 */
export async function loadEngineRows(container) {
    currentContainer = container;

    if (!window.history.state || window.history.state.page !== 'browse-hub') {
        window.history.replaceState({ page: 'browse-hub' }, '', '#browse-hub');
    }

    if (!isPopstateAttached) {
        window.addEventListener('popstate', (e) => {
            if (e.state && currentContainer) {
                if (e.state.page === 'browse-hub') {
                    const categoryView = currentContainer.querySelector('#browse-category-view');
                    if (categoryView) {
                        categoryView.style.display = 'none';
                        categoryView.textContent = '';
                    }
                    const hubCarousel = currentContainer.querySelector('.m3-carousel');
                    const hubControls = currentContainer.querySelector('.browse-carousel-controls');
                    const hubEngines = currentContainer.querySelector('#browse-engines-container');
                    if (hubCarousel) hubCarousel.style.display = '';
                    if (hubControls) hubControls.style.display = 'flex';
                    if (hubEngines) hubEngines.style.display = 'block';
                } else if (e.state.page === 'browse-category') {
                    openCategoryView(currentContainer, e.state.categoryId, e.state.engineInfo, true);
                }
            }
        });
        isPopstateAttached = true;
    }

    const enginesContainer = container.querySelector('#browse-engines-container');
    if (!enginesContainer) return;
    
    enginesContainer.textContent = '';
    
    const engineKeys = Object.keys(ENGINE_CATEGORY_IDS);
    const rowElements = new Map();
    const template = document.getElementById('tmpl-engine-row');
    
    if (!template) {
        console.error('Template #tmpl-engine-row not found in DOM.');
        return;
    }
    
    for (const key of engineKeys) {
        const categoryId = parseInt(key, 10);
        const engineInfo = ENGINE_DETAILS[ENGINE_CATEGORY_IDS[key]];
        
        if (!engineInfo) continue;
        
        const clone = template.content.cloneNode(true);
        const rowDiv = clone.querySelector('.browse-engine-row');
        
        const header = rowDiv.querySelector('.browse-engine-header');
        if (header && engineInfo.icon) {
            const iconImg = document.createElement('img');
            iconImg.src = `assets/engine-icons/${engineInfo.icon}`;
            iconImg.alt = engineInfo.name;
            iconImg.style.width = '24px';
            iconImg.style.height = '24px';
            header.insertBefore(iconImg, header.firstChild);
        }
        
        const titleSpan = rowDiv.querySelector('.browse-engine-title');
        if (titleSpan) {
            titleSpan.textContent = ` ${engineInfo.name} Mods (Cargando...)`;
        }
        
        const seeMoreBtn = rowDiv.querySelector('.browse-engine-see-more');
        if (seeMoreBtn) {
            seeMoreBtn.setAttribute('aria-label', `See more ${engineInfo.name} mods`);
            seeMoreBtn.addEventListener('click', () => {
                openCategoryView(container, categoryId, engineInfo);
            });
        }
        
        const sliderContainer = rowDiv.querySelector('.browse-engine-slider-container');
        if (sliderContainer) {
            sliderContainer.setAttribute('aria-label', `${engineInfo.name} Mods`);
        }
        
        const track = rowDiv.querySelector('.browse-engine-track');
        const prevBtn = rowDiv.querySelector('.browse-slider-prev');
        const nextBtn = rowDiv.querySelector('.browse-slider-next');
        
        enginesContainer.appendChild(clone);
        
        // After appending, rowDiv points to the live element in the DOM
        const liveRowDiv = enginesContainer.lastElementChild;
        rowElements.set(categoryId, { rowDiv: liveRowDiv, track, titleSpan, prevBtn, nextBtn, engineInfo });
        
        console.log(`[Browse] Added engine container: ${engineInfo.name}`);
    }
    
    const promises = engineKeys.map(async (key) => {
        const categoryId = parseInt(key, 10);
        try {
            console.log(`[Browse] Requesting mods for category ${categoryId}`);
            const result = await gameBananaApi.getGridMods('popular', 1, categoryId);
            const mods = Array.isArray(result) ? result : (result && result.mods ? result.mods : []);
            
            const element = rowElements.get(categoryId);
            if (!element) return;
            const { rowDiv, track, titleSpan, prevBtn, nextBtn, engineInfo } = element;
            
            if (titleSpan) {
                titleSpan.textContent = ` ${ENGINE_DETAILS[ENGINE_CATEGORY_IDS[key]].name} Mods`;
            }
            rowDiv.style.opacity = '1';
            
            if (mods && mods.length > 0) {
                console.log(`[Browse] Received ${mods.length} mods for ${categoryId}`);
                const modsToShow = mods.slice(0, 8);
                
                modsToShow.forEach(mod => {
                    const card = createModCard(mod, engineInfo);
                    track.appendChild(card);
                });
                
                let isAnimating = false;
                
                nextBtn.addEventListener('click', () => {
                    if (isAnimating || track.children.length < 2) return;
                    isAnimating = true;
                    const shiftAmount = track.firstElementChild.offsetWidth + 20; 
                    track.style.transition = 'transform 0.4s ease-in-out';
                    track.style.transform = `translateX(-${shiftAmount}px)`;
                    
                    setTimeout(() => {
                        track.style.transition = 'none';
                        track.appendChild(track.firstElementChild); 
                        track.style.transform = `translateX(0)`;
                        void track.offsetWidth;
                        isAnimating = false;
                    }, 400);
                });
                
                prevBtn.addEventListener('click', () => {
                    if (isAnimating || track.children.length < 2) return;
                    isAnimating = true;
                    const shiftAmount = track.firstElementChild.offsetWidth + 20;
                    
                    track.prepend(track.lastElementChild);
                    track.style.transition = 'none';
                    track.style.transform = `translateX(-${shiftAmount}px)`;
                    void track.offsetWidth; 
                    
                    track.style.transition = 'transform 0.4s ease-in-out';
                    track.style.transform = `translateX(0)`;
                    
                    setTimeout(() => {
                        isAnimating = false;
                    }, 400);
                });
                
            } else {
                console.warn(`[Browse] No results for ${categoryId}. Hiding row.`);
                rowDiv.remove();
            }
        } catch (error) {
            console.error(`[Browse] Error loading mods for category ${categoryId}:`, error);
            rowElements.get(categoryId)?.rowDiv.remove();
        }
    });
    
    await Promise.allSettled(promises);
}
