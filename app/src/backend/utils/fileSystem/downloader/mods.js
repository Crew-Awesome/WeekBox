/**
 * Mod Downloader and Extractor
 * Uses native OS tools (curl, powershell/unzip) to avoid Node/JS memory leaks with large binaries.
 */
import { getModTempPath, getModInstallPath, getTempPath, getModsPath } from '../paths.js';
import { addMod, lockedFolders } from '../mods-library.js';
import { removeDir } from '../fs-utils.js';

function quote(str) {
    return `"${str}"`;
}

function log(msg) {
    /** HH:MM:SS.mmm */
    const time = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[${time}] [Downloader] ${msg}`);
}

/**
 * Executes a command asynchronously using spawnProcess to prevent blocking the Neutralino backend.
 * This enables true parallel/simultaneous downloads.
 */
function execAsync(command) {
    return new Promise(async (resolve, reject) => {
        try {
            const processInfo = await Neutralino.os.spawnProcess(command);
            
            let stdout = '';
            let stderr = '';

            const onStdOut = (evt) => {
                if (evt.detail.id === processInfo.id) stdout += evt.detail.data;
            };

            const onStdErr = (evt) => {
                if (evt.detail.id === processInfo.id) stderr += evt.detail.data;
            };
            
            const onSpawned = (evt) => {
                if (evt.detail.id === processInfo.id) {
                    if (evt.detail.action === 'exit') {
                        Neutralino.events.off('spawnedProcess', onSpawned);
                        Neutralino.events.off('spawnedProcessStdOut', onStdOut);
                        Neutralino.events.off('spawnedProcessStdErr', onStdErr);
                        resolve({
                            exitCode: evt.detail.data,
                            stdErr: stderr || (evt.detail.data !== 0 ? 'Command failed (spawnProcess)' : '')
                        });
                    }
                }
            };
            
            Neutralino.events.on('spawnedProcessStdOut', onStdOut);
            Neutralino.events.on('spawnedProcessStdErr', onStdErr);
            Neutralino.events.on('spawnedProcess', onSpawned);
        } catch (e) {
            resolve({ exitCode: 1, stdErr: e.message });
        }
    });
}

async function ensureDir(path) {
    try {
        await Neutralino.filesystem.createDirectory(path);
    } catch (e) {
        /** Ignore if exists */
    }
}

/**
 * Normalizes the extracted mod structure.
 * Fixes the issue where a ZIP file contains a single root folder containing the actual mod.
 * @param {string} installPath - The path where the mod was extracted
 */
async function normalizeExtractedMod(installPath) {
    /** Loop up to 10 times to handle deeply nested folders recursively */
    for (let i = 0; i < 10; i++) {
        try {
            const files = await Neutralino.filesystem.readDirectory(installPath);
            
            /** Filter out system or garbage files that could falsely trigger a multiple files condition */
            const ignoreList = ['.', '..', '__macosx', '.ds_store', 'desktop.ini', 'thumbs.db'];
            const realFiles = files.filter(f => !ignoreList.includes(f.entry.toLowerCase()));
            
            /** If there is exactly one item and it is a directory, we need to extract its contents up one level */
            if (realFiles.length === 1 && realFiles[0].type === 'DIRECTORY') {
                const nestedDirName = realFiles[0].entry;
                const nestedDirPath = window.NL_OS === 'Windows' 
                    ? `${installPath}\\${nestedDirName}` 
                    : `${installPath}/${nestedDirName}`;
                    
                console.log(`[Downloader] Nested folder detected: "${nestedDirName}". Normalizing...`);
                
                if (window.NL_OS === 'Windows') {
                    /** 
                     * Use LiteralPath and -Force to ensure hidden files are moved too, avoiding PowerShell errors.
                     * Fix: Use single quotes for paths to prevent nesting double quotes inside the -Command string.
                     */
                    const moveCmd = `powershell -NoProfile -NonInteractive -Command "Get-ChildItem -LiteralPath '${nestedDirPath}' -Force | Move-Item -Destination '${installPath}' -Force"`;
                    await execAsync(moveCmd);
                    
                    /** Use -Recurse to ensure the directory is deleted even if some lock or hidden file remained */
                    const rmCmd = `powershell -NoProfile -NonInteractive -Command "Remove-Item -LiteralPath '${nestedDirPath}' -Recurse -Force"`;
                    await execAsync(rmCmd);
                } else {
                    /** Use bash with dotglob to ensure hidden files are moved too */
                    const moveCmd = `bash -c "shopt -s dotglob; mv ${quote(nestedDirPath)}/* ${quote(installPath)}/; rmdir ${quote(nestedDirPath)}"`;
                    await execAsync(moveCmd);
                }
            } else {
                /** Structure is fine (contains either multiple real files or folders) */
                console.log(`[Downloader] Normalization complete. Root contains ${realFiles.length} item(s).`);
                break; 
            }
        } catch (e) {
            console.warn(`[Downloader] Error during structure normalization:`, e);
            break;
        }
    }
}

/**
 * Downloads and installs an FNF mod
 * @param {number|string} modId - GameBanana mod ID
 * @param {string} modName - Name of the mod
 * @param {string} categoryId - Engine or category ID
 * @param {string} downloadUrl - GameBanana URL or direct download link
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
export async function installMod(modId, modName, categoryId, downloadUrl) {
    const tempPath = await getModTempPath(modName);
    const installPath = await getModInstallPath(modName);
    const folderName = installPath.split(/[\\/]/).pop();
    
    // Lock the folder so the background watcher doesn't delete it mid-download
    lockedFolders.add(folderName);
    
    try {
        log(`Initiating installation for: ${modName}`);
        
        /** 1. Prepare directories */
        await ensureDir(await getTempPath());
        await ensureDir(await getModsPath());
        await ensureDir(tempPath);
        
        /** 2. Execute download and extraction attempts (Max 3) */
        let lastError = null;
        let extracted = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                log(`Attempt ${attempt}/3 starting...`);

                await removeDir(tempPath);
                await ensureDir(tempPath);

                // Normalize Google Drive URLs before downloading
                if (downloadUrl.includes('drive.google.com') || downloadUrl.includes('drive.usercontent.google.com')) {
                    const driveIdMatch = downloadUrl.match(/[-\w]{25,}/);
                    if (driveIdMatch && driveIdMatch[0]) {
                        downloadUrl = `https://drive.google.com/uc?export=download&id=${driveIdMatch[0]}`;
                    }
                }

                let cookieArgs = downloadUrl.includes('drive.google.com') ? '-c cookies.txt' : '';

                let dlCmd = '';
                if (window.NL_OS === 'Windows') {
                    const safeUrl = downloadUrl.replace(/'/g, "''");
                    const safePath = tempPath.replace(/'/g, "''");
                    dlCmd = `powershell -NoProfile -NonInteractive -Command "cd -LiteralPath '${safePath}'; curl.exe -sSL --compressed ${cookieArgs} -J -O '${safeUrl}'"`;
                } else {
                    dlCmd = `cd ${quote(tempPath)} && curl -sSL --compressed ${cookieArgs} -J -O ${quote(downloadUrl)}`;
                }

                log(`Downloading via curl...`);
                const dlResult = await execAsync(dlCmd);
                if (dlResult.exitCode !== 0) {
                    throw new Error(`cURL Download failed: ${dlResult.stdErr}`);
                }

                const files = await Neutralino.filesystem.readDirectory(tempPath);
                let downloadedFile = files.find(f => f.type === 'FILE' && f.entry !== '.' && f.entry !== '..' && f.entry !== 'cookies.txt');

                if (!downloadedFile) {
                    throw new Error('Download succeeded, but no file was written to disk.');
                }

                let fileName = downloadedFile.entry;
                let filePath = window.NL_OS === 'Windows'
                ? `${tempPath}\\${fileName}`
                : `${tempPath}/${fileName}`;

                // --- GOOGLE DRIVE BYPASS ---
                if (downloadUrl.includes('drive.google.com') || downloadUrl.includes('drive.usercontent.google.com')) {
                    const stats = await Neutralino.filesystem.getStats(filePath).catch(() => ({ size: 0 }));
                    if (stats.size > 0 && stats.size < 500000) { // Posible HTML de advertencia
                        const content = await Neutralino.filesystem.readFile(filePath).catch(() => '');
                        if (content.includes('uc-download-link') || content.includes('confirm=')) {
                            const match = content.match(/confirm=([0-9A-Za-z_-]+)/);
                            if (match && match[1]) {
                                log(`Google Drive virus warning detected. Bypassing with token: ${match[1]}`);
                                await Neutralino.filesystem.removeFile(filePath).catch(() => {});
                                
                                const finalUrl = downloadUrl.includes('?') ? `${downloadUrl}&confirm=${match[1]}` : `${downloadUrl}?confirm=${match[1]}`;
                                
                                let retryCmd = '';
                                if (window.NL_OS === 'Windows') {
                                    const safeUrlRetry = finalUrl.replace(/'/g, "''");
                                    const safePathRetry = tempPath.replace(/'/g, "''");
                                    retryCmd = `powershell -NoProfile -NonInteractive -Command "cd -LiteralPath '${safePathRetry}'; curl.exe -sSL --compressed -b cookies.txt -J -O '${safeUrlRetry}'"`;
                                } else {
                                    retryCmd = `cd ${quote(tempPath)} && curl -sSL --compressed -b cookies.txt -J -O ${quote(finalUrl)}`;
                                }
                                
                                log(`Downloading real file from Google Drive...`);
                                const retryResult = await execAsync(retryCmd);
                                if (retryResult.exitCode !== 0) throw new Error(`Google Drive bypass download failed: ${retryResult.stdErr}`);
                                
                                const newFiles = await Neutralino.filesystem.readDirectory(tempPath);
                                downloadedFile = newFiles.find(f => f.type === 'FILE' && f.entry !== '.' && f.entry !== '..' && f.entry !== 'cookies.txt');
                                if (!downloadedFile) throw new Error('Bypass succeeded, but no file was written.');
                                
                                fileName = downloadedFile.entry;
                                filePath = window.NL_OS === 'Windows' ? `${tempPath}\\${fileName}` : `${tempPath}/${fileName}`;
                            }
                        }
                    }
                }
                // ---------------------------

                log(`File downloaded successfully: ${fileName}`);

                let ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
                if (!ext || !isNaN(Number(ext))) {
                    log(`File has no valid extension (detected '.${ext}'). Assuming it is a .zip archive.`);
                    ext = 'zip';
                } else {
                    log(`Detected format: .${ext}`);
                }

                await removeDir(installPath);
                await ensureDir(installPath);

                if (ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar') {
                    log(`Extracting ${ext.toUpperCase()} archive...`);

                    let exCmd = '';

                    if (window.NL_OS === 'Windows') {
                        exCmd = `cmd.exe /c "tar -xf ${quote(filePath)} -C ${quote(installPath)}"`;
                    } else {
                        exCmd = `unzip -o ${quote(filePath)} -d ${quote(installPath)}`;
                    }

                    const exResult = await execAsync(exCmd);
                    if (exResult.exitCode !== 0) {
                        throw new Error(`Extraction failed: ${exResult.stdErr}`);
                    }
                    } else {
                        throw new Error(`Type not supported: .${ext}`);
                    }

                    log(`Extraction complete! Normalizing directory structure...`);
                    await normalizeExtractedMod(installPath);
                    
                    await addMod(modId, modName, folderName, categoryId);

                    extracted = true;
                    log(`Attempt ${attempt}/3 succeeded.`);
                    break;
                } catch (err) {
                    lastError = err;
                    log(`Attempt ${attempt}/3 failed: ${err.message}`);

                    await removeDir(tempPath).catch(() => {});
                    await removeDir(installPath).catch(() => {});

                if (attempt === 3) {
                    throw lastError;
                }
            }
        }

        if (!extracted) {
            throw lastError || new Error('Unknown error during mod installation.');
        }

        log(`Mod available at: ${installPath}`);
        await removeDir(tempPath);
        return { success: true, path: installPath };
    } catch (error) {
        log(`Mod installation failed: ${error}`);
        /** Clean up broken temp folder */
        await removeDir(tempPath).catch(() => {});
        return { success: false, error: error.message };
    } finally {
        lockedFolders.delete(folderName);
    }
}