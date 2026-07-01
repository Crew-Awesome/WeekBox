const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
	getMods: (...args) => ipcRenderer.invoke('getMods', args),
	go: (...args) => ipcRenderer.invoke('go', args),
	deleteMod: (...args) => ipcRenderer.invoke('deleteMod', args),
	addViaImport: (...args) => ipcRenderer.invoke('addViaImport', args)
});
