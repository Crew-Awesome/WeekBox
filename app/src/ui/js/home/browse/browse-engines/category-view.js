import { gameBananaApi } from '../../../../../core/config/api/gamebanana.js';
import { createModCard } from './mod-card.js';

/**
 * Initializes and displays the Category View for a specific engine, enabling infinite scroll.
 * @param {HTMLElement} container - The main container holding the browse view.
 * @param {number} categoryId - The ID of the category/engine to load.
 * @param {Object} engineInfo - Information about the engine (name, icon).
 * @param {boolean} [fromHistory=false] - Whether this view is opened via history navigation.
 */
export async function openCategoryView(container, categoryId, engineInfo, fromHistory = false) {
    const hubCarousel = container.querySelector('.m3-carousel');
    const hubControls = container.querySelector('.browse-carousel-controls');
    const hubEngines = container.querySelector('#browse-engines-container');
    const categoryView = container.querySelector('#browse-category-view');
    
    if (!categoryView) return;
    
    if (hubCarousel) hubCarousel.style.display = 'none';
    if (hubControls) hubControls.style.display = 'none';
    if (hubEngines) hubEngines.style.display = 'none';
    
    if (container.scrollTop !== undefined) {
        container.scrollTop = 0;
    }

    if (!fromHistory) {
        window.history.pushState({ page: 'browse-category', categoryId, engineInfo }, '', '#browse-' + engineInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }

    categoryView.style.display = 'block';
    categoryView.textContent = '';
    
    // Retrieve and clone header template
    const template = document.getElementById('tmpl-category-header');
    if (!template) {
        console.error('Template #tmpl-category-header not found in the DOM.');
        return;
    }
    const clone = template.content.cloneNode(true);
    
    const titleWrap = clone.querySelector('.category-title-wrap');
    if (titleWrap && engineInfo.icon) {
        const iconImg = document.createElement('img');
        iconImg.src = `assets/engine-icons/${engineInfo.icon}`;
        iconImg.alt = 'Icon';
        iconImg.style.width = '28px';
        iconImg.style.height = '28px';
        titleWrap.insertBefore(iconImg, titleWrap.firstChild);
    }
    
    const titleEl = clone.querySelector('.category-title');
    if (titleEl) {
        titleEl.textContent = `${engineInfo.name} Mods`;
    }
    
    const fabBtn = clone.querySelector('.back-to-hub-fab');
    if (fabBtn) {
        fabBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            }
        });
        fabBtn.onmouseenter = () => fabBtn.style.transform = 'scale(1.05)';
        fabBtn.onmouseleave = () => fabBtn.style.transform = 'scale(1)';
    }
    
    const grid = document.createElement('div');
    grid.className = 'browse-category-grid';
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'category-loading';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.opacity = '0.7';
    loadingIndicator.textContent = 'Loading mods...';
    
    categoryView.appendChild(clone);
    categoryView.appendChild(grid);
    categoryView.appendChild(loadingIndicator);
    
    let currentPage = 1;
    let targetPage = 3;
    let isFetching = false;
    let hasMore = true;
    let observer = null;
    
    /**
     * Loops through pages up to the target page to load mods continuously.
     */
    const loadPagesLoop = async () => {
        if (isFetching || !hasMore) return;
        isFetching = true;
        
        while (currentPage <= targetPage && hasMore) {
            loadingIndicator.style.visibility = 'visible';
            try {
                const result = await gameBananaApi.getGridMods('popular', currentPage, categoryId);
                const mods = Array.isArray(result) ? result : (result && result.mods ? result.mods : []);
                
                if (!mods || mods.length === 0 || (result && result.exhausted) || mods.length < 10) {
                    hasMore = false;
                    loadingIndicator.style.display = 'none';
                    if (currentPage === 1 && (!mods || mods.length === 0)) {
                        const emptyMsg = document.createElement('p');
                        emptyMsg.style.gridColumn = '1 / -1';
                        emptyMsg.style.textAlign = 'center';
                        emptyMsg.style.opacity = '0.6';
                        emptyMsg.textContent = 'No mods found in this category.';
                        grid.appendChild(emptyMsg);
                    }
                }
                
                if (mods && mods.length > 0) {
                    mods.forEach(mod => {
                        const card = createModCard(mod, engineInfo);
                        grid.appendChild(card);
                    });
                }
                
                currentPage++;
                if (hasMore) loadingIndicator.style.visibility = 'hidden';
            } catch (e) {
                console.error('[Browse] Error loading category page:', e);
                loadingIndicator.textContent = 'Failed to load mods.';
                loadingIndicator.style.visibility = 'visible';
                hasMore = false;
                break;
            }
        }
        isFetching = false;
    };
    
    await loadPagesLoop();
    
    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
            targetPage = Math.max(targetPage, currentPage + 2);
            if (!isFetching) loadPagesLoop();
        }
    }, { rootMargin: '1000px' }); 
    
    observer.observe(loadingIndicator);
}
