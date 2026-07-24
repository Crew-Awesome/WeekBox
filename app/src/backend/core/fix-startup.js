const fs = require('fs');
const path = require('path');

const coreDir = path.resolve('c:/Users/leive/Proyectos/Weekbox/app/src/backend/core');
const content = fs.readFileSync(path.join(coreDir, 'index.js'), 'utf8');

const blocks = content.split(/\/\/ (app\/src\/backend\/core\/[a-zA-Z0-9_\/.-]+)/).slice(1);
const rawModules = {};
for (let i = 0; i < blocks.length; i += 2) {
    if (!rawModules[blocks[i]]) {
        rawModules[blocks[i]] = blocks[i+1];
    }
}

const modulesInfo = {
    'app/src/backend/core/updates/releaseAssets.js': {
        newPath: 'updates/release-assets.util.js',
        exports: ['getPlatformPackage', 'getReleaseAsset', 'getResourcesAsset', 'getWindowsPackage'],
        imports: []
    },
    'app/src/backend/core/updates/versioning.js': {
        newPath: 'updates/versioning.util.js',
        exports: ['normalizeVersion', 'compareVersions'],
        imports: []
    },
    'app/src/backend/core/appUpdater.js': {
        newPath: 'updates/app-updater.service.js',
        exports: ['appUpdater'],
        imports: [
            { vars: ['getPlatformPackage', 'getReleaseAsset', 'getResourcesAsset', 'getWindowsPackage'], from: './release-assets.util.js' },
            { vars: ['normalizeVersion', 'compareVersions'], from: './versioning.util.js' }
        ]
    },
    'app/src/backend/core/events.js': {
        newPath: 'routing/events.service.js',
        exports: ['emitViewChange', 'appEvents'],
        imports: []
    },
    'app/src/backend/core/router.js': {
        newPath: 'routing/router.service.js',
        exports: ['router'],
        imports: [
            { vars: ['emitViewChange'], from: './events.service.js' }
        ]
    },
    'app/src/backend/core/deepLinks.js': {
        newPath: 'routing/deep-links.service.js',
        exports: ['parseWeekboxLink', 'openWeekboxLink', 'openLaunchDeepLink'],
        imports: [
            { vars: ['router'], from: './router.service.js' },
            { vars: ['gameBananaApi'], from: '../../providers/gamebanana/gamebanana.provider.js' } 
        ]
    },
    'app/src/backend/core/networkStatus.js': {
        newPath: 'system/network-status.service.js',
        exports: ['networkStatus'],
        imports: []
    },
    'app/src/backend/core/productionShortcuts.js': {
        newPath: 'system/production-shortcuts.util.js',
        exports: ['disableProductionRefreshShortcuts', 'isDevelopmentRun'],
        imports: []
    },
    'app/src/backend/core/storagePatch.js': {
        newPath: 'system/storage-patch.util.js',
        exports: ['storageBridge'],
        imports: []
    },
    'app/src/backend/core/settings.js': {
        newPath: 'system/settings.service.js',
        exports: ['appSettings'],
        imports: []
    },
    'app/src/backend/core/startupLoader.js': {
        newPath: 'system/startup-loader.service.js',
        exports: ['startupLoader'],
        imports: []
    },
    'app/src/backend/core/windowsProtocol.js': {
        newPath: 'system/windows-protocol.util.js',
        exports: ['syncWindowsProtocolRegistration'],
        imports: []
    },
    'app/src/backend/core/state.js': {
        newPath: 'state/state.service.js',
        exports: ['selectedEngine', 'setSelectedEngine', 'getSelectedEngine'],
        imports: []
    },
    'app/src/backend/core/scripts.js': {
        newPath: 'system/startup.js',
        exports: ['startApp', 'testToasts', 'clearTestToasts', 'installGlobalErrorReporter', 'completeFirstRunStorageSetup', 'recommendSaferStorageLocation', 'offerNestedStorageRepair'],
        imports: [
            { vars: ['appSettings'], from: './settings.service.js' },
            { vars: ['networkStatus'], from: './network-status.service.js' },
            { vars: ['startupLoader'], from: './startup-loader.service.js' },
            { vars: ['storageBridge'], from: './storage-patch.util.js' },
            { vars: ['syncWindowsProtocolRegistration'], from: './windows-protocol.util.js' },
            { vars: ['disableProductionRefreshShortcuts'], from: './production-shortcuts.util.js' },
            { vars: ['router'], from: '../routing/router.service.js' },
            { vars: ['openWeekboxLink', 'openLaunchDeepLink'], from: '../routing/deep-links.service.js' },
            { vars: ['appUpdater'], from: '../updates/app-updater.service.js' }
        ]
    }
};

for (const [key, info] of Object.entries(modulesInfo)) {
    let raw = rawModules[key];
    if (!raw) continue;
    
    // Unwrap the esm / commonjs blocks
    raw = raw.replace(/var init_[a-zA-Z0-9_]+ = __esm\(\{\s*"[^"]+"\(\) \{([\s\S]*?)\}\s*\}\);/g, '$1');
    raw = raw.replace(/var require_[a-zA-Z0-9_]+ = __commonJS\(\{\s*"[^"]+"\(\) \{([\s\S]*?)\}\s*\}\);/g, '$1');
    
    // Remove __name() wraps
    raw = raw.replace(/__name\([a-zA-Z0-9_]+,\s*"[a-zA-Z0-9_]+"\);/g, '');
    raw = raw.replace(/\/\*\s*@__PURE__\s*\*\/\s*__name\(([\s\S]*?),\s*"[a-zA-Z0-9_]+"\)/g, '$1');
    
    // Remove calls to init_...
    raw = raw.replace(/init_[a-zA-Z0-9_]+\(\);/g, '');
    
    // Completely remove the old duplicate gameBananaApi import from deepLinks.js
    if (key === 'app/src/backend/core/deepLinks.js') {
        raw = raw.replace(/import\s+{\s*gameBananaApi\s*}\s+from\s+["'].*?api\/gamebanana\.js["'];?/g, '');
    }

    // Adjust internal UI imports
    raw = raw.replace(/^(?:import|export)\s+.*?from\s+(["'])(.*?)(?:\1);/gm, (match, q1, impPath) => {
        if (impPath.startsWith('.')) {
            const oldAbs = path.resolve(coreDir, impPath);
            const newDir = path.dirname(path.join(coreDir, info.newPath));
            let newRel = path.relative(newDir, oldAbs).replace(/\\/g, '/');
            if (!newRel.startsWith('.')) newRel = './' + newRel;
            return match.replace(impPath, newRel);
        }
        return match;
    });
    
    let importsStr = '';
    for (const imp of info.imports) {
        importsStr += `import { ${imp.vars.join(', ')} } from '${imp.from}';\n`;
    }
    
    let exportsStr = '';
    if (info.exports.length > 0) {
        exportsStr = `\nexport { ${info.exports.join(', ')} };\n`;
    }
    
    let finalCode = importsStr + '\n' + raw + exportsStr;
    
    const absPath = path.join(coreDir, info.newPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, finalCode.trim() + '\n', 'utf8');
}

fs.unlinkSync(path.join(coreDir, 'index.js'));
