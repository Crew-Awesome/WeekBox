// public/launcher/src/core/storagePatch.js

window.StorageMonkeyPatch = {
    async init() {
        const isNeutralino = typeof Neutralino !== 'undefined';
        if (!isNeutralino) return;

        // 1. Sincronizar Neutralino -> LocalStorage al arrancar
        try {
            const keys = await Neutralino.storage.getKeys();
            for (const key of keys) {
                try {
                    const value = await Neutralino.storage.getData(key);
                    // Guardamos usando el método original antes de parcharlo
                    Storage.prototype.setItem.call(window.localStorage, key, value);
                } catch (err) {
                    console.warn(`Could not read key: ${key}`, err);
                }
            }
            console.log("Genesis Launcher: LocalStorage synced correctly.");
        } catch (err) {
            console.warn("Neutralino storage empty or unavailable.");
        }

        // 2. Respaldar los métodos nativos originales
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        const originalClear = Storage.prototype.clear;

        // 3. Parchar la instancia directamente
        window.localStorage.setItem = function(key, value) {
            originalSet.call(window.localStorage, key, value); // Guarda en RAM/Browser rápido
            Neutralino.storage.setData(key, String(value)).catch(e => console.warn(e)); // Guarda en Disco en 2do plano
        };

        window.localStorage.removeItem = function(key) {
            originalRemove.call(window.localStorage, key);
            Neutralino.storage.removeData(key).catch(e => console.warn(e));
        };

        window.localStorage.clear = function() {
            originalClear.call(window.localStorage);
            Neutralino.storage.getKeys().then(keys => {
                keys.forEach(k => Neutralino.storage.removeData(k));
            }).catch(e => console.warn(e));
        };
    }
};