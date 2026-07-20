/**
 * Shared File System Utilities
 */

/**
 * Removes a directory safely across OS using native shell commands.
 * Includes a polling loop to fix Windows' pending deletion race condition.
 * @param {string} path 
 */
export async function removeDir(path) {
    try {
        if (window.NL_OS === 'Windows') {
            await Neutralino.os.execCommand(`powershell -NoProfile -Command "Remove-Item -LiteralPath '${path}' -Recurse -Force -ErrorAction Ignore"`);
        } else {
            await Neutralino.os.execCommand(`rm -rf "${path}"`);
        }
        
        /** Fix Windows pending deletion race condition */
        for (let i = 0; i < 20; i++) {
            try {
                await Neutralino.filesystem.getStats(path);
                await new Promise(resolve => setTimeout(resolve, 100)); // Still exists, wait
            } catch (e) {
                break; // Gone!
            }
        }
    } catch (e) {
        console.warn("Could not remove dir:", e);
    }
}
