var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// app/src/backend/core/updates/releaseAssets.js
function getPlatformPackage() {
  if (window.NL_OS === "Windows") return null;
  if (window.NL_OS === "Linux") {
    const architecture = window.NL_ARCH === "arm64" ? "arm64" : window.NL_ARCH === "armhf" || window.NL_ARCH === "arm" ? "armhf" : "x64";
    return {
      asset: `linux-${architecture}`,
      binary: `WeekBox-linux_${architecture}`
    };
  }
  if (window.NL_OS === "Darwin") {
    const architecture = window.NL_ARCH === "arm64" ? "arm64" : "x64";
    return {
      asset: `macos-${architecture}`,
      binary: `WeekBox-mac_${architecture}`
    };
  }
  return null;
}
function getReleaseAsset(release, platform) {
  const expression = new RegExp(
    `^WeekBox-\\d+(?:\\.\\d+)*-${platform.asset.replaceAll("-", "\\-")}\\.zip$`,
    "i"
  );
  return (release.assets || []).find(
    (asset) => expression.test(asset.name || "") && asset.state === "uploaded" && ["application/zip", "application/x-zip-compressed"].includes(
      asset.content_type
    ) && Number(asset.size) > 0
  );
}
function getResourcesAsset(release) {
  return (release.assets || []).find((asset) => {
    if (asset.state !== "uploaded" || Number(asset.size) <= 0) return false;
    const name = asset.name || "";
    return /^WeekBox-.*-resources\.neu$/i.test(name) || /^resources\.neu$/i.test(name);
  });
}
function getWindowsPackage(release) {
  const architecture = window.NL_ARCH === "arm64" ? "arm64" : window.NL_ARCH === "armhf" || window.NL_ARCH === "arm" ? "armhf" : "x64";
  const expression = new RegExp(
    `^WeekBox-\\d+(?:\\.\\d+)*-windows-${architecture}\\.zip$`,
    "i"
  );
  return (release.assets || []).find(
    (asset) => expression.test(asset.name || "") && asset.state === "uploaded" && Number(asset.size) > 0
  );
}
var init_releaseAssets = __esm({
  "app/src/backend/core/updates/releaseAssets.js"() {
    __name(getPlatformPackage, "getPlatformPackage");
    __name(getReleaseAsset, "getReleaseAsset");
    __name(getResourcesAsset, "getResourcesAsset");
    __name(getWindowsPackage, "getWindowsPackage");
  }
});

// app/src/backend/core/updates/versioning.js
function normalizeVersion(value) {
  return String(value || "").trim().replace(/^v/i, "").split("-")[0];
}
function compareVersions(left, right) {
  const leftParts = normalizeVersion(left).split(".").map(Number);
  const rightParts = normalizeVersion(right).split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}
var init_versioning = __esm({
  "app/src/backend/core/updates/versioning.js"() {
    __name(normalizeVersion, "normalizeVersion");
    __name(compareVersions, "compareVersions");
  }
});

