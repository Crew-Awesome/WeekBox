import { getDataPath, getModsLibraryPath, getModsPath } from './paths.js';
import { ENGINE_CATEGORY_IDS } from '../../../core/config/engines.js';
import { removeDir } from './fs-utils.js';

/**
 * A Set of folder names currently being downloaded or modified.
 * The watcher will ignore these folders to prevent deleting them mid-download.
 */
export const lockedFolders = new Set();

/**
 * Gets the numeric category ID for a given engine string.
 * @param {string} engineString - e.g. "psych", "vslice"
 * @returns {number|null} The numeric ID or null if not found
 */
function getNumericCategoryId(engineString) {
    for (const [id, name] of Object.entries(ENGINE_CATEGORY_IDS)) {
        if (name === engineString) return parseInt(id, 10);
    }
    return null;
}

/**
 * Scans the root of the mod folder to determine its actual engine category.
 * @param {string} folderName 
 * @returns {Promise<number|null>} The numeric category ID, or null if unknown.
 */
async function detectLocalCategoryId(folderName) {
    try {
        const modsPath = await getModsPath();
        const installPath = window.NL_OS === 'Windows' 
            ? `${modsPath}\\${folderName}` 
            : `${modsPath}/${folderName}`;
            
        const files = await Neutralino.filesystem.readDirectory(installPath);
        
        let hasExe = false;
        let hasPackJson = false;
        let hasPolymodMeta = false;
        
        for (const file of files) {
            const name = file.entry.toLowerCase();
            
            if (file.type === 'FILE') {
                if (name.endsWith('.exe') || name.endsWith('.app') || name.endsWith('.appimage') || name.endsWith('.sh')) {
                    hasExe = true;
                }
                if (name === 'pack.json') {
                    hasPackJson = true;
                }
                if (name === '_polymod_meta.json') {
                    hasPolymodMeta = true;
                }
            }
            
            if (file.type === 'DIRECTORY' && name.endsWith('.app')) {
                hasExe = true;
            }
        }
        
        if (hasExe) return 3827; // Executable
        if (hasPolymodMeta) return 29202; // V-Slice / Base Game
        if (hasPackJson) return 28367; // Psych Engine
        
        return null;
    } catch (e) {
        console.warn(`[Mods Library] Could not detect local category for ${folderName}:`, e);
        return null;
    }
}

/**
 * Initializes the Mods Library JSON indexer.
 * Creates the data directory and the JSON file if they do not exist.
 * @returns {Promise<void>}
 */
export async function initModsLibrary() {
    try {
        const dataPath = await getDataPath();
        try {
            await Neutralino.filesystem.createDirectory(dataPath);
        } catch (e) {
            /** Directory likely already exists, ignore */
        }

        const libraryPath = await getModsLibraryPath();
        try {
            const stats = await Neutralino.filesystem.getStats(libraryPath);
            if (stats.isFile) {
                const content = await Neutralino.filesystem.readFile(libraryPath);
                console.log(`[Mods Library] Initialized successfully. Current index:`, JSON.parse(content));
            }
        } catch (e) {
            /** File does not exist, create it with empty template */
            console.log(`[Mods Library] Creating new index at ${libraryPath}`);
            const defaultData = { mods: [] };
            await Neutralino.filesystem.writeFile(libraryPath, JSON.stringify(defaultData, null, 2));
            console.log(`[Mods Library] Initialized successfully. Current index:`, defaultData);
        }
        
        // Sync index with physical file system
        await syncModsLibrary();
    } catch (err) {
        console.error(`[Mods Library] Failed to initialize indexer:`, err);
    }
}

/**
 * Synchronizes the JSON indexer with the physical file system.
 * Removes any mods from the JSON that no longer have a corresponding folder.
 * Extremely fast: reads the directory only once.
 * @returns {Promise<void>}
 */
