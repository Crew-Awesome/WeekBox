import { extractImageColor } from './extractImgColor.js';

/**
 * Extracts the dominant color from the loaded image and applies it as a dynamic background
 * by setting the --card-bg-rgb CSS variable and adding the discover-dynamic-card class.
 * 
 * @param {HTMLElement} card - The DOM element of the card to style.
 * @param {HTMLImageElement} img - The image element to extract the color from.
 */
export function applyDynamicColor(card, img) {
    if (!img || !card) return;

    const extractColor = () => {
        extractImageColor(img.src).then(colorData => {
            let { r, g, b } = colorData;
            
            // Calculamos la luminancia real percibida
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            
            // Si el color es muy claro, lo forzamos a oscurecerse drásticamente
            if (luminance > 90) {
                const factor = 90 / luminance; 
                r = Math.floor(r * factor);
                g = Math.floor(g * factor);
                b = Math.floor(b * factor);
            }

            // Tope máximo absoluto por canal para asegurar que NUNCA sea blanco/gris claro
            r = Math.min(r, 130);
            g = Math.min(g, 130);
            b = Math.min(b, 130);

            // Solo aplicamos el fondo
            card.style.setProperty('--card-bg-rgb', `${r}, ${g}, ${b}`);
            card.classList.add('discover-dynamic-card');
        }).catch(err => {
            console.warn('Could not extract color for card', err);
        });
    };

    if (img.complete) {
        extractColor();
    } else {
        img.onload = extractColor;
    }
}
