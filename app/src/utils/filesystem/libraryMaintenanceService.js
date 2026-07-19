import {
  getModFolderName,
  getRealEntries,
  sanitizePathSegment,
} from "./pathUtils.js";

function sameId(left, right) {
  return String(left) === String(right);
}

function getStableUrlId(url) {
  let hash = 5381;
  for (const char of String(url)) hash = (hash * 33) ^ char.charCodeAt(0);
  return (hash >>> 0).toString(36);
}

function getImportedPsychOnlineMetadata(folderName, downloadUrl) {
  const parsed = new URL(downloadUrl);
  const isSniro = parsed.hostname.toLowerCase() === "funkin.sniro.boo";
  const sourceId = isSniro
    ? parsed.pathname.match(/^\/mod\/([^/]+)\/dl\//)?.[1]
    : null;
  return {
    id: sourceId
      ? `sniro:${sourceId}`
      : `psychonline:${getStableUrlId(downloadUrl)}`,
    name: folderName,
    engineId: "psychonline",
    engineLocked: true,
    source: isSniro ? "sniro" : "gamebanana",
    sourceUrl: isSniro ? "https://funkin.sniro.boo/mods" : downloadUrl,
    downloadUrl,
    folderName,
  };
}

export class LibraryMaintenanceService {
  constructor({
    api,
    mods,
    injection,
    getEnginesPath,
    getModsPath,
    getInstalledEngines,
    isEngineRunning,
  }) {
    Object.assign(this, {
      api,
      mods,
      injection,
      getEnginesPath,
      getModsPath,
      getInstalledEngines,
      isEngineRunning,
    });
  }

  async cleanupHiddenModLinks() {
    const hiddenMods = (await this.mods.getAll()).filter((mod) => mod.hidden);
    if (!hiddenMods.length) return;
    const engines = await this.getInstalledEngines();
    await Promise.all(
      hiddenMods.map((mod) =>
        this.injection.unlinkFromInstalledEngines(mod, engines),
      ),
    );
  }

  async importPsychOnlineEngineMods() {
    const engines = await this.getInstalledEngines();
    const installedMods = await this.mods.getAll();
    for (const engine of engines.filter((item) => item.id === "psychonline")) {
      if (this.isEngineRunning(engine.id, engine.version)) continue;
      const engineModsPath = `${this.getEnginesPath()}/${engine.id}/${engine.version}/mods`;
      let entries;
      try {
        entries = getRealEntries(
          await Neutralino.filesystem.readDirectory(engineModsPath),
        );
      } catch {
        continue;
      }
      for (const entry of entries.filter((item) => item.type === "DIRECTORY")) {
        const folderName = sanitizePathSegment(entry.entry);
        if (!folderName) continue;
        const existing = installedMods.find(
          (mod) => getModFolderName(mod) === folderName,
        );
        if (existing) {
          if (!existing.hidden)
            await this.injection.link(existing, engine.id, engine.version);
          continue;
        }
        const sourcePath = `${engineModsPath}/${entry.entry}`;
        const urlPath = `${sourcePath}/mod_url.txt`;
        if (!(await this.api.exists(urlPath))) continue;
        const downloadUrl = (await this.api.read(urlPath)).trim();
        if (!/^https?:\/\//i.test(downloadUrl)) continue;
        const destinationPath = `${this.getModsPath()}/${folderName}`;
        if (await this.api.exists(destinationPath)) continue;
        let metadata;
        try {
          metadata = getImportedPsychOnlineMetadata(folderName, downloadUrl);
        } catch {
          continue;
        }
        if (installedMods.some((mod) => sameId(mod.id, metadata.id))) continue;
        await Neutralino.filesystem.move(sourcePath, destinationPath);
        await this.mods.add(metadata.id, metadata.name, metadata);
        installedMods.push({ ...metadata, hidden: false });
        await this.injection.link(metadata, engine.id, engine.version);
      }
    }
  }

  async cleanupIncompleteDownloads() {
    try {
      const enginesPath = this.getEnginesPath();
      const engines = await Neutralino.filesystem.readDirectory(enginesPath);
      for (const engine of getRealEntries(engines)) {
        if (
          engine.type === "FILE" &&
          /^temp_.*\.(?:zip|dmg)$/.test(engine.entry)
        ) {
          await this.api
            .remove(`${enginesPath}/${engine.entry}`)
            .catch(() => {});
          continue;
        }
        if (engine.type !== "DIRECTORY") continue;
        const versions = await Neutralino.filesystem.readDirectory(
          `${enginesPath}/${engine.entry}`,
        );
        for (const version of getRealEntries(versions)) {
          if (version.type !== "DIRECTORY") continue;
          const versionPath = `${enginesPath}/${engine.entry}/${version.entry}`;
          if (!(await this.api.exists(`${versionPath}/.downloading`))) continue;
          const command =
            window.NL_OS === "Windows"
              ? `rmdir /S /Q "${versionPath.replace(/\//g, "\\")}"`
              : `rm -rf "${versionPath}"`;
          await Neutralino.os
            .execCommand(command, { background: true })
            .catch(() => {});
        }
      }
    } catch (error) {
      console.warn("Could not clean up incomplete downloads", error);
    }
  }

  async hasModFiles(mod) {
    const folderName = getModFolderName(mod);
    if (!folderName || /[\\/]/.test(folderName)) return false;
    const hasFilesIn = async (path) => {
      const entries = getRealEntries(
        await Neutralino.filesystem.readDirectory(path),
      );
      for (const entry of entries) {
        if (entry.entry === ".downloading") continue;
        if (entry.type === "FILE") return true;
        if (
          entry.type === "DIRECTORY" &&
          (await hasFilesIn(`${path}/${entry.entry}`))
        )
          return true;
      }
      return false;
    };
    try {
      return await hasFilesIn(`${this.getModsPath()}/${folderName}`);
    } catch {
      return false;
    }
  }

  async cleanupInvalidInstalledMods() {
    for (const mod of await this.mods.getAll()) {
      if (await this.hasModFiles(mod)) continue;
      const folderName = getModFolderName(mod);
      if (folderName && !/[\\/]/.test(folderName)) {
        await this.api
          .remove(`${this.getModsPath()}/${folderName}`)
          .catch(() => {});
      }
      await this.mods.remove(mod.id);
    }
  }
}
