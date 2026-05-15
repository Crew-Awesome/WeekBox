const { ipcMain, BrowserWindow, dialog, shell, app: electronApp } = require("electron");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { randomUUID } = require("node:crypto");
const { ok, fail, wrap } = require("./response");
const { readSettings, writeSettings } = require("../services/settings");
const { createLaunchManager } = require("../services/launches");
const { createGameBananaService } = require("../services/gamebanana");
const { assertString, assertObject } = require("./validate");

const IPC_EVENTS = {
  deepLink: "weekbox:deep-link",
  installProgress: "weekbox:install-progress",
  appUpdate: "weekbox:app-update",
  launchExit: "weekbox:launch-exit",
  gamebananaProgress: "gamebanana:download-progress",
};

function now() {
  return Date.now();
}

function createIpcRuntime({ app }) {
  const emitter = new EventEmitter();
  const launchManager = createLaunchManager(emitter);
  const gb = createGameBananaService(app);

  let mainWindow = null;
  const pendingDeepLinks = [];
  const jobs = new Map();

  const dataDir = app.getPath("userData");
  const sandboxRoot = path.join(dataDir, "weekbox-data");
  fs.mkdirSync(sandboxRoot, { recursive: true });

  function setMainWindow(win) {
    mainWindow = win;
  }

  function emitToRenderer(eventName, payload) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(eventName, payload);
    }
  }

  emitter.on("install-progress", (payload) => emitToRenderer(IPC_EVENTS.installProgress, payload));
  emitter.on("updater-status", (payload) => emitToRenderer(IPC_EVENTS.appUpdate, payload));
  emitter.on("launch-exit", (payload) => emitToRenderer(IPC_EVENTS.launchExit, payload));
  emitter.on("gamebanana-download-progress", (payload) => emitToRenderer(IPC_EVENTS.gamebananaProgress, payload));

  function extractDeepLinkFromArgv(argv) {
    if (!Array.isArray(argv)) return undefined;
    for (const raw of argv) {
      if (typeof raw !== "string") continue;
      const cleaned = raw.trim().replace(/^['"]|['"]$/g, "");
      if (/^weekbox:/i.test(cleaned)) return cleaned;
      const embedded = cleaned.match(/(weekbox:[^\s"']+)/i);
      if (embedded && embedded[1]) return embedded[1];
    }
    return undefined;
  }

  function enqueueDeepLink(url) {
    if (typeof url !== "string" || !/^weekbox:/i.test(url.trim())) return;
    const normalized = url.trim().replace(/^['"]|['"]$/g, "");
    pendingDeepLinks.push(normalized);
    emitToRenderer(IPC_EVENTS.deepLink, { url: normalized });
  }

  function flushPendingDeepLinks(cb) {
    while (pendingDeepLinks.length > 0) {
      const next = pendingDeepLinks.shift();
      cb(next);
    }
  }

  function getPendingDeepLinks() {
    const links = [...pendingDeepLinks];
    pendingDeepLinks.length = 0;
    return { links };
  }

  function createJob(kind) {
    const jobId = `${kind}-${randomUUID()}`;
    const state = { canceled: false, createdAt: now(), kind };
    jobs.set(jobId, state);
    return { jobId, state };
  }

  function cancelJob(jobId) {
    const state = jobs.get(jobId);
    if (!state) return false;
    state.canceled = true;
    return true;
  }

  function publishInstall(jobId, phase, progress, message) {
    emitter.emit("install-progress", { jobId, phase, progress, message, timestamp: now() });
  }

  async function fakeInstall(kind, payload) {
    const { jobId, state } = createJob(kind);
    publishInstall(jobId, "queued", 0, `${kind} queued`);
    for (const step of [10, 30, 55, 75, 100]) {
      if (state.canceled) {
        publishInstall(jobId, "canceled", step, `${kind} canceled`);
        jobs.delete(jobId);
        return { jobId, canceled: true };
      }
      await new Promise((resolve) => setTimeout(resolve, 130));
      publishInstall(jobId, "running", step, `${kind} ${step}%`);
    }
    jobs.delete(jobId);
    return { jobId, canceled: false, result: payload || {} };
  }

  function ensureSafePath(inputPath) {
    assertString(inputPath, "targetPath");
    const resolved = path.resolve(inputPath);
    return resolved;
  }

  return {
    app,
    electronApp,
    dialog,
    shell,
    BrowserWindow,
    emitter,
    setMainWindow,
    emitToRenderer,
    extractDeepLinkFromArgv,
    enqueueDeepLink,
    flushPendingDeepLinks,
    getPendingDeepLinks,
    readSettings: () => readSettings(app),
    writeSettings: (patch) => writeSettings(app, patch),
    launchManager,
    gamebanana: gb,
    fakeInstall,
    cancelJob,
    listJobs: () => [...jobs.entries()].map(([jobId, data]) => ({ jobId, ...data })),
    ensureSafePath,
    sandboxRoot,
  };
}

function registerIpcHandlers({ app, runtime }) {
  const invoke = (handler) => wrap(handler);

  ipcMain.handle("weekbox:getVersion", invoke(async () => ok({ version: app.getVersion() })));
  ipcMain.handle("weekbox:getOS", invoke(async () => ok({
    platform: process.platform,
    release: require("node:os").release(),
    version: require("node:os").version(),
  })));
  ipcMain.handle("weekbox:isPackaged", invoke(async () => ok({ isPackaged: app.isPackaged })));
  ipcMain.handle("weekbox:diagnosticInfo", invoke(async () => ok({
    appName: app.getName(),
    appVersion: app.getVersion(),
    platform: process.platform,
    now: now(),
    jobs: runtime.listJobs(),
  })));

  ipcMain.handle("weekbox:showWindow", invoke(async (event) => {
    runtime.BrowserWindow.fromWebContents(event.sender)?.show();
    return ok({ shown: true });
  }));
  ipcMain.handle("weekbox:minimizeWindow", invoke(async (event) => {
    runtime.BrowserWindow.fromWebContents(event.sender)?.minimize();
    return ok({ minimized: true });
  }));
  ipcMain.handle("weekbox:toggleFullscreen", invoke(async (event) => {
    const senderWin = runtime.BrowserWindow.fromWebContents(event.sender);
    if (!senderWin) return ok({ fullScreen: false });
    senderWin.setFullScreen(!senderWin.isFullScreen());
    return ok({ fullScreen: senderWin.isFullScreen() });
  }));

  ipcMain.handle("weekbox:openExternalUrl", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    assertString(payload.url, "url");
    await runtime.shell.openExternal(payload.url);
    return ok({ opened: true });
  }));
  ipcMain.handle("weekbox:openPath", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    const target = runtime.ensureSafePath(payload.targetPath);
    await runtime.shell.openPath(target);
    return ok({ opened: true, targetPath: target });
  }));
  ipcMain.handle("weekbox:openAnyPath", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    const target = runtime.ensureSafePath(payload.targetPath);
    await runtime.shell.openPath(target);
    return ok({ opened: true, targetPath: target });
  }));
  ipcMain.handle("weekbox:showItemInFolder", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    const target = runtime.ensureSafePath(payload.targetPath);
    runtime.shell.showItemInFolder(target);
    return ok({ shown: true, targetPath: target });
  }));

  ipcMain.handle("weekbox:pickFolder", invoke(async (_event, payload) => {
    const result = await runtime.dialog.showOpenDialog({
      title: payload?.title || "Select folder",
      defaultPath: payload?.defaultPath,
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return ok({ canceled: true });
    return ok({ canceled: false, path: result.filePaths[0] });
  }));

  ipcMain.handle("weekbox:pickFile", invoke(async (_event, payload) => {
    const result = await runtime.dialog.showOpenDialog({
      title: payload?.title || "Select file",
      defaultPath: payload?.defaultPath,
      properties: ["openFile"],
      filters: Array.isArray(payload?.filters) ? payload.filters : undefined,
    });
    if (result.canceled || result.filePaths.length === 0) return ok({ canceled: true });
    return ok({ canceled: false, path: result.filePaths[0] });
  }));

  ipcMain.handle("weekbox:getSettings", invoke(async () => ok(await runtime.readSettings())));
  ipcMain.handle("weekbox:updateSettings", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    return ok(await runtime.writeSettings(payload));
  }));
  ipcMain.handle("weekbox:getPendingDeepLinks", invoke(async () => ok(runtime.getPendingDeepLinks())));

  ipcMain.handle("weekbox:installArchive", invoke(async (_event, payload) => ok(await runtime.fakeInstall("installArchive", payload))));
  ipcMain.handle("weekbox:installEngine", invoke(async (_event, payload) => ok(await runtime.fakeInstall("installEngine", payload))));
  ipcMain.handle("weekbox:importEngineFolder", invoke(async (_event, payload) => ok(await runtime.fakeInstall("importEngineFolder", payload))));
  ipcMain.handle("weekbox:importModFolder", invoke(async (_event, payload) => ok(await runtime.fakeInstall("importModFolder", payload))));
  ipcMain.handle("weekbox:cancelInstall", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    assertString(payload.jobId, "jobId");
    return ok({ canceled: runtime.cancelJob(payload.jobId), jobId: payload.jobId });
  }));

  ipcMain.handle("weekbox:listDirectory", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    const target = runtime.ensureSafePath(payload.targetPath);
    const entries = await fsp.readdir(target, { withFileTypes: true });
    return ok({
      targetPath: target,
      entries: entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
      })),
    });
  }));

  ipcMain.handle("weekbox:inspectPath", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    const target = runtime.ensureSafePath(payload.targetPath);
    const stats = await fsp.stat(target);
    return ok({
      targetPath: target,
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
    });
  }));

  ipcMain.handle("weekbox:inspectEngineInstall", invoke(async (_event, payload) => {
    assertObject(payload, "payload");
    const target = runtime.ensureSafePath(payload.installPath);
    const exists = fs.existsSync(target);
    return ok({ installPath: target, exists, recognized: exists });
  }));

  ipcMain.handle("weekbox:launchEngine", invoke(async (_event, payload) => ok(await runtime.launchManager.launch(payload))));
  ipcMain.handle("weekbox:getRunningLaunches", invoke(async () => ok({ launches: runtime.launchManager.list() })));
  ipcMain.handle("weekbox:killLaunch", invoke(async (_event, payload) => ok(await runtime.launchManager.kill(payload))));

  ipcMain.handle("gamebanana:auth:start", invoke(async (_event, payload) => ok(await runtime.gamebanana.startAuth(payload))));
  ipcMain.handle("gamebanana:auth:status", invoke(async () => ok(await runtime.gamebanana.authStatus())));
  ipcMain.handle("gamebanana:auth:clear", invoke(async () => ok(await runtime.gamebanana.clearAuth())));
  ipcMain.handle("gamebanana:user:info", invoke(async () => ok(await runtime.gamebanana.userInfo())));
  ipcMain.handle("gamebanana:user:avatar", invoke(async () => ok(await runtime.gamebanana.userAvatar())));
  ipcMain.handle("gamebanana:cache:clear", invoke(async () => ok(await runtime.gamebanana.clearCache())));
  ipcMain.handle("gamebanana:download:start", invoke(async (_event, payload) => ok(await runtime.gamebanana.download(payload, runtime.emitter))));
  ipcMain.handle("gamebanana:download:cancel", invoke(async (_event, payload) => ok(await runtime.gamebanana.cancelDownload(payload))));
}

module.exports = {
  createIpcRuntime,
  registerIpcHandlers,
  IPC_EVENTS,
};