export async function syncModsLibrary() {
    try {
        const libraryPath = await getModsLibraryPath();
        const data = await getModsLibrary();
        
        // Safety check: If reading failed (e.g. invalid JSON while user is editing), abort sync!
        if (!data) return;
        
        if (!data.mods) data.mods = [];

        const modsPath = await getModsPath();
        let existingFolders = [];
        try {
            const files = await Neutralino.filesystem.readDirectory(modsPath);
            existingFolders = files.filter(f => f.type === 'DIRECTORY' && f.entry !== '.' && f.entry !== '..').map(f => f.entry);
        } catch (e) {
            // If mods directory doesn't exist, we assume 0 folders exist
        }

        const originalCount = data.mods.length;
        
        // 1. Keep only mods whose physical folder still exists (if manually deleted from folder -> remove from JSON)
        data.mods = data.mods.filter(mod => existingFolders.includes(mod.folderName));
        
        const removedModsCount = originalCount - data.mods.length;
        
        // 2. Bidirectional sync: if a folder exists in /Mods but IS NOT in the JSON index, delete the folder!
        // ONLY if it is not currently locked (being downloaded/extracted).
        const jsonFolderNames = data.mods.map(m => m.folderName);
        let deletedFoldersCount = 0;
        
        for (const folder of existingFolders) {
            if (!jsonFolderNames.includes(folder) && !lockedFolders.has(folder)) {
                const folderPath = window.NL_OS === 'Windows' ? `${modsPath}\\${folder}` : `${modsPath}/${folder}`;
                await removeDir(folderPath);
                deletedFoldersCount++;
            }
        }
        
        if (removedModsCount > 0 || deletedFoldersCount > 0) {
            await Neutralino.filesystem.writeFile(libraryPath, JSON.stringify(data, null, 2));
            console.log(`[Mods Library] Synced index. Removed ${removedModsCount} missing mod(s) from JSON, and deleted ${deletedFoldersCount} orphaned physical folder(s).`);
            console.log(`[Mods Library] Current index state:`, data);
        }
    } catch (err) {
        console.error(`[Mods Library] Error syncing library:`, err);
    }
}

/**
 * Starts a lightweight background watcher that syncs the library every 3 seconds.
 * Extremely efficient, consumes almost 0 memory/CPU.
 */
export function startLibraryWatcher() {
    setInterval(async () => {
        await syncModsLibrary();
    }, 3000);
}

/**
 * Reads the current mods library JSON data.
 * @returns {Promise<Object>} The parsed JSON data containing the mods array.
 */
export async function getModsLibrary() {
    try {
        const libraryPath = await getModsLibraryPath();
        const content = await Neutralino.filesystem.readFile(libraryPath);
        return JSON.parse(content);
    } catch (err) {
        console.error(`[Mods Library] Error reading library:`, err);
        return null; // Return null instead of empty template to prevent accidental folder deletion
    }
}

/**
 * Checks if a specific mod is already installed based on its ID.
 * @param {number|string} modId - The GameBanana mod ID.
 * @returns {Promise<boolean>} True if the mod is installed, false otherwise.
 */
export async function isModInstalled(modId) {
    const data = await getModsLibrary();
    // Convert both to strings for safe comparison
    return data.mods.some(m => String(m.id) === String(modId));
}

/**
 * Adds a newly installed mod to the JSON indexer.
 * @param {number|string} modId - The GameBanana mod ID.
 * @param {string} name - The human-readable name of the mod.
 * @param {string} folderName - The physical folder name in the file system.
 * @param {string} engineString - The engine string ID (e.g. psych, vslice).
 * @param {string} version - The installed version of the mod.
 * @returns {Promise<void>}
 */
export async function addMod(modId, name, folderName, engineString, version = "1.0.0") {
    try {
        const libraryPath = await getModsLibraryPath();
        const data = await getModsLibrary();
        
        // Remove if it already exists to overwrite/update
        data.mods = data.mods.filter(m => String(m.id) !== String(modId));
        
        const numericCategoryId = getNumericCategoryId(engineString);
        const localCategoryId = await detectLocalCategoryId(folderName);
        
        const newMod = {
            id: modId,
            name: name,
            folderName: folderName,
            categoryId: numericCategoryId,
            categoryLocalId: localCategoryId,
            version: version,
            installedAt: new Date().toISOString(),
            enabled: true
        };
        
        data.mods.push(newMod);
        
        await Neutralino.filesystem.writeFile(libraryPath, JSON.stringify(data, null, 2));
        console.log(`[Mods Library] Mod saved successfully:`, newMod);
    } catch (err) {
        console.error(`[Mods Library] Failed to add mod to index:`, err);
    }
}
