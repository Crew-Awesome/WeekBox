// ui/engines/downloadEngine.js
import { FS } from "../../utils/filesystem.js";

export const downloadEngine = {
  activeTasks: new Map(),
  
  getTaskKey(engineId, version) {
    return `${engineId}:${version}`;
  },

  async stopProcess(task) {
    if (!task?.pid) return;
    const command =
      window.NL_OS === "Windows"
        ? `taskkill /T /F /PID ${task.pid}`
        : `kill -TERM ${task.pid}`;
    try {
      await Neutralino.os.execCommand(command, { background: false });
    } catch (error) {
      console.warn("Could not stop engine install process:", error);
    }
  },

  notifyState(task, state) {
    task.state = state;
    task.onStateChange?.(state);
  },

  async cleanupTask(task) {
    await this.stopProcess(task);
    
    // 1. Elimina el Zip temporal si existe
    await FS.api.remove(task.tempFilePath).catch(() => {});
    
    // 2. Usamos comandos del OS para borrar recursivamente la carpeta y sus archivos
    const vPath = task.engineDir;
    try {
      if (window.NL_OS === 'Windows') {
        await Neutralino.os.execCommand(`rmdir /S /Q "${vPath.replace(/\//g, '\\')}"`, { background: true }).catch(() => {});
      } else {
        await Neutralino.os.execCommand(`rm -rf "${vPath}"`, { background: true }).catch(() => {});
      }
    } catch (e) {}
  },

  async cancel(engineId, version) {
    const key = this.getTaskKey(engineId, version);
    const task = this.activeTasks.get(key);
    if (!task) return;
    task.cancelled = true;
    this.notifyState(task, "cancelled");
    await this.cleanupTask(task);
  },

  async cleanupAll() {
    await Promise.all(
      [...this.activeTasks.entries()].map(async ([key, task]) => {
        task.cancelled = true;
        await this.cleanupTask(task);
      }),
    );
  },

  async install(engineId, version, downloadUrl, onProgress, onStateChange) {
    if (!FS.isInitialized) await FS.init();
    const enginesBasePath = FS.enginesPath;
    const engineDir = `${enginesBasePath}/${engineId}/${version}`;
    const tempFilePath = `${enginesBasePath}/temp_${engineId}_${version}.zip`;
    const taskKey = this.getTaskKey(engineId, version);
    
    if (this.activeTasks.has(taskKey)) return false;
    
    const task = {
      cancelled: false,
      pid: null,
      tempFilePath,
      engineDir,
      phase: "downloading",
      onStateChange,
    };
    this.activeTasks.set(taskKey, task);
    
    const updateProgress = (status, progress) => {
      if (typeof onProgress === "function") {
        onProgress({ status, progress });
      }
    };
    
    try {
      this.notifyState(task, "downloading");
      updateProgress("Preparing environment...", 0);
      await FS.api.ensureDir(enginesBasePath);
      await FS.api.ensureDir(`${enginesBasePath}/${engineId}`);
      await FS.api.ensureDir(engineDir);
      
      // MARCADOR DE DESCARGA ACTIVA (Nos sirve para limpiar si se cierra bruscamente)
      await FS.api.write(`${engineDir}/.downloading`, "1");

      const os = window.NL_OS;
      
      // 1. Fase de Descarga
      updateProgress("Connecting...", 2);
      await this.downloadWithProgress(
        downloadUrl,
        tempFilePath,
        updateProgress,
      );
      
      // 2. Fase de Extracción
      task.phase = "extracting";
      this.notifyState(task, "installing");
      updateProgress("Installing...", 98);
      await this.extractWithProgress(
        tempFilePath,
        engineDir,
        os,
        updateProgress,
      );
      
      // 3. Limpieza final
      updateProgress("Cleaning temporary files...", 99);
      await FS.api.remove(tempFilePath).catch(() => {});
      await FS.api.remove(`${engineDir}/.downloading`).catch(() => {}); // Eliminamos el marcador

      const injectionResults = await FS.injectModsIntoEngine(engineId, version);
      injectionResults
        .filter((result) => result.status === "rejected")
        .forEach((result) =>
          console.warn("Could not inject installed mod:", result.reason),
        );
        
      updateProgress("Completed", 100);
      this.notifyState(task, "completed");
      this.activeTasks.delete(taskKey);
      
      return true;
    } catch (error) {
      if (!task.cancelled)
        console.error(`Error installing engine ${engineId}:`, error);
        
      // Intentamos eliminar el temporal
      await FS.api.remove(tempFilePath).catch(() => {});
      
      // Si la descarga fracasó o se canceló, aseguramos borrar la carpeta de archivos parciales.
      try {
        if (window.NL_OS === 'Windows') {
          await Neutralino.os.execCommand(`rmdir /S /Q "${engineDir.replace(/\//g, '\\')}"`, { background: true });
        } else {
          await Neutralino.os.execCommand(`rm -rf "${engineDir}"`, { background: true });
        }
      } catch (e) {}

      if (!task.cancelled) {
        this.notifyState(task, "error");
      }
      
      this.activeTasks.delete(taskKey);
      return false;
    }
  },

  async downloadWithProgress(url, outPath, updateProgress) {
    return new Promise(async (resolve, reject) => {
      try {
        let maxPercent = 0;
        const process = await Neutralino.os.spawnProcess(
          `curl -# -L "${url}" -o "${outPath}"`,
        );
        const task = [...this.activeTasks.values()].find(
          (activeTask) => activeTask.tempFilePath === outPath,
        );
        if (task) task.pid = process.pid;
        const handler = (event) => {
          if (event.detail.id === process.id) {
            if (task?.cancelled) {
              Neutralino.events.off("spawnedProcess", handler);
              reject(new Error("Cancelled"));
              return;
            }
            const action = event.detail.action;
            if (action === "stdErr" || action === "stdOut") {
              const output = event.detail.data;
              const matches = output.match(/(\d+\.?\d*)%/g);
              if (matches && matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const percent = parseFloat(lastMatch.replace("%", ""));
                if (!isNaN(percent) && percent >= maxPercent) {
                  maxPercent = percent;
                  const globalProgress = 2 + percent * 0.96;
                  updateProgress(`Downloading...`, globalProgress);
                }
              }
            } else if (action === "exit") {
              Neutralino.events.off("spawnedProcess", handler);
              if (event.detail.data === 0) resolve();
              else
                reject(
                  new Error(
                    `Download failed with exit code ${event.detail.data}`,
                  ),
                );
            }
          }
        };
        await Neutralino.events.on("spawnedProcess", handler);
      } catch (error) {
        reject(error);
      }
    });
  },

  async extractWithProgress(zipPath, destPath, os, updateProgress) {
    return new Promise(async (resolve, reject) => {
      let cmd = "";
      if (os === "Windows") {
        // tar es mucho más rápido que PowerShell y nos permite ver los archivos
        cmd = `tar -xvf "${zipPath}" -C "${destPath}"`;
      } else {
        cmd = `unzip -o "${zipPath}" -d "${destPath}"`;
      }
      try {
        const process = await Neutralino.os.spawnProcess(cmd);
        const task = [...this.activeTasks.values()].find(
          (activeTask) => activeTask.engineDir === destPath,
        );
        if (task) task.pid = process.pid;
        const handler = (event) => {
          if (event.detail.id === process.id) {
            if (task?.cancelled) {
              Neutralino.events.off("spawnedProcess", handler);
              reject(new Error("Cancelled"));
              return;
            }
            const action = event.detail.action;
            if (action === "stdOut" || action === "stdErr") {
              const output = event.detail.data.trim();
              if (output) {
                const lines = output.split("\n");
                const lastLine = lines[lines.length - 1].trim();
                // Limpiamos la salida dependiendo de si es tar o unzip
                let fileName = lastLine
                  .replace(/^x\s+/, "") // de 'tar'
                  .replace(/^inflating:\s+/, "") // de 'unzip'
                  .replace(/^extracting:\s+/, "")
                  .replace(/^creating:\s+/, "")
                  .trim();
                const pathParts = fileName.split(/[/\\]/);
                if (pathParts.length > 2) {
                  fileName = `.../${pathParts.slice(-2).join("/")}`;
                }
                updateProgress(`Extracting: ${fileName}`, 98);
              }
            } else if (action === "exit") {
              Neutralino.events.off("spawnedProcess", handler);
              const code = event.detail.data;
              if (code === 0 || (os === "Windows" && code === 1)) {
                resolve();
              } else {
                reject(new Error(`Extraction failed with exit code ${code}`));
              }
            }
          }
        };
        await Neutralino.events.on("spawnedProcess", handler);
      } catch (err) {
        reject(err);
      }
    });
  },
};