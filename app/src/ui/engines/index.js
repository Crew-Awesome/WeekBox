import { appEvents } from '../../core/events.js';
import { getSelectedEngine } from '../../core/state.js';
import { engineDropdown } from './dropdown.js';

export const enginesView = {
    init() {
        const engine = getSelectedEngine();
        if (!engine) return;
        
        this.currentEngine = engine;
        document.getElementById('engine-display-title').textContent = engine.meta.name;
        
        const bottomIcon = document.getElementById('engine-bottom-icon');
        if (engine.meta.icon) {
            bottomIcon.src = `assets/icons/${engine.meta.icon}`;
            bottomIcon.style.display = 'block';
        } else {
            bottomIcon.style.display = 'none';
        }
        
        // Delegamos la lógica del dropdown y reaccionamos al cambio de versión
        engineDropdown.setup(engine, (version) => {
            this.currentVersion = version;
            this.updateButtonState();
        });
    },

    destroy() {
        engineDropdown.destroy();
    },

    updateButtonState() {
        const launchBtn = document.getElementById('launch-engine-btn');
        const dlUI = document.getElementById('download-ui');
        if (!launchBtn) return;
        
        launchBtn.textContent = "Unavailable";
        launchBtn.disabled = true;
        if (dlUI) dlUI.style.display = 'none';
    }
};

export function registerEnginesView() {
    appEvents.addEventListener('view:loaded', (event) => {
        if (event.detail === 'engines') enginesView.init();
        else enginesView.destroy();
    });
}