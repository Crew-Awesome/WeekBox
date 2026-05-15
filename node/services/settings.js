const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_SETTINGS = {
  locale: "en",
  firstRunCompleted: false,
  checkAppUpdatesOnStartup: true,
  autoDownloadAppUpdates: false,
  showAnimations: true,
  gamebananaIntegration: {
    pollingIntervalSeconds: 300,
  },
};

function settingsPath(app) {
  return path.join(app.getPath("userData"), "settings.json");
}

async function readSettings(app) {
  const file = settingsPath(app);
  if (!fs.existsSync(file)) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(await fsp.readFile(file, "utf8"));
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeSettings(app, patch) {
  const merged = { ...(await readSettings(app)), ...patch };
  await fsp.mkdir(app.getPath("userData"), { recursive: true });
  await fsp.writeFile(settingsPath(app), JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

module.exports = { readSettings, writeSettings };
