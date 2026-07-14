import { FS } from '../../utils/filesystem.js';

export const downloadEngine = {
    async install(engineId, version, downloadUrl, onProgress) {
        if (!FS.isInitialized) await FS.init();
        
        const enginesBasePath = FS.enginesPath;
        const engineDir = `${enginesBasePath}/${engineId}/${version}`;
        const tempFilePath = `${enginesBasePath}/temp_${engineId}_${version}.zip`;

        const updateProgress = (status, progress) => {
            if (typeof onProgress === 'function') {
                onProgress({ status, progress });
            }
        };

        try {
            updateProgress('Preparing environment...', 0);
            await FS.api.ensureDir(enginesBasePath);
            await FS.api.ensureDir(`${enginesBasePath}/${engineId}`);
            await FS.api.ensureDir(engineDir);

            const os = window.NL_OS;
            
            updateProgress('Connecting...', 2);
            await this.downloadWithProgress(downloadUrl, tempFilePath, updateProgress);

            // Al inicio de la extracción la barra se asienta en el 98% 
            updateProgress('Preparing extraction...', 98);
            await this.extractWithProgress(tempFilePath, engineDir, os, updateProgress);

            updateProgress('Cleaning temporary files...', 99);
            await FS.api.remove(tempFilePath);

            updateProgress('Completed', 100);
            return true;

        } catch (error) {
            console.error(`Error installing engine ${engineId}:`, error);
            await FS.api.remove(tempFilePath);
            return false;
        }
    },

    async downloadWithProgress(url, outPath, updateProgress) {
        return new Promise(async (resolve, reject) => {
            try {
                let maxPercent = 0;
                const process = await Neutralino.os.spawnProcess(`curl -# -L "${url}" -o "${outPath}"`);

                const handler = (event) => {
                    if (event.detail.id === process.id) {
                        const action = event.detail.action;
                        
                        if (action === 'stdErr' || action === 'stdOut') {
                            const output = event.detail.data;
                            const matches = output.match(/(\d+\.?\d*)%/g);
                            
                            if (matches && matches.length > 0) {
                                const lastMatch = matches[matches.length - 1];
                                const percent = parseFloat(lastMatch.replace('%', ''));
                                
                                if (!isNaN(percent) && percent >= maxPercent) {
                                    maxPercent = percent;
                                    // La descarga pura escala del 2% al 98% del contenedor real
                                    const globalProgress = 2 + (percent * 0.96); 
                                    updateProgress(`Downloading...`, globalProgress);
                                }
                            }
                        } else if (action === 'exit') {
                            Neutralino.events.off('spawnedProcess', handler);
                            if (event.detail.data === 0) resolve();
                            else reject(new Error(`Download failed with exit code ${event.detail.data}`));
                        }
                    }
                };

                await Neutralino.events.on('spawnedProcess', handler);
            } catch (error) {
                reject(error);
            }
        });
    },

    async extractWithProgress(zipPath, destPath, os, updateProgress) {
        return new Promise(async (resolve, reject) => {
            let cmd = "";
            if (os === 'Windows') {
                cmd = `tar -xvf "${zipPath}" -C "${destPath}"`;
            } else {
                cmd = `unzip -o "${zipPath}" -d "${destPath}"`;
            }

            try {
                const process = await Neutralino.os.spawnProcess(cmd);

                const handler = (event) => {
                    if (event.detail.id === process.id) {
                        const action = event.detail.action;
                        
                        if (action === 'stdOut' || action === 'stdErr') {
                            const output = event.detail.data.trim();
                            if (output) {
                                const lines = output.split('\n');
                                const lastLine = lines[lines.length - 1].trim();
                                
                                let fileName = lastLine.replace(/^x\s+/, '').replace(/^inflating:\s+/, '').trim();
                                
                                const pathParts = fileName.split(/[/\\]/);
                                if (pathParts.length > 2) {
                                    fileName = `.../${pathParts.slice(-2).join('/')}`;
                                }

                                // El progreso se mantiene fijo en el 98%, solo se reporta el texto real
                                updateProgress(`Extracting: ${fileName}`, 98);
                            }
                        } else if (action === 'exit') {
                            Neutralino.events.off('spawnedProcess', handler);
                            if (event.detail.data === 0) resolve();
                            else reject(new Error(`Extraction failed with exit code ${event.detail.data}`));
                        }
                    }
                };
                
                await Neutralino.events.on('spawnedProcess', handler);
            } catch (err) {
                reject(err);
            }
        });
    }
};