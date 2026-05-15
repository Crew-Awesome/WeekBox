const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const { createIpcRuntime, registerIpcHandlers } = require("./ipc");

let mainWindow = null;

const runtime = createIpcRuntime({ app });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "..", "web", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, "..", "web", "index.html"));
  runtime.setMainWindow(win);
  mainWindow = win;

  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
      runtime.setMainWindow(null);
    }
  });

  win.webContents.on("did-finish-load", () => {
    runtime.flushPendingDeepLinks((url) => runtime.emitToRenderer("weekbox:deep-link", { url }));
  });

  return win;
}

function registerProtocolHandler() {
  try {
    if (process.defaultApp && process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("weekbox", process.execPath, [path.resolve(process.argv[1])]);
      return;
    }
    app.setAsDefaultProtocolClient("weekbox");
  } catch {
  }
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

app.setName("WeekBox");
if (process.platform === "win32") {
  app.setAppUserModelId("com.weekbox.desktop");
}

app.on("second-instance", (_event, argv) => {
  const deepLink = runtime.extractDeepLinkFromArgv(argv);
  if (deepLink) {
    runtime.enqueueDeepLink(deepLink);
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  runtime.enqueueDeepLink(url);
  if (!mainWindow && app.isReady()) {
    createWindow();
  }
});

app.whenReady().then(() => {
  registerProtocolHandler();
  registerIpcHandlers({ app, runtime });

  const startupDeepLink = runtime.extractDeepLinkFromArgv(process.argv);
  if (startupDeepLink) {
    runtime.enqueueDeepLink(startupDeepLink);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
