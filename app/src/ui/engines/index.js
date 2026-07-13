import { FS } from '../../utils/filesystem.js';
import { appEvents } from '../../core/events.js';
import { getSelectedEngine } from '../../core/state.js';
import '../../utils/downloadToast.js';
import { fetchAndRenderReleaseNotes } from './releaseNotes.js';

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
        
        this.fsListener = (e) => this.handleProgress(e.detail);
        FS.addEventListener('dl:update', this.fsListener);
        this.setupCustomDropdown(engine);
        this.setupLaunchButton();
        this.setupDownloadActions();
        
        if (FS.activeDownload) this.handleProgress(FS.activeDownload);
    },

    destroy() {
        if (this.outsideClickHandler) document.removeEventListener('click', this.outsideClickHandler);
        if (this.fsListener) FS.removeEventListener('dl:update', this.fsListener);
    },

    handleProgress(dlData) {
        const launchBtn = document.getElementById('launch-engine-btn');
        const dlUI = document.getElementById('download-ui');
        const dlFill = document.getElementById('dl-fill');
        const dlText = document.getElementById('dl-text');
        const dlActions = document.getElementById('dl-actions');
        
        if (!dlData || dlData.state === 'finished' || dlData.state === 'cancelled' || dlData.state === 'error') {
            dlUI.style.display = 'none';
            this.updateButtonState();
            return;
        }
        if (dlData.engineId !== this.currentEngine.id) {
            dlUI.style.display = 'none';
            launchBtn.textContent = `Downloading ${dlData.engineName}...`;
            launchBtn.disabled = true;
            return;
        }
        launchBtn.textContent = "Downloading";
        launchBtn.disabled = true;
        dlUI.style.display = 'flex';
        
        dlText.textContent = dlData.text;
        dlFill.style.width = `${dlData.percent || 0}%`;
        if (dlData.state === 'extracting') {
            dlActions.style.display = 'none';
        } else {
            dlActions.style.display = 'flex';
        }
    },

    async updateButtonState() {
        if (FS.activeDownload) {
            this.handleProgress(FS.activeDownload);
            return;
        }
        const launchBtn = document.getElementById('launch-engine-btn');
        const dlUI = document.getElementById('download-ui');
        if (!launchBtn) return;
        
        launchBtn.textContent = "Checking...";
        launchBtn.disabled = true;
        dlUI.style.display = 'none';
        
        const isInstalled = await FS.isEngineInstalled(this.currentEngine.id, this.currentVersion);
        
        launchBtn.textContent = isInstalled ? "Play" : "Download";
        launchBtn.disabled = false;
    },

    setupDownloadActions() {
        const btnPause = document.getElementById('dl-pause');
        const btnCancel = document.getElementById('dl-cancel');
        btnPause.onclick = () => {
            const isPaused = FS.togglePause();
            btnPause.textContent = isPaused ? "Resume" : "Pause";
        };
        btnCancel.onclick = () => FS.cancelDownload();
    },
    
    getTargetLink(versionData) {
        const os = window.NL_OS;
        const arch = window.NL_ARCH; 
        
        if (os === 'Windows') {
            if (arch === 'x64') {
                return versionData.win64 || versionData.win || null;
            } else {
                return versionData.win32 || versionData.win || null;
            }
        } else if (os === 'Linux') {
            return versionData.lin || null;
        } else if (os === 'Darwin') {
            return versionData.mac || null;
        }
        return null;
    },

    setupLaunchButton() {
        const launchBtn = document.getElementById('launch-engine-btn');
        if (!launchBtn) return;
        launchBtn.onclick = async () => {
            const selectedVersion = this.currentVersion;
            const engine = this.currentEngine;
            
            const isInstalled = await FS.isEngineInstalled(engine.id, selectedVersion);
            
            if (isInstalled) {
                launchBtn.textContent = "Running";
                launchBtn.disabled = true;
                
                try {
                    await FS.runEngine(engine.id, selectedVersion, (state) => {
                        if (state === 'closed') {
                            launchBtn.textContent = "Play";
                            launchBtn.disabled = false;
                        }
                    });
                } catch (e) {
                    launchBtn.textContent = "Play";
                    launchBtn.disabled = false;
                }
                return;
            }
            
            const versionData = engine.versions.find(v => v.version === selectedVersion);
            if (!versionData) return;
            
            const targetLink = this.getTargetLink(versionData);
            
            if (!targetLink) return alert("OS or architecture not supported.");
            
            document.getElementById('dl-pause').textContent = "Pause";
            await FS.installEngine(engine.id, engine.meta.name, selectedVersion, targetLink);
        };
    },

    extractVersionFallback(url) {
        if (!url) return "Unknown";
        const githubMatch = url.match(/\/download\/(v?([^\/]+))\//);
        if (githubMatch && githubMatch[2]) return githubMatch[2];
        
        const genericMatch = url.match(/(?:v|-)?(\d+\.\d+(?:\.\d+)?(?:[a-zA-Z0-9-]*))/i);
        if (genericMatch && genericMatch[1]) return genericMatch[1];
        
        return "Unknown";
    },

    setupCustomDropdown(engine) {
        const dropdown = document.getElementById('engine-version-dropdown');
        let trigger = document.getElementById('engine-version-trigger');
        const optionsContainer = document.getElementById('engine-version-options');
        const badge = document.getElementById('engine-display-version');
        
        const newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);
        trigger = newTrigger; 
        
        const selectedText = document.getElementById('engine-version-selected');
        optionsContainer.innerHTML = '';
        
        if (engine.versions.length === 0) {
            selectedText.textContent = 'Unknown';
            badge.textContent = `Version: Unknown`;
            return;
        }
        
        engine.versions.forEach((v, index) => {
            if (!v.version || v.version === "Unknown") {
                const sampleLink = v.win64 || v.win32 || v.win || v.lin || v.mac || Object.values(v).find(val => typeof val === 'string' && val.startsWith('http')) || "";
                v.version = this.extractVersionFallback(sampleLink);
            }

            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-option';
            if (index === 0) optionDiv.classList.add('selected'); 
            optionDiv.textContent = v.version;
            
            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentVersion = v.version;
                selectedText.textContent = v.version;
                badge.textContent = `Version: ${v.version}`;
                document.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                optionDiv.classList.add('selected');
                dropdown.classList.remove('open');
                
                fetchAndRenderReleaseNotes(v, this.getTargetLink(v));
                this.updateButtonState(); 
            });
            optionsContainer.appendChild(optionDiv);
        });
        
        this.currentVersion = engine.versions[0].version;
        selectedText.textContent = this.currentVersion;
        badge.textContent = `Version: ${this.currentVersion}`;
        
        fetchAndRenderReleaseNotes(engine.versions[0], this.getTargetLink(engine.versions[0]));
        this.updateButtonState(); 
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        this.outsideClickHandler = (e) => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
        };
        document.addEventListener('click', this.outsideClickHandler);
    }
};

export function registerEnginesView() {
    appEvents.addEventListener('view:loaded', (event) => {
        if (event.detail === 'engines') enginesView.init();
        else enginesView.destroy();
    });
}