// app/src/backend/core/appUpdater.js
import { downloadArchive } from "../../ui/utils/index.js";
function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function isValidNeutralinoBundle(bytes) {
  if (!bytes || bytes.length < 4) return false;
  if (bytes[0] === 80 && bytes[1] === 75) return true;
  if (bytes[0] === 4 && bytes[1] === 0) return true;
  return false;
}
function quoteShellString(value) {
  const escaped = String(value).replaceAll("'", `'"'"'`);
  return `'${escaped}'`;
}
function createUnixApplyScript({
  appPath,
  archivePath,
  expectedDigest,
  binaryName,
  scriptPath,
  targetExe
}) {
  const target = quoteShellString(appPath);
  const archive = quoteShellString(archivePath);
  const staging = quoteShellString(`${appPath}/.weekbox-update-staging`);
  const targetBinary = targetExe ? quoteShellString(targetExe) : quoteShellString(`${appPath}/${binaryName}`);
  const targetResources = quoteShellString(`${appPath}/resources.neu`);
  const updaterScript = quoteShellString(scriptPath);
  return `#!/bin/sh
set -eu
target=${target}
archive=${archive}
update_directory=$(dirname "$archive")
script_path=${updaterScript}
expected_hash=${quoteShellString(expectedDigest)}
while kill -0 ${Number(window.NL_PID)} 2>/dev/null; do sleep 1; done
if command -v sha256sum >/dev/null 2>&1; then actual_hash=$(sha256sum "$archive" | awk '{print $1}'); else actual_hash=$(shasum -a 256 "$archive" | awk '{print $1}'); fi
[ "$actual_hash" = "$expected_hash" ] || { echo 'Downloaded update failed its integrity check.' >&2; exit 1; }
staging=${staging}
backup="$staging/.backup"
rm -rf "$staging"
unzip -qo "$archive" -d "$staging"
source_binary=$(find "$staging" -type f -name ${quoteShellString(binaryName)} | head -n 1)
if [ -z "$source_binary" ]; then source_binary=$(find "$staging" -type f -executable -not -name "*.so*" -not -name "*.dylib*" | head -n 1); fi
source_resources=$(find "$staging" -type f -name "resources.neu" | head -n 1)
if [ -z "$source_binary" ] || [ ! -f "$source_binary" ]; then echo 'The update package is missing the WeekBox executable.' >&2; exit 1; fi
target_binary=${targetBinary}
target_resources=${targetResources}
retry() {
  attempts=0
  until "$@"; do
    attempts=$((attempts + 1))
    [ "$attempts" -lt 3 ] || return 1
    sleep 1
  done
}
mkdir -p "$backup"
[ ! -f "$target_binary" ] || cp "$target_binary" "$backup/app"
[ ! -f "$target_resources" ] || cp "$target_resources" "$backup/resources.neu"
updated=false
cleanup() {
  if [ "$updated" != true ]; then
    [ ! -f "$backup/app" ] || cp "$backup/app" "$target_binary"
    [ ! -f "$backup/resources.neu" ] || cp "$backup/resources.neu" "$target_resources"
  fi
  rm -f "$archive"
  rm -f "$script_path"
  rmdir "$update_directory" 2>/dev/null || true
  rm -rf "$staging"
}
trap cleanup EXIT
retry cp "$source_binary" "$target_binary"
if [ -f "$source_resources" ]; then
  retry cp "$source_resources" "$target_resources"
else
  rm -f "$target_resources"
fi
retry chmod 755 "$target_binary"
launch_attempts=0
while :; do
  "$target_binary" >/dev/null 2>&1 &
  launch_pid=$!
  sleep 1
  if kill -0 "$launch_pid" 2>/dev/null; then
    updated=true
    break
  fi
  launch_attempts=$((launch_attempts + 1))
  [ "$launch_attempts" -lt 3 ] || exit 1
done
`;
}
async function getCurrentVersion() {
  const config = await Neutralino.app.getConfig();
  return config.version || "0.0.0";
}
async function fetchLatestRelease() {
  const response = await fetch(RELEASES_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10"
    }
  });
  if (!response.ok)
    throw new Error(`Update check failed: GitHub returned ${response.status}`);
  return response.json();
}
var RELEASES_API, RELEASES_PAGE, UPDATE_DIRECTORY, appUpdater;
var init_appUpdater = __esm({
  "app/src/backend/core/appUpdater.js"() {
    init_releaseAssets();
    init_versioning();
    RELEASES_API = "https://api.github.com/repos/Crew-Awesome/Weekbox/releases/latest";
    RELEASES_PAGE = "https://github.com/Crew-Awesome/Weekbox/releases/latest";
    UPDATE_DIRECTORY = ".weekbox-update";
    __name(toHex, "toHex");
    __name(isValidNeutralinoBundle, "isValidNeutralinoBundle");
    __name(quoteShellString, "quoteShellString");
    __name(createUnixApplyScript, "createUnixApplyScript");
    __name(getCurrentVersion, "getCurrentVersion");
    __name(fetchLatestRelease, "fetchLatestRelease");
    appUpdater = {
      getCurrentVersion,
      /**
       * Checks for available updates by comparing the current application version
       * against the latest version reported by the GitHub API.
       * @returns {Promise<Object>} An object detailing the update availability status.
       */
      async check() {
        const release = await fetchLatestRelease();
        const latestVersion = normalizeVersion(release.tag_name);
        const currentVersion = await getCurrentVersion();
        if (!latestVersion) {
          throw new Error("Could not determine the latest WeekBox version.");
        }
        const resourcesAsset = getResourcesAsset(release);
        if (resourcesAsset) {
          if (compareVersions(latestVersion, currentVersion) <= 0) {
            return { status: "current", currentVersion, latestVersion };
          }
          return {
            status: "available",
            currentVersion,
            latestVersion,
            asset: resourcesAsset,
            isResourcesUpdate: true,
            releaseUrl: release.html_url || RELEASES_PAGE
          };
        }
        if (window.NL_OS === "Windows") {
          const packageAsset = getWindowsPackage(release);
          if (packageAsset) {
            if (compareVersions(latestVersion, currentVersion) <= 0) {
              return { status: "current", currentVersion, latestVersion };
            }
            return {
              status: "available",
              currentVersion,
              latestVersion,
              asset: packageAsset,
              windowsPackage: true,
              releaseUrl: release.html_url || RELEASES_PAGE
            };
          }
          return {
            status: "unsupported",
            message: "Automatic updates are not available for this release yet. Download the latest version manually."
          };
        }
        const platform = getPlatformPackage();
        if (!platform) {
          return {
            status: "unsupported",
            message: "Automatic updates are not available for this platform."
          };
        }
        const asset = getReleaseAsset(release, platform);
        if (!asset) {
          throw new Error(
            `The latest WeekBox release has no update package for ${window.NL_OS}.`
          );
        }
        if (compareVersions(latestVersion, currentVersion) <= 0) {
          return { status: "current", currentVersion, latestVersion };
        }
        if (!/^sha256:[a-f0-9]{64}$/i.test(asset.digest || "")) {
          throw new Error(
            "The latest WeekBox release has no valid SHA-256 digest."
          );
        }
        return {
          status: "available",
          currentVersion,
          latestVersion,
          asset,
          releaseUrl: release.html_url || RELEASES_PAGE
        };
      },
      /**
       * Orchestrates the installation of a new update based on its type and target platform.
       * @param {Object} update - The update data object returned by check().
       * @param {Function} [onProgress] - Callback to report installation progress.
       * @param {Function} [onHandoff] - Callback executed immediately before exiting the app.
       */
      async install(update, onProgress = () => {
      }, onHandoff = () => {
      }) {
        if (update?.isResourcesUpdate) {
          return this.installResourcesUpdate(update, onProgress, onHandoff);
        }
        if (update?.windowsPackage) {
          return this.installWindowsPackage(update, onProgress, onHandoff);
        }
        const platform = getPlatformPackage();
        if (!platform)
          throw new Error("Automatic updates are not available for this platform.");
        if (!update?.asset)
          throw new Error("No WeekBox update is ready to install.");
        const updatePath = `${window.NL_PATH}/${UPDATE_DIRECTORY}`;
        const archivePath = `${updatePath}/${update.asset.name}`;
        const scriptPath = `${updatePath}/apply-update.sh`;
        const expectedDigest = update.asset.digest.slice("sha256:".length).toLowerCase();
        await Neutralino.filesystem.createDirectory(updatePath).catch(() => {
        });
        onProgress("Downloading update\u2026");
        await downloadArchive({
          url: update.asset.browser_download_url,
          outPath: archivePath,
          getTask: /* @__PURE__ */ __name(() => null, "getTask"),
          onProgress: /* @__PURE__ */ __name((status) => onProgress(status), "onProgress")
        });
        const data = await Neutralino.filesystem.readBinaryFile(archivePath);
        onProgress("Verifying update\u2026");
        const actualDigest = toHex(await crypto.subtle.digest("SHA-256", data));
        if (actualDigest !== expectedDigest) {
          throw new Error("Downloaded update failed its integrity check.");
        }
        onProgress("Closing WeekBox to apply update\u2026");
        const applyScript = createUnixApplyScript({
          appPath: window.NL_PATH,
          archivePath,
          expectedDigest,
          binaryName: platform.binary,
          scriptPath,
          targetExe: window.NL_ARGS[0]
        });
        await Neutralino.filesystem.writeFile(scriptPath, applyScript);
        const command = `/bin/sh ${quoteShellString(scriptPath)} >/dev/null 2>&1 &`;
        await Neutralino.os.execCommand(command, {
          background: true
        });
        onHandoff();
        await Neutralino.app.exit();
      },
      async installResourcesUpdate(update, onProgress, onHandoff) {
        if (!update?.asset)
          throw new Error("No WeekBox update is ready to install.");
        const target = `${window.NL_PATH}/resources.neu`;
        const staging = `${window.NL_PATH}/${UPDATE_DIRECTORY}/resources.neu`;
        const backup = `${window.NL_PATH}/${UPDATE_DIRECTORY}/resources.neu.bak`;
        await Neutralino.filesystem.createDirectory(`${window.NL_PATH}/${UPDATE_DIRECTORY}`).catch(() => {
        });
        const targetExists = await Neutralino.filesystem.getStats(target).then(() => true).catch(() => false);
        if (targetExists) {
          const current = await Neutralino.filesystem.readBinaryFile(target);
          await Neutralino.filesystem.writeBinaryFile(backup, current);
        }
        onProgress("Downloading update\u2026");
        await downloadArchive({
          url: update.asset.browser_download_url,
          outPath: staging,
          getTask: /* @__PURE__ */ __name(() => null, "getTask"),
          onProgress: /* @__PURE__ */ __name((status) => onProgress(status), "onProgress")
        });
        const bytes = new Uint8Array(
          await Neutralino.filesystem.readBinaryFile(staging)
        );
        onProgress("Verifying update\u2026");
        if (!isValidNeutralinoBundle(bytes)) {
          await Neutralino.filesystem.remove(backup).catch(() => {
          });
          throw new Error("Downloaded update is not a valid app bundle.");
        }
        if (update.asset.digest && /^sha256:[a-f0-9]{64}$/i.test(update.asset.digest)) {
          const actual = toHex(await crypto.subtle.digest("SHA-256", bytes));
          const expected = update.asset.digest.slice("sha256:".length).toLowerCase();
          if (actual !== expected) {
            await Neutralino.filesystem.remove(backup).catch(() => {
            });
            throw new Error("Downloaded update failed its integrity check.");
          }
        }
        onProgress("Installing update\u2026");
        await Neutralino.filesystem.writeBinaryFile(staging, bytes);
        await Neutralino.filesystem.writeBinaryFile(target, bytes);
        onProgress("Restarting WeekBox\u2026");
        const exe = window.NL_ARGS[0];
        if (window.NL_OS === "Darwin" && exe.includes(".app/Contents/MacOS/")) {
          const appBundle = exe.substring(0, exe.indexOf(".app/") + 5);
          await Neutralino.os.execCommand(`open "${appBundle}"`, {
            background: true
          });
        } else {
          await Neutralino.os.execCommand(`"${exe}"`, { background: true });
        }
        onHandoff();
        await Neutralino.app.exit();
      },
      async installWindowsPackage(update, onProgress, onHandoff) {
        if (!update?.asset)
          throw new Error("No WeekBox update is ready to install.");
        const updateDir = `${window.NL_PATH}/${UPDATE_DIRECTORY}`;
        const zipPath = `${updateDir}/update.zip`;
        const staging = `${updateDir}/staging`;
        const scriptPath = `${updateDir}/apply-update.ps1`;
        const appPath = window.NL_PATH;
        await Neutralino.filesystem.createDirectory(updateDir).catch(() => {
        });
        onProgress("Downloading update\u2026");
        await downloadArchive({
          url: update.asset.browser_download_url,
          outPath: zipPath,
          getTask: /* @__PURE__ */ __name(() => null, "getTask"),
          onProgress: /* @__PURE__ */ __name((status) => onProgress(status), "onProgress")
        });
        onProgress("Verifying update\u2026");
        const bytes = new Uint8Array(
          await Neutralino.filesystem.readBinaryFile(zipPath)
        );
        if (!(bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4)) {
          await Neutralino.filesystem.remove(zipPath).catch(() => {
          });
          throw new Error("Downloaded update is not a valid package.");
        }
        const pid = window.NL_PID;
        const targetExe = window.NL_ARGS[0].split(/[/\\]/).pop();
        const script = [
          "$ErrorActionPreference = 'Stop'",
          `$appPath = '${appPath}'`,
          `$zip = '${zipPath}'`,
          `$staging = '${staging}'`,
          `$pid_app = ${pid}`,
          "while (Get-Process -Id $pid_app -ErrorAction SilentlyContinue) { Start-Sleep -Seconds 1 }",
          "Expand-Archive -Path $zip -DestinationPath $staging -Force",
          `$sourceExe = (Get-ChildItem -Path $staging -Filter '*.exe' -Recurse | Select-Object -First 1).FullName`,
          `if (-not $sourceExe) { throw 'Executable not found in update package' }`,
          `$sourceResources = (Get-ChildItem -Path $staging -Filter 'resources.neu' -Recurse | Select-Object -First 1).FullName`,
          `if (Test-Path "$appPath\\$targetExe") { Copy-Item "$appPath\\$targetExe" "$staging\\app.exe.bak" -Force }`,
          `if (Test-Path "$appPath\\resources.neu") { Copy-Item "$appPath\\resources.neu" "$staging\\resources.neu.bak" -Force }`,
          "try {",
          `  Copy-Item $sourceExe "$appPath\\$targetExe" -Force`,
          `  if ($sourceResources) { Copy-Item $sourceResources "$appPath\\resources.neu" -Force }`,
          "} catch {",
          `  if (Test-Path "$staging\\app.exe.bak") { Copy-Item "$staging\\app.exe.bak" "$appPath\\$targetExe" -Force }`,
          `  if (Test-Path "$staging\\resources.neu.bak") { Copy-Item "$staging\\resources.neu.bak" "$appPath\\resources.neu" -Force }`,
          "  throw",
          "}",
          "Remove-Item $zip -Force -ErrorAction SilentlyContinue",
          "Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue",
          `Start-Process "$appPath\\$targetExe"`
        ].join("\r\n");
        await Neutralino.filesystem.writeFile(scriptPath, script);
        onProgress("Restarting WeekBox to apply update\u2026");
        await Neutralino.os.execCommand(
          `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
          { background: true }
        );
        onHandoff();
        await Neutralino.app.exit();
      }
    };
  }
});

// app/src/backend/core/events.js
function emitViewChange(view) {
  appEvents.dispatchEvent(new CustomEvent("view:loaded", { detail: view }));
}
var appEvents;
var init_events = __esm({
  "app/src/backend/core/events.js"() {
    appEvents = new EventTarget();
    __name(emitViewChange, "emitViewChange");
  }
});

// app/src/backend/core/router.js
import { sidebar } from "../../ui/js/index.js";
var router;
var init_router = __esm({
  "app/src/backend/core/router.js"() {
    init_events();
    router = {
      async init() {
        this.mainContent = document.getElementById("main-content");
        this.sidebarContainer = document.getElementById("sidebar-container");
        try {
          const response = await fetch("src/ui/html/index.html");
          const html = await response.text();
          const temp = document.createElement("div");
          temp.innerHTML = html;
          const templates = temp.querySelectorAll("template");
          templates.forEach((t) => document.body.appendChild(t));
          const sidebarTpl = document.getElementById("tpl-sidebar");
          if (sidebarTpl) this.sidebarContainer.innerHTML = sidebarTpl.innerHTML;
        } catch (e) {
          console.error("Failed to load templates", e);
        }
        await sidebar.init();
        await this.navigate("home");
      },
      async loadComponent(container, path) {
      },
      async navigate(viewId) {
        try {
          const tpl = document.getElementById("tpl-" + viewId);
          if (tpl) {
            this.mainContent.innerHTML = tpl.innerHTML;
            this.currentViewId = viewId;
            emitViewChange(viewId);
          } else {
            throw new Error("View template not found: tpl-" + viewId);
          }
        } catch (error) {
          this.mainContent.innerHTML = '<p style="padding: 24px; color: #ff4a4a;">Failed to load view: ' + viewId + "</p>";
        }
      }
    };
  }
});

// app/src/backend/core/deepLinks.js
import { gameBananaApi } from "../api/gamebanana.js";
import { modModal } from "../../ui/js/index.js";
import { sidebar as sidebar2 } from "../../ui/js/index.js";
function parseWeekboxLink(value) {
  const directMatch = String(value || "").trim().match(/^weekbox:\/\/mod(?:\/|,)(\d+)\/?$/i);
  if (directMatch) return { type: "mod", id: Number(directMatch[1]) };
  try {
    const url = new URL(value);
    if (url.protocol !== "weekbox:") return null;
    const type = url.hostname.toLowerCase();
    const id = Number(url.pathname.replace(/^\//, ""));
    if (type !== "mod" || !Number.isInteger(id) || id <= 0) return null;
    return { type, id };
  } catch (error) {
    return null;
  }
}
async function openWeekboxLink(value) {
  const target = parseWeekboxLink(value);
  if (!target) return false;
  const engineId = gameBananaApi.getEngineIdForSubmission(
    `${target.type}s`,
    target.id
  );
  if (engineId) return sidebar2.openEngine(engineId);
  await router.navigate("home");
  await modModal.open(target.id);
  return true;
}
async function openLaunchDeepLink() {
  const link = window.NL_ARGS?.find(
    (argument) => argument.toLowerCase().startsWith("weekbox:")
  );
  if (!link) return false;
  await Neutralino.window.focus().catch(() => {
  });
  return openWeekboxLink(link);
}
var init_deepLinks = __esm({
  "app/src/backend/core/deepLinks.js"() {
    init_router();
    __name(parseWeekboxLink, "parseWeekboxLink");
    __name(openWeekboxLink, "openWeekboxLink");
    __name(openLaunchDeepLink, "openLaunchDeepLink");
  }
});

// app/src/backend/core/networkStatus.js
var _NetworkStatus, NetworkStatus, networkStatus;
var init_networkStatus = __esm({
  "app/src/backend/core/networkStatus.js"() {
    _NetworkStatus = class _NetworkStatus extends EventTarget {
      constructor() {
        super();
        this.online = typeof navigator === "undefined" ? true : navigator.onLine;
        this.initialized = false;
      }
      init() {
        if (this.initialized || typeof window === "undefined") return;
        this.initialized = true;
        window.addEventListener("online", () => this.setOnline(true));
        window.addEventListener("offline", () => this.setOnline(false));
      }
      setOnline(online) {
        const next = Boolean(online);
        if (this.online === next) return;
        this.online = next;
        this.dispatchEvent(new CustomEvent("change", { detail: { online: next } }));
      }
    };
    __name(_NetworkStatus, "NetworkStatus");
    NetworkStatus = _NetworkStatus;
    networkStatus = new NetworkStatus();
  }
});

// app/src/backend/core/productionShortcuts.js
function isDevelopmentRun() {
  const args = window.NL_ARGS;
  const joinedArgs = Array.isArray(args) ? args.join(" ") : String(args || "");
  return joinedArgs.includes("--neu-dev-auto-reload");
}
function disableProductionRefreshShortcuts() {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  if (isDevelopmentRun()) return;
  window.addEventListener("keydown", (event) => {
    const isRefresh = event.key === "F5" || (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r";
    if (isRefresh) event.preventDefault();
  });
}
var init_productionShortcuts = __esm({
  "app/src/backend/core/productionShortcuts.js"() {
    __name(isDevelopmentRun, "isDevelopmentRun");
    __name(disableProductionRefreshShortcuts, "disableProductionRefreshShortcuts");
  }
});

// app/src/backend/core/storagePatch.js
var storageBridge;
var init_storagePatch = __esm({
  "app/src/backend/core/storagePatch.js"() {
    storageBridge = {
      async init() {
        const isNeutralino = typeof Neutralino !== "undefined";
        if (!isNeutralino) return;
        try {
          const keys = await Neutralino.storage.getKeys();
          for (const key of keys) {
            try {
              const value = await Neutralino.storage.getData(key);
              Storage.prototype.setItem.call(window.localStorage, key, value);
            } catch (err) {
              console.warn(`Could not read key: ${key}`, err);
            }
          }
          console.log("WeekBox: LocalStorage synced correctly.");
        } catch (err) {
          console.warn("Neutralino storage empty or unavailable.");
        }
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        const originalClear = Storage.prototype.clear;
        const isNativeStorageKey = /* @__PURE__ */ __name((key) => /^[a-zA-Z-_0-9]{1,50}$/.test(key), "isNativeStorageKey");
        window.localStorage.setItem = function(key, value) {
          originalSet.call(window.localStorage, key, value);
          if (!isNativeStorageKey(key)) return;
          Neutralino.storage.setData(key, String(value)).catch((e) => console.warn(e));
        };
        window.localStorage.removeItem = function(key) {
          originalRemove.call(window.localStorage, key);
          if (!isNativeStorageKey(key)) return;
          Neutralino.storage.removeData(key).catch((e) => console.warn(e));
        };
        window.localStorage.clear = function() {
          originalClear.call(window.localStorage);
          Neutralino.storage.getKeys().then((keys) => {
            keys.forEach((k) => Neutralino.storage.removeData(k));
          }).catch((e) => console.warn(e));
        };
      }
    };
  }
});

// app/src/backend/core/settings.js
function isValidValue(definition, value) {
  if (value === null) return Boolean(definition.nullable);
  return typeof value === definition.type;
}
function createDefaultDocument() {
  return {
    version: SETTINGS_SCHEMA_VERSION,
    settings: Object.fromEntries(
      Object.entries(settingDefinitions).map(([key, definition]) => [
        key,
        { type: definition.type, value: definition.defaultValue }
      ])
    )
  };
}
function normaliseDocument(document2) {
  const defaults = createDefaultDocument();
  if (!document2 || typeof document2 !== "object") return defaults;
  const savedSettings = document2.settings;
  if (!savedSettings || typeof savedSettings !== "object") return defaults;
  for (const [key, definition] of Object.entries(settingDefinitions)) {
    const saved = savedSettings[key];
    if (saved && saved.type === definition.type && isValidValue(definition, saved.value)) {
      defaults.settings[key] = { type: definition.type, value: saved.value };
    }
  }
  for (const [key, saved] of Object.entries(savedSettings)) {
    if (!(key in defaults.settings) && saved && typeof saved === "object") {
      defaults.settings[key] = saved;
    }
  }
  return defaults;
}
var SETTINGS_FILE_NAME, SETTINGS_SCHEMA_VERSION, LEGACY_PREFIX, SETTINGS_PATH_KEY, settingDefinitions, appSettings;
var init_settings = __esm({
  "app/src/backend/core/settings.js"() {
    SETTINGS_FILE_NAME = "settings.json";
    SETTINGS_SCHEMA_VERSION = 1;
    LEGACY_PREFIX = "weekbox_setting_";
    SETTINGS_PATH_KEY = "weekbox-settings-data-path";
    settingDefinitions = {
      launchOnStartup: { type: "boolean", defaultValue: false },
      registerProtocolLinks: { type: "boolean", defaultValue: true },
      blurOutOfFocus: { type: "boolean", defaultValue: true },
      hideOnLaunch: { type: "boolean", defaultValue: false },
      autoStartAfterDownload: { type: "boolean", defaultValue: false },
      multithreadDownloads: { type: "boolean", defaultValue: true },
      multithreadStorageMoves: { type: "boolean", defaultValue: true },
      storageParentPath: { type: "string", defaultValue: null, nullable: true },
      storageMoveRecommendationDismissed: { type: "boolean", defaultValue: false },
      checkUpdatesOnStartup: { type: "boolean", defaultValue: true },
      checkUpdatesInBackground: { type: "boolean", defaultValue: true },
      checkAppUpdatesOnStartup: { type: "boolean", defaultValue: true },
      diagnosticReportingEnabled: { type: "boolean", defaultValue: true },
      diagnosticReportingConsentAnswered: { type: "boolean", defaultValue: false },
      firstRunStorageSetupComplete: { type: "boolean", defaultValue: false }
    };
    __name(isValidValue, "isValidValue");
    __name(createDefaultDocument, "createDefaultDocument");
    __name(normaliseDocument, "normaliseDocument");
    appSettings = {
      defaultSettings: Object.fromEntries(
        Object.entries(settingDefinitions).map(([key, definition]) => [
          key,
          definition.defaultValue
        ])
      ),
      document: createDefaultDocument(),
      path: null,
      initialized: false,
      writeQueue: Promise.resolve(),
      async resolveDataPath(defaultDataPath) {
        try {
          return await Neutralino.storage.getData(SETTINGS_PATH_KEY) || defaultDataPath;
        } catch {
          return defaultDataPath;
        }
      },
      async init(dataPath) {
        if (this.initialized || typeof Neutralino === "undefined") return;
        if (!dataPath) {
          console.warn("WeekBox settings: data path is unavailable.");
          return;
        }
        this.path = `${dataPath}/${SETTINGS_FILE_NAME}`;
        try {
          await Neutralino.filesystem.createDirectory(dataPath).catch(async () => {
            await Neutralino.filesystem.getStats(dataPath);
          });
          let fileExists = true;
          try {
            this.document = normaliseDocument(
              JSON.parse(await Neutralino.filesystem.readFile(this.path))
            );
          } catch (error) {
            fileExists = false;
            if (error?.code && error.code !== "NE_FS_FILRDER") {
              console.warn(
                "WeekBox settings: could not read settings file.",
                error
              );
            }
            this.document = createDefaultDocument();
          }
          const legacyKeys = this.getLegacyKeys();
          if (!fileExists) this.migrateLegacySettings(legacyKeys);
          await this.write();
          this.removeLegacySettings(legacyKeys);
          await Neutralino.storage.setData(SETTINGS_PATH_KEY, dataPath);
          this.initialized = true;
        } catch (error) {
          console.warn("WeekBox settings: file storage is unavailable.", error);
        }
      },
      async setDataPath(dataPath) {
        if (!dataPath || this.path === `${dataPath}/${SETTINGS_FILE_NAME}`) return;
        this.path = `${dataPath}/${SETTINGS_FILE_NAME}`;
        await this.write();
        await Neutralino.storage.setData(SETTINGS_PATH_KEY, dataPath);
      },
      getLegacyKeys() {
        return Array.from(
          { length: localStorage.length },
          (_, index) => localStorage.key(index)
        ).filter((key) => key?.startsWith(LEGACY_PREFIX));
      },
      migrateLegacySettings(keys) {
        for (const key of keys) {
          const settingKey = key.slice(LEGACY_PREFIX.length);
          const definition = settingDefinitions[settingKey];
          if (!definition) continue;
          try {
            const value = JSON.parse(localStorage.getItem(key));
            if (isValidValue(definition, value)) {
              this.document.settings[settingKey] = { type: definition.type, value };
            }
          } catch {
          }
        }
      },
      removeLegacySettings(keys) {
        for (const key of keys) localStorage.removeItem(key);
      },
      get(key) {
        const definition = settingDefinitions[key];
        if (!definition) return void 0;
        const saved = this.document.settings[key];
        return saved && isValidValue(definition, saved.value) ? saved.value : definition.defaultValue;
      },
      set(key, value) {
        const definition = settingDefinitions[key];
        if (!definition) throw new Error(`Unknown setting: ${key}`);
        if (!isValidValue(definition, value)) {
          throw new TypeError(`Invalid value for setting: ${key}`);
        }
        this.document.settings[key] = { type: definition.type, value };
        if (this.initialized) this.write().catch(() => {
        });
        document.dispatchEvent(
          new CustomEvent("settings-changed", { detail: { key, value } })
        );
      },
      async write() {
        if (!this.path) return;
        const contents = `${JSON.stringify(this.document, null, 2)}
`;
        this.writeQueue = this.writeQueue.catch(() => {
        }).then(() => Neutralino.filesystem.writeFile(this.path, contents));
        return this.writeQueue;
      }
    };
  }
});

// app/src/backend/core/startupLoader.js
var screen, bar, label, title, startupLoader;
var init_startupLoader = __esm({
  "app/src/backend/core/startupLoader.js"() {
    screen = document.getElementById("startup-loading-screen");
    bar = document.getElementById("startup-loading-progress");
    label = document.getElementById("startup-loading-label");
    title = document.getElementById("startup-loading-title");
    startupLoader = {
      progress: 0,
      setPhase(message, progress) {
        if (label) label.textContent = message;
        if (bar) {
          const value = Math.max(
            this.progress,
            Math.min(100, Number(progress) || 0)
          );
          this.progress = value;
          bar.style.width = `${value}%`;
          bar.parentElement?.setAttribute("aria-valuenow", String(value));
        }
      },
      async complete() {
        this.setPhase("Ready", 100);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        screen?.classList.add("startup-loading-screen--complete");
        window.setTimeout(() => screen?.remove(), 240);
      },
      fail(message = "WeekBox could not start") {
        if (title) title.textContent = "Startup failed";
        this.setPhase(message, 100);
        screen?.classList.remove("startup-loading-screen--complete");
        screen?.classList.add("startup-loading-screen--failed");
        requestAnimationFrame(
          () => screen?.classList.add("startup-loading-screen--complete")
        );
        window.setTimeout(() => screen?.remove(), 200);
      }
    };
  }
});

// app/src/backend/core/windowsProtocol.js
function getExecutablePath() {
  return String(window.NL_ARGS?.[0] || "").trim().replace(/^"|"$/g, "");
}
function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}
function encodePowerShell(script) {
  const bytes = [];
  for (let index = 0; index < script.length; index += 1) {
    const code = script.charCodeAt(index);
    bytes.push(code & 255, code >> 8);
  }
  return btoa(String.fromCharCode(...bytes));
}
async function syncWindowsProtocolRegistration(enabled) {
  if (window.NL_OS !== "Windows") return true;
  const executablePath = getExecutablePath();
  if (!executablePath) {
    console.warn("Could not find the WeekBox executable path.");
    return false;
  }
  const key = quotePowerShell(PROTOCOL_KEY);
  const executable = quotePowerShell(executablePath);
  const script = enabled ? [
    `$key = ${key}`,
    `$exe = ${executable}`,
    `$command = '"' + $exe + '" "%1"'`,
    "New-Item -Path $key -Force | Out-Null",
    "Set-Item -Path $key -Value 'URL:WeekBox Protocol'",
    "New-ItemProperty -Path $key -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null",
    'New-Item -Path "$key\\DefaultIcon" -Force | Out-Null',
    `Set-Item -Path "$key\\DefaultIcon" -Value ($exe + ',0')`,
    'New-Item -Path "$key\\shell\\open\\command" -Force | Out-Null',
    'Set-Item -Path "$key\\shell\\open\\command" -Value $command'
  ].join("; ") : [
    `$key = ${key}`,
    `$exe = ${executable}`,
    `$expected = '"' + $exe + '" "%1"'`,
    '$commandKey = Get-Item -LiteralPath "$key\\shell\\open\\command" -ErrorAction SilentlyContinue',
    "if ($commandKey -and $commandKey.GetValue('') -eq $expected) { Remove-Item -LiteralPath $key -Recurse -Force }"
  ].join("; ");
  try {
    const encoded = encodePowerShell(script);
    const result = await Neutralino.os.execCommand(
      `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`
    );
    if (result.exitCode !== 0) {
      throw new Error(result.stdErr || "Windows protocol registration failed");
    }
    return true;
  } catch (error) {
    console.warn("Could not update the WeekBox link association", error);
    return false;
  }
}
var PROTOCOL_KEY;
var init_windowsProtocol = __esm({
  "app/src/backend/core/windowsProtocol.js"() {
    PROTOCOL_KEY = "HKCU:\\Software\\Classes\\weekbox";
    __name(getExecutablePath, "getExecutablePath");
    __name(quotePowerShell, "quotePowerShell");
    __name(encodePowerShell, "encodePowerShell");
    __name(syncWindowsProtocolRegistration, "syncWindowsProtocolRegistration");
  }
});

// app/src/backend/core/scripts.js
import { homeView, registerHomeView } from "../../ui/js/index.js";
import { registerEnginesView } from "../../ui/js/index.js";
import { downloadEngine } from "../../ui/js/index.js";
import { engineUpdateToast } from "../../ui/js/index.js";
import { toastDownloadMod } from "../../ui/js/index.js";
import { FS } from "../../ui/utils/index.js";
import { errorHandler } from "../../ui/js/index.js";
import { appUpdateModal } from "../../ui/js/index.js";
import { toastSystem } from "../../ui/js/index.js";
import { storageRecommendationModal } from "../../ui/js/index.js";
import { modManagerModal } from "../../ui/js/index.js";
import { diagnosticsConsentModal } from "../../ui/js/index.js";
import { firstRunStorageModal } from "../../ui/js/index.js";
var require_scripts = __commonJS({
  "app/src/backend/core/scripts.js"() {
    init_storagePatch();
    init_router();
    init_productionShortcuts();
    init_settings();
    init_deepLinks();
    init_appUpdater();
    init_startupLoader();
    init_networkStatus();
    init_windowsProtocol();
    function clearTestToasts() {
      document.querySelectorAll('[id^="engine-update-toast-"]').forEach((toast) => toast.remove());
      toastDownloadMod.toasts.forEach((toast) => toast.toast.remove());
      toastDownloadMod.toasts.clear();
      document.getElementById("toast-system-container")?.remove();
    }
    __name(clearTestToasts, "clearTestToasts");
    function testToasts() {
      clearTestToasts();
      engineUpdateToast.show("toast-test-progress", "Engine update");
      engineUpdateToast.update("toast-test-progress", {
        progress: 62,
        status: "Downloading update"
      });
      engineUpdateToast.show("toast-test-complete", "Engine update");
      engineUpdateToast.complete("toast-test-complete");
      engineUpdateToast.info(
        "toast-test-info",
        "Engine update",
        "Already up to date"
      );
      engineUpdateToast.offer(
        "toast-test-offer",
        "Engine update",
        "exe.png",
        () => {
        }
      );
      engineUpdateToast.show("toast-test-error", "Engine update");
      engineUpdateToast.error("toast-test-error");
      engineUpdateToast.missingEngine(
        "toast-test-missing",
        "Test Engine",
        "exe.png"
      );
      const showDownloadToast = /* @__PURE__ */ __name((id, name, outcome) => {
        toastDownloadMod.show(id, name);
        toastDownloadMod.update(id, 62, "Downloading...");
        if (outcome === "success") toastDownloadMod.success(id);
        if (outcome === "error") toastDownloadMod.error(id, "Test failure");
        if (outcome === "cancelled") toastDownloadMod.cancelAnim(id);
      }, "showDownloadToast");
      showDownloadToast("toast-test-download", "Download in progress");
      showDownloadToast("toast-test-success", "Completed download", "success");
      showDownloadToast("toast-test-error-download", "Failed download", "error");
      showDownloadToast("toast-test-cancelled", "Cancelled download", "cancelled");
    }
    __name(testToasts, "testToasts");
    window.weekboxDebug = {
      clearToasts: clearTestToasts,
      testToasts,
      openLink: openWeekboxLink,
      resetStorageRecommendation() {
        appSettings.set("storageMoveRecommendationDismissed", false);
        location.reload();
      }
    };
    function installGlobalErrorReporter() {
      if (window.__weekboxErrorReporterInstalled) return;
      window.__weekboxErrorReporterInstalled = true;
      window.addEventListener("error", (event) => {
        const error = event.error || event.message;
        console.error("[WeekBox] Unhandled error", error, {
          filename: event.filename,
          line: event.lineno,
          column: event.colno
        });
        if (!error) return;
        errorHandler.show({
          error,
          action: "Run WeekBox",
          storagePath: FS.weekboxPath
        });
      });
      window.addEventListener("unhandledrejection", (event) => {
        console.error("[WeekBox] Unhandled promise rejection", event.reason);
        errorHandler.show({
          error: event.reason,
          action: "Run WeekBox",
          storagePath: FS.weekboxPath
        });
      });
    }
    __name(installGlobalErrorReporter, "installGlobalErrorReporter");
    async function completeFirstRunStorageSetup(defaultStoragePath, hadSettings) {
      if (appSettings.get("firstRunStorageSetupComplete")) return;
      if (hadSettings) {
        appSettings.set("firstRunStorageSetupComplete", true);
        return;
      }
      const choice = await firstRunStorageModal.show(defaultStoragePath);
      let completed = choice === "default";
      if (choice === "new" || choice === "existing") {
        const selectedPath = await Neutralino.os.showFolderDialog(
          choice === "existing" ? "Choose an existing WeekBox folder or its parent folder" : "Choose the folder that will contain WeekBox",
          { defaultPath: FS.basePath }
        );
        if (selectedPath) {
          const existing = await FS.findExistingStorage(selectedPath);
          if (choice === "existing") {
            if (existing) {
              await FS.useExistingStorage(existing.basePath);
              completed = true;
            } else
              await Neutralino.os.showMessageBox(
                "WeekBox library not found",
                "That folder does not contain a complete WeekBox library. WeekBox will keep using the current folder.",
                "OK",
                "WARNING"
              );
          } else if (!existing) {
            await FS.moveStorageTo(selectedPath);
            completed = true;
          }
        }
      }
      if (completed) appSettings.set("firstRunStorageSetupComplete", true);
    }
    __name(completeFirstRunStorageSetup, "completeFirstRunStorageSetup");
    installGlobalErrorReporter();
    async function recommendSaferStorageLocation() {
      if (!await FS.shouldRecommendDefaultStorage()) return;
      const defaultPath = await FS.getDefaultStorageParentPath();
      const choice = await storageRecommendationModal.show({
        currentPath: FS.weekboxPath,
        defaultPath
      });
      if (choice === "dismiss") {
        appSettings.set("storageMoveRecommendationDismissed", true);
        return;
      }
      if (choice !== "move") return;
      const toastId = "weekbox-storage-recommendation";
      const lock = document.createElement("div");
      lock.id = "storage-move-lock";
      lock.className = "storage-move-lock";
      lock.setAttribute("aria-hidden", "true");
      document.body.appendChild(lock);
      toastSystem.show(toastId, {
        title: "Moving WeekBox files",
        message: "Preparing files\u2026",
        mediaHtml: '<i class="fa-solid fa-folder-open" aria-hidden="true"></i>',
        showPercent: true
      });
      try {
        await FS.moveStorageTo(
          defaultPath,
          ({ progress, copiedFiles, totalFiles }) => {
            toastSystem.update(toastId, {
              message: `Moving files (${copiedFiles} of ${totalFiles})`,
              progress
            });
          }
        );
        appSettings.set("storageParentPath", null);
        toastSystem.setState(toastId, "complete", {
          badgeHtml: '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        });
        toastSystem.update(toastId, {
          message: "WeekBox files moved",
          progress: 100
        });
        setTimeout(() => toastSystem.hide(toastId), 3600);
      } catch (error) {
        toastSystem.setState(toastId, "error", {
          badgeHtml: '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        });
        toastSystem.update(toastId, {
          message: error.message || "Could not move WeekBox files.",
          progress: 100
        });
      } finally {
        lock.remove();
      }
    }
    __name(recommendSaferStorageLocation, "recommendSaferStorageLocation");
    async function offerNestedStorageRepair() {
      const targetParentPath = await FS.getNestedStorageRepairTarget();
      if (!targetParentPath) return;
      const choice = await Neutralino.os.showMessageBox(
        "Repair WeekBox folder location?",
        `WeekBox found an accidental nested folder:
${FS.weekboxPath}

It can safely move the inner files to:
${FS.basePath}

No files will be merged because the outer folder contains only this inner WeekBox folder.`,
        "YES_NO",
        "QUESTION"
      );
      if (choice !== "YES") return;
      const toastId = "weekbox-nested-storage-repair";
      toastSystem.show(toastId, {
        title: "Repairing WeekBox folder",
        message: "Preparing files\u2026",
        mediaHtml: '<i class="fa-solid fa-folder-open" aria-hidden="true"></i>',
        showPercent: true
      });
      try {
        await FS.moveStorageTo(
          targetParentPath,
          ({ progress, copiedFiles, totalFiles }) => {
            toastSystem.update(toastId, {
              message: `Moving files (${copiedFiles} of ${totalFiles})`,
              progress
            });
          }
        );
        toastSystem.setState(toastId, "complete", {
          badgeHtml: '<i class="fa-solid fa-check" aria-hidden="true"></i>'
        });
        toastSystem.update(toastId, {
          message: "WeekBox folder repaired",
          progress: 100
        });
        setTimeout(() => toastSystem.hide(toastId), 3600);
      } catch (error) {
        toastSystem.setState(toastId, "error", {
          badgeHtml: '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        });
        toastSystem.update(toastId, {
          message: error.message || "Could not repair WeekBox files.",
          progress: 100
        });
      }
    }
    __name(offerNestedStorageRepair, "offerNestedStorageRepair");
    async function startApp() {
      let startupStep = "starting native services";
      try {
        startupLoader.setPhase("Starting WeekBox services\u2026", 8);
        Neutralino.init();
        networkStatus.init();
        await Neutralino.window.focus().catch(() => {
        });
        const setWindowFocus = /* @__PURE__ */ __name((isFocused) => {
          if (isFocused) {
            document.body.classList.remove("window-unfocused");
          } else if (appSettings.get("blurOutOfFocus")) {
            document.body.classList.add("window-unfocused");
          }
        }, "setWindowFocus");
        Neutralino.events.on("windowBlur", () => setWindowFocus(false));
        Neutralino.events.on("windowFocus", () => setWindowFocus(true));
        window.addEventListener("focus", () => setWindowFocus(true));
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) setWindowFocus(true);
        });
        disableProductionRefreshShortcuts();
        Neutralino.events.on("windowClose", async () => {
          await downloadEngine.cleanupAll();
          await Neutralino.app.exit();
        });
        startupLoader.setPhase("Loading your preferences\u2026", 20);
        startupStep = "restoring preferences";
        await storageBridge.init();
        startupStep = "finding the default storage location";
        const defaultStoragePath = await FS.getDefaultStorageParentPath();
        const defaultDataPath = `${defaultStoragePath}/WeekBox/data`;
        startupStep = "reading saved settings";
        const settingsDataPath = await appSettings.resolveDataPath(defaultDataPath);
        const hadSettings = await FS.api.exists(
          `${settingsDataPath}/settings.json`
        );
        await appSettings.init(settingsDataPath);
        await syncWindowsProtocolRegistration(
          appSettings.get("registerProtocolLinks")
        );
        startupLoader.setPhase("Opening your WeekBox library\u2026", 42);
        startupStep = "preparing the WeekBox library";
        await FS.init({ deferMaintenance: true });
        await appSettings.setDataPath(FS.dataPath);
        try {
          await completeFirstRunStorageSetup(defaultStoragePath, hadSettings);
        } catch (error) {
          console.warn("Could not finish first-run storage setup", error);
        }
        startupLoader.setPhase("Loading navigation and engines\u2026", 64);
        registerHomeView();
        registerEnginesView();
        await router.init();
        startupLoader.setPhase("Preparing Mod Manager\u2026", 70);
        const modManagerReady = modManagerModal.preload();
        startupLoader.setPhase("Loading Home content\u2026", 72);
        const maintenance = FS.startBackgroundMaintenance({
          onProgress: /* @__PURE__ */ __name((message, progress) => startupLoader.setPhase(message, progress), "onProgress")
        });
        await Promise.all([homeView.ready, modManagerReady]);
        startupLoader.setPhase("Checking your library\u2026", 89);
        await maintenance;
        await startupLoader.complete();
        await diagnosticsConsentModal.showIfNeeded();
        await offerNestedStorageRepair();
        await openLaunchDeepLink();
        await recommendSaferStorageLocation();
        if (networkStatus.online && appSettings.get("checkAppUpdatesOnStartup")) {
          appUpdater.check().then((update) => {
            if (update.status !== "available") return;
            try {
              sessionStorage.setItem(
                "weekbox_available_app_update",
                JSON.stringify(update)
              );
            } catch {
            }
            document.dispatchEvent(
              new CustomEvent("app-update-available", { detail: update })
            );
            appUpdateModal.show(update);
          }).catch(() => {
          });
        }
        console.log("WeekBox: modules loaded.");
      } catch (error) {
        const message = error?.message || String(error);
        const startupError = new Error(
          `WeekBox could not finish ${startupStep}: ${message}`
        );
        startupLoader.fail("Could not start WeekBox");
        console.error("Startup error:", error);
        try {
          errorHandler.show({
            error: startupError,
            action: "Start WeekBox",
            storagePath: FS.weekboxPath
          });
        } catch (reportingError) {
          console.error("Could not show startup error report:", reportingError);
        }
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
          mainContent.replaceChildren();
          const errorView = document.createElement("div");
          errorView.style.cssText = "padding: 24px; color: #ff4a4a;";
          const heading = document.createElement("h2");
          heading.textContent = "Load error";
          const message2 = document.createElement("p");
          message2.textContent = error instanceof Error ? error.message : "See the technical details in the error report.";
          errorView.append(heading, message2);
          mainContent.appendChild(errorView);
        }
      }
    }
    __name(startApp, "startApp");
    startApp();
  }
});

// app/src/backend/core/temp_entry.js
var temp_entry_exports = {};
__export(temp_entry_exports, {
  appEvents: () => appEvents,
  appSettings: () => appSettings,
  appUpdater: () => appUpdater,
  compareVersions: () => compareVersions,
  disableProductionRefreshShortcuts: () => disableProductionRefreshShortcuts,
  emitViewChange: () => emitViewChange,
  getPlatformPackage: () => getPlatformPackage,
  getReleaseAsset: () => getReleaseAsset,
  getResourcesAsset: () => getResourcesAsset,
  getSelectedEngine: () => getSelectedEngine,
  getWindowsPackage: () => getWindowsPackage,
  networkStatus: () => networkStatus,
  normalizeVersion: () => normalizeVersion,
  openLaunchDeepLink: () => openLaunchDeepLink,
  openWeekboxLink: () => openWeekboxLink,
  router: () => router,
  setSelectedEngine: () => setSelectedEngine,
  startupLoader: () => startupLoader,
  storageBridge: () => storageBridge,
  syncWindowsProtocolRegistration: () => syncWindowsProtocolRegistration
});
init_appUpdater();
init_deepLinks();
init_events();
init_networkStatus();
init_productionShortcuts();
init_router();
__reExport(temp_entry_exports, __toESM(require_scripts()));
init_settings();
init_startupLoader();

// app/src/backend/core/state.js
var selectedEngine = null;
function setSelectedEngine(engine) {
  selectedEngine = engine;
}
__name(setSelectedEngine, "setSelectedEngine");
function getSelectedEngine() {
  return selectedEngine;
}
__name(getSelectedEngine, "getSelectedEngine");

// app/src/backend/core/temp_entry.js
init_storagePatch();
init_releaseAssets();
init_versioning();
init_windowsProtocol();
export {
  appEvents,
  appSettings,
  appUpdater,
  compareVersions,
  disableProductionRefreshShortcuts,
  emitViewChange,
  getPlatformPackage,
  getReleaseAsset,
  getResourcesAsset,
  getSelectedEngine,
  getWindowsPackage,
  networkStatus,
  normalizeVersion,
  openLaunchDeepLink,
  openWeekboxLink,
  router,
  setSelectedEngine,
  startupLoader,
  storageBridge,
  syncWindowsProtocolRegistration
};
