const path = require('path');
const { DATA_PATH } = require('./Database.js');
const { AVAILABLE_ENGINES } = require('./Constants.js');
const zl = require('zip-lib');
const fs = require('fs');

async function installMod(zipPath, engine) {
    if (!AVAILABLE_ENGINES.includes(engine)) {
        throw new Error(`Engine "${engine}" is not supported.`);
    }

    const modSeed = Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15);
    const modPath = path.join(DATA_PATH, "mods", engine, modSeed);

    await zl.extract(zipPath, modPath);

    return modSeed;
}

module.exports = {
    installMod
};