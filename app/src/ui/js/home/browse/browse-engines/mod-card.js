import { extractImageColor } from '../../../../../ui/utils/extractImgColor.js';
import { Md3Chip } from '../../../../../ui/utils/components/chip/chip.js';

/**
 * Global observer for lazy color extraction to optimize performance.
 * Extracts the primary color from the loaded image and applies it to the card's CSS variables.
 */
const lazyColorObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            observer.unobserve(card);
            const imageSrc = card.dataset.imageSrc;
            if (imageSrc) {
                extractImageColor(imageSrc).then(color => {
                    card.style.setProperty('--card-hover-bg', color.hex);
                }).catch(err => console.warn('Could not extract color from', imageSrc));
            }
        }
    });
}, { rootMargin: '300px' });

/**
 * Helper function to format large numbers (e.g., 1500 to 1.5k).
 * @param {number} num - The number to format.
 * @returns {string|number} The formatted number.
 */
const formatNumber = (num) => num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;

/**
 * Creates a Mod Card DOM element by cloning the HTML template.
 * @param {Object} mod - The mod data object.
 * @param {Object} engineInfo - Information about the game engine (optional).
 * @returns {HTMLElement} The constructed mod card element.
 */
export function createModCard(mod, engineInfo) {
    const template = document.getElementById('tmpl-mod-card');
    if (!template) {
        console.error('Template #tmpl-mod-card not found in the DOM.');
        return document.createElement('div');
    }

    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.browse-m3-card');
    
    const imageSrc = mod.image || 'https://images.gamebanana.com/img/ss/mods/default.jpg';
    card.dataset.imageSrc = imageSrc;
    lazyColorObserver.observe(card);
    
    const imgElement = card.querySelector('.mod-cover');
    if (imgElement) {
        imgElement.src = imageSrc;
        imgElement.alt = mod.title || 'Mod Cover';
    }
    
    const chipContainerWrapper = card.querySelector('.chip-container');
    if (chipContainerWrapper && engineInfo && engineInfo.icon) {
        chipContainerWrapper.dataset.text = engineInfo.name;
        chipContainerWrapper.dataset.icon = `assets/engine-icons/${engineInfo.icon}`;
        chipContainerWrapper.dataset.variant = 'engine';
        
        new Md3Chip(chipContainerWrapper);
    }
    
    const titleElement = card.querySelector('.mod-title');
    if (titleElement) {
        titleElement.textContent = mod.title || 'Unknown Mod';
    }
    
    const authorElement = card.querySelector('.mod-author');
    if (authorElement) {
        authorElement.textContent = mod.author || 'Unknown Creator';
    }
    
    const viewsElement = card.querySelector('.stat-views');
    if (viewsElement) {
        viewsElement.textContent = formatNumber(mod.views);
    }
    
    const likesElement = card.querySelector('.stat-likes');
    if (likesElement) {
        likesElement.textContent = formatNumber(mod.likes);
    }
    
    const timeElement = card.querySelector('.stat-time');
    if (timeElement) {
        timeElement.textContent = mod.timeAgo;
    }
    
    card.addEventListener('click', () => {
        const event = new CustomEvent('weekbox-open-mod', { 
            detail: { id: mod.id, url: mod.url },
            bubbles: true
        });
        card.dispatchEvent(event);
    });
    
    return card;
}
