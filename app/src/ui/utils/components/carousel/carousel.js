import { M3Carousel } from './carousel-core.js';

export function initCarousels(root = document) {
    const carousels = root.querySelectorAll('.m3-carousel');
    carousels.forEach(element => {
        // Prevent double initialization
        if (!element.m3CarouselAPI) {
            new M3Carousel(element);
        }
    });
}