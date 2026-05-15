const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel, payload) {
  return ipcRenderer.invoke(channel, payload);
}

function on(eventName, listener) {
  const wrapped = (_event, payload) => listener(payload);
  ipcRenderer.on(eventName, wrapped);
  return () => ipcRenderer.removeListener(eventName, wrapped);
}

contextBridge.exposeInMainWorld("weekbox", {
  app: {
    getVersion: () => invoke("weekbox:getVersion"),
    getOS: () => invoke("weekbox:getOS"),
    isPackaged: () => invoke("weekbox:isPackaged"),
    diagnosticInfo: () => invoke("weekbox:diagnosticInfo"),
    showWindow: () => invoke("weekbox:showWindow"),
    minimizeWindow: () => invoke("weekbox:minimizeWindow"),
    toggleFullscreen: () => invoke("weekbox:toggleFullscreen"),
  },
  system: {
    openExternalUrl: (payload) => invoke("weekbox:openExternalUrl", payload),
    openPath: (payload) => invoke("weekbox:openPath", payload),
    openAnyPath: (payload) => invoke("weekbox:openAnyPath", payload),
    showItemInFolder: (payload) => invoke("weekbox:showItemInFolder", payload),
    pickFolder: (payload) => invoke("weekbox:pickFolder", payload),
    pickFile: (payload) => invoke("weekbox:pickFile", payload),
    inspectPath: (payload) => invoke("weekbox:inspectPath", payload),
    listDirectory: (payload) => invoke("weekbox:listDirectory", payload),
  },
  settings: {
    get: () => invoke("weekbox:getSettings"),
    update: (payload) => invoke("weekbox:updateSettings", payload),
  },
  deeplink: {
    getPending: () => invoke("weekbox:getPendingDeepLinks"),
    onDeepLink: (listener) => on("weekbox:deep-link", listener),
  },
  install: {
    installArchive: (payload) => invoke("weekbox:installArchive", payload),
    installEngine: (payload) => invoke("weekbox:installEngine", payload),
    importEngineFolder: (payload) => invoke("weekbox:importEngineFolder", payload),
    importModFolder: (payload) => invoke("weekbox:importModFolder", payload),
    inspectEngineInstall: (payload) => invoke("weekbox:inspectEngineInstall", payload),
    cancelInstall: (payload) => invoke("weekbox:cancelInstall", payload),
    onProgress: (listener) => on("weekbox:install-progress", listener),
  },
  launch: {
    launchEngine: (payload) => invoke("weekbox:launchEngine", payload),
    getRunningLaunches: () => invoke("weekbox:getRunningLaunches"),
    killLaunch: (payload) => invoke("weekbox:killLaunch", payload),
    onLaunchExit: (listener) => on("weekbox:launch-exit", listener),
  },
  gamebanana: {
    authStart: (payload) => invoke("gamebanana:auth:start", payload),
    authStatus: () => invoke("gamebanana:auth:status"),
    authClear: () => invoke("gamebanana:auth:clear"),
    userInfo: () => invoke("gamebanana:user:info"),
    userAvatar: () => invoke("gamebanana:user:avatar"),
    clearCache: () => invoke("gamebanana:cache:clear"),
    downloadStart: (payload) => invoke("gamebanana:download:start", payload),
    downloadCancel: (payload) => invoke("gamebanana:download:cancel", payload),
    onDownloadProgress: (listener) => on("gamebanana:download-progress", listener),
  },
});
