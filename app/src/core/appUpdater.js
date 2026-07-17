import { downloadArchive } from "../utils/downloads/archiveTransfer.js";

const RELEASES_API =
  "https://api.github.com/repos/Crew-Awesome/Weekbox/releases/latest";
const UPDATE_DIRECTORY = ".weekbox-update";

function normalizeVersion(value) {
  return String(value || "")
    .trim()
    .replace(/^v/i, "")
    .split("-")[0];
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

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function quotePowerShellString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function quoteShellString(value) {
  const escaped = String(value).replaceAll("'", "'\"'\"'");
  return `'${escaped}'`;
}

function encodePowerShellScript(script) {
  const bytes = new Uint8Array(script.length * 2);
  for (let index = 0; index < script.length; index += 1) {
    const code = script.charCodeAt(index);
    bytes[index * 2] = code & 0xff;
    bytes[index * 2 + 1] = code >> 8;
  }
  return btoa(String.fromCharCode(...bytes));
}

function createWindowsApplyScript({ appPath, archivePath, expectedDigest }) {
  return `$ErrorActionPreference='Stop'
$target=${quotePowerShellString(appPath)}
$archive=${quotePowerShellString(archivePath)}
$expectedHash=${quotePowerShellString(expectedDigest)}
$processId=${Number(window.NL_PID)}
while (Get-Process -Id $processId -ErrorAction SilentlyContinue) { Start-Sleep -Milliseconds 250 }
$actualHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) { throw 'Downloaded update failed its integrity check.' }
$staging=Join-Path $target '.weekbox-update-staging'
Remove-Item -LiteralPath $staging -Force -Recurse -ErrorAction SilentlyContinue
Expand-Archive -LiteralPath $archive -DestinationPath $staging -Force
$sourceBinary=Join-Path $staging 'WeekBox-win_x64.exe'
$sourceResources=Join-Path $staging 'resources.neu'
if (!(Test-Path -LiteralPath $sourceBinary) -or !(Test-Path -LiteralPath $sourceResources)) { throw 'The update package is missing required WeekBox files.' }
$targetBinary=@('WeekBox-win_x64.exe','WeekBox.exe') | ForEach-Object { $candidate=Join-Path $target $_; if (Test-Path -LiteralPath $candidate) { $candidate; break } }
if (!$targetBinary) { $targetBinary=Join-Path $target 'WeekBox-win_x64.exe' }
$copyAttempts=0
while ($true) {
  try {
    Copy-Item -LiteralPath $sourceBinary -Destination $targetBinary -Force
    break
  } catch {
    $copyAttempts++
    if ($copyAttempts -ge 40) { throw }
    Start-Sleep -Milliseconds 250
  }
}
Copy-Item -LiteralPath $sourceResources -Destination (Join-Path $target 'resources.neu') -Force
Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $staging -Force -Recurse -ErrorAction SilentlyContinue
Start-Process -FilePath $targetBinary -WorkingDirectory $target`;
}

function createUnixApplyScript({
  appPath,
  archivePath,
  expectedDigest,
  binaryName,
}) {
  const target = quoteShellString(appPath);
  const archive = quoteShellString(archivePath);
  const staging = quoteShellString(`${appPath}/.weekbox-update-staging`);
  const sourceBinary = quoteShellString(
    `${appPath}/.weekbox-update-staging/${binaryName}`,
  );
  const sourceResources = quoteShellString(
    `${appPath}/.weekbox-update-staging/resources.neu`,
  );
  const targetBinary = quoteShellString(`${appPath}/${binaryName}`);
  const targetResources = quoteShellString(`${appPath}/resources.neu`);

  return `#!/bin/sh
set -eu
target=${target}
archive=${archive}
expected_hash=${quoteShellString(expectedDigest)}
while kill -0 ${Number(window.NL_PID)} 2>/dev/null; do sleep 1; done
if command -v sha256sum >/dev/null 2>&1; then actual_hash=$(sha256sum "$archive" | awk '{print $1}'); else actual_hash=$(shasum -a 256 "$archive" | awk '{print $1}'); fi
[ "$actual_hash" = "$expected_hash" ] || { echo 'Downloaded update failed its integrity check.' >&2; exit 1; }
staging=${staging}
rm -rf "$staging"
unzip -qo "$archive" -d "$staging"
source_binary=${sourceBinary}
source_resources=${sourceResources}
[ -f "$source_binary" ] && [ -f "$source_resources" ] || { echo 'The update package is missing required WeekBox files.' >&2; exit 1; }
target_binary=${targetBinary}
cp "$source_binary" "$target_binary"
chmod 755 "$target_binary"
cp "$source_resources" ${targetResources}
rm -f "$archive"
rm -rf "$staging"
"$target_binary" >/dev/null 2>&1 &`;
}

async function getCurrentVersion() {
  const config = await Neutralino.app.getConfig();
  return config.version || "0.0.0";
}

function getPlatformPackage() {
  if (window.NL_OS === "Windows") {
    return { asset: "windows-x64", binary: "WeekBox-win_x64.exe" };
  }
  if (window.NL_OS === "Linux") {
    const architecture =
      window.NL_ARCH === "arm64"
        ? "arm64"
        : window.NL_ARCH === "armhf" || window.NL_ARCH === "arm"
          ? "armhf"
          : "x64";
    return {
      asset: `linux-${architecture}`,
      binary: `WeekBox-linux_${architecture}`,
    };
  }
  if (window.NL_OS === "Darwin") {
    const architecture = window.NL_ARCH === "arm64" ? "arm64" : "x64";
    return {
      asset: `macos-${architecture}`,
      binary: `WeekBox-mac_${architecture}`,
    };
  }
  return null;
}

function getReleaseAsset(release, platform) {
  const expression = new RegExp(
    `^WeekBox-\\d+(?:\\.\\d+)*-${platform.asset.replaceAll("-", "\\-")}\\.zip$`,
    "i",
  );
  return (release.assets || []).find((asset) =>
    expression.test(asset.name || ""),
  );
}

export const appUpdater = {
  async check() {
    const platform = getPlatformPackage();
    if (!platform) {
      return {
        status: "unsupported",
        message: "Automatic updates are not available for this platform.",
      };
    }

    const [release, currentVersion] = await Promise.all([
      fetch(RELEASES_API, {
        headers: { Accept: "application/vnd.github+json" },
      }).then(async (response) => {
        if (!response.ok)
          throw new Error(
            `Update check failed: GitHub returned ${response.status}`,
          );
        return response.json();
      }),
      getCurrentVersion(),
    ]);
    const asset = getReleaseAsset(release, platform);
    const latestVersion = normalizeVersion(release.tag_name);

    if (!asset || !latestVersion) {
      throw new Error(
        `The latest WeekBox release has no update package for ${window.NL_OS}.`,
      );
    }
    if (compareVersions(latestVersion, currentVersion) <= 0) {
      return { status: "current", currentVersion, latestVersion };
    }
    if (!/^sha256:[a-f0-9]{64}$/i.test(asset.digest || "")) {
      throw new Error(
        "The latest WeekBox release has no valid SHA-256 digest.",
      );
    }

    return { status: "available", currentVersion, latestVersion, asset };
  },

  async install(update, onProgress = () => {}) {
    const platform = getPlatformPackage();
    if (!platform)
      throw new Error("Automatic updates are not available for this platform.");
    if (!update?.asset)
      throw new Error("No WeekBox update is ready to install.");

    const updatePath = `${window.NL_PATH}/${UPDATE_DIRECTORY}`;
    const archivePath = `${updatePath}/${update.asset.name}`;
    const expectedDigest = update.asset.digest
      .slice("sha256:".length)
      .toLowerCase();
    await Neutralino.filesystem.createDirectory(updatePath).catch(() => {});

    onProgress("Downloading update…");
    await downloadArchive({
      url: update.asset.browser_download_url,
      outPath: archivePath,
      getTask: () => null,
      onProgress: (status) => onProgress(status),
    });
    const data = await Neutralino.filesystem.readBinaryFile(archivePath);

    onProgress("Verifying update…");
    const actualDigest = toHex(await crypto.subtle.digest("SHA-256", data));
    if (actualDigest !== expectedDigest) {
      throw new Error("Downloaded update failed its integrity check.");
    }
    onProgress("Restarting WeekBox to apply update…");
    const command =
      window.NL_OS === "Windows"
        ? `powershell -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand ${encodePowerShellScript(createWindowsApplyScript({ appPath: window.NL_PATH, archivePath, expectedDigest }))}`
        : `/bin/sh -c ${quoteShellString(createUnixApplyScript({ appPath: window.NL_PATH, archivePath, expectedDigest, binaryName: platform.binary }))} >/dev/null 2>&1 &`;
    await Neutralino.os.execCommand(command, {
      background: true,
    });
    await Neutralino.app.exit();
  },
};
