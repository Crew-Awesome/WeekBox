export function getTargetLink(versionData) {
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
}

export function extractVersionFallback(url) {
    if (!url) return "Unknown";
    const githubMatch = url.match(/\/download\/(v?([^\/]+))\//);
    if (githubMatch && githubMatch[2]) return githubMatch[2];
    
    const genericMatch = url.match(/(?:v|-)?(\d+\.\d+(?:\.\d+)?(?:[a-zA-Z0-9-]*))/i);
    if (genericMatch && genericMatch[1]) return genericMatch[1];
    
    return "Unknown";
}