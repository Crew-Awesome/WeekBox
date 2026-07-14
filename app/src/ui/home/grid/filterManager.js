import { gridState } from './gridState.js';
import { gridRender } from './gridRender.js';

export const filterManager = {
    filterClickHandler: null,
    outsideClickHandler: null,
    filterContainer: null,

    setup() {
        this.remove();
        const filters = document.getElementById('grid-filters');
        if (!filters) return;
        
        this.filterContainer = filters;
        this.filterClickHandler = event => {
            const typeButton = event.target.closest('.filter-type');
            if (typeButton) {
                this.selectTypeFilter(typeButton);
                return;
            }
            if (event.target.closest('#engine-filter-trigger')) {
                this.toggleCategoryDropdown();
                return;
            }
            const option = event.target.closest('#engine-filter-options .custom-option');
            if (option) this.selectCategoryFilter(option);
        };
        
        this.outsideClickHandler = event => {
            const dropdown = document.getElementById('engine-filter-dropdown');
            if (dropdown && !dropdown.contains(event.target)) this.setCategoryDropdown(false);
        };
        
        filters.addEventListener('click', this.filterClickHandler);
        document.addEventListener('click', this.outsideClickHandler);
        this.syncCategoryFilter();
    },
    
    selectTypeFilter(button) {
        const filter = button.dataset.filter;
        if (!filter || filter === gridState.currentFilter) return;
        
        document.querySelectorAll('.pill-btn.filter-type').forEach(pill => {
            pill.classList.toggle('active', pill === button);
        });
        
        gridState.currentFilter = filter;
        gridRender.renderGrid(true);
    },
    
    selectCategoryFilter(option) {
        const value = option.dataset.categoryId;
        const categoryId = value ? Number(value) : null;
        if (categoryId === gridState.currentCategoryId) {
            this.setCategoryDropdown(false);
            return;
        }
        
        gridState.currentCategoryId = categoryId;
        this.syncCategoryFilter();
        this.setCategoryDropdown(false);
        gridRender.renderGrid(true);
    },
    
    syncCategoryFilter() {
        const dropdown = document.getElementById('engine-filter-dropdown');
        const selectedText = document.getElementById('engine-filter-selected');
        const selectedIcon = document.getElementById('engine-filter-icon');
        const options = [...document.querySelectorAll('#engine-filter-options .custom-option')];
        
        const selectedOption = options.find(option => {
            const value = option.dataset.categoryId;
            return (value ? Number(value) : null) === gridState.currentCategoryId;
        }) || options[0];
        
        if (!selectedOption) return;
        
        options.forEach(option => {
            const isSelected = option === selectedOption;
            option.classList.toggle('selected', isSelected);
            option.setAttribute('aria-selected', String(isSelected));
        });
        
        if (selectedText) selectedText.textContent = selectedOption.dataset.label;
        if (selectedIcon) {
            const icon = selectedOption.querySelector('.filter-engine-icon');
            selectedIcon.replaceChildren(...[...icon.childNodes].map(node => node.cloneNode(true)));
        }
        if (dropdown) dropdown.classList.remove('open');
    },
    
    toggleCategoryDropdown() {
        const dropdown = document.getElementById('engine-filter-dropdown');
        this.setCategoryDropdown(!dropdown?.classList.contains('open'));
    },
    
    setCategoryDropdown(isOpen) {
        const dropdown = document.getElementById('engine-filter-dropdown');
        const trigger = document.getElementById('engine-filter-trigger');
        dropdown?.classList.toggle('open', isOpen);
        trigger?.setAttribute('aria-expanded', String(isOpen));
    },
    
    remove() {
        this.filterContainer?.removeEventListener('click', this.filterClickHandler);
        if (this.outsideClickHandler) document.removeEventListener('click', this.outsideClickHandler);
        this.filterContainer = null;
        this.filterClickHandler = null;
        this.outsideClickHandler = null;
    }
};