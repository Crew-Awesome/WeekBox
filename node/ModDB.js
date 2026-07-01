const path = require('path');
const { DATA_PATH } = require('./Database.js');
const { AVAILABLE_ENGINES } = require('./Constants.js');
const zip = require('7zip-min');
const fs = require('fs');
const { dialog } = require('electron');
async function installMod(zipPath, engine, name) {
    if (!AVAILABLE_ENGINES.includes(engine)) {
        throw new Error(`Engine "${engine}" is not supported.`);
    }

    const modSeed = Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15);
    const modPath = path.join(DATA_PATH, "mods", engine, modSeed);

    if (!fs.existsSync(path.join(modPath, '..'))) {
        fs.mkdirSync(path.join(modPath, '..'), { recursive: true });
    }

    await zip.unpack(zipPath, modPath);

    if (fs.readdirSync(modPath).length > 1) {
        dialog.showMessageBoxSync({
            title: 'Invalid mod structure',
            message: 'The mod zip file must contain a single folder at the root level.',
            buttons: ['OK']
        });
        fs.rmdirSync(modPath, { recursive: true });
        return null;
    }

    var folderName = fs.readdirSync(modPath).find(file => {
        return fs.statSync(path.join(modPath, file)).isDirectory();
    });

    if (!fs.existsSync(path.join(modPath, 'weekbox_meta.json'))) {
        fs.writeFileSync(path.join(modPath, 'weekbox_meta.json'), JSON.stringify({ name: name || folderName || "Unnamed Mod" }, null, 4));
    }

    return modSeed;
}

async function getInstalledMods() {
    const modsDir = path.join(DATA_PATH, "mods", "codename");
    if (!fs.existsSync(modsDir)) {
        return [];
    }
    const modSeeds = fs.readdirSync(modsDir).filter(seed => {
        return fs.existsSync(path.join(modsDir, seed, 'weekbox_meta.json'));
    });

    return modSeeds.map(seed => {
        const metaPath = path.join(modsDir, seed, 'weekbox_meta.json');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return {
            seed: seed,
            name: meta.name || "Unnamed Mod"
        };
    });
}

async function loadToEngine(engineUID, modSeeds) {
    var modsDir = path.join(DATA_PATH, engineUID, 'mods');
    if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true });
    }

    for (const seed of modSeeds) {
        let sourceDir = path.join(DATA_PATH, 'mods', 'codename', seed);
        fs.readdirSync(sourceDir).forEach(file => {
            if (file === 'weekbox_meta.json') {
                return;
            }

            if (fs.statSync(path.join(sourceDir, file)).isDirectory()) {
                sourceDir = path.join(sourceDir, file);
            }
        });
        let name = JSON.parse(fs.readFileSync(path.join(DATA_PATH, 'mods', 'codename', seed, 'weekbox_meta.json'), 'utf-8')).name;
        const destDir = path.join(modsDir, name);

        fs.cpSync(sourceDir, destDir, { recursive: true });
    }
}

function deleteMod(modSeed) {
    fs.rmdirSync(path.join(DATA_PATH, 'mods', 'codename', modSeed), { recursive: true });
}

module.exports = {
    installMod,
    getInstalledMods,
    loadToEngine,
    deleteMod
};