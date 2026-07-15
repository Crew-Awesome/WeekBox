export class ProcessService {
  constructor(executables) {
    this.executables = executables;
    this.activeProcesses = new Map();
  }

  async launch(key, executablePath, onStateChange, args = []) {
    if (this.activeProcesses.has(key)) {
      onStateChange?.("already_running");
      return false;
    }

    try {
      onStateChange?.("running");
      const command = [
        `"${executablePath}"`,
        ...args.map((arg) => `"${String(arg).replaceAll('"', '\\"')}"`),
      ].join(" ");
      const process = await Neutralino.os.spawnProcess(command, {
        cwd: this.executables.getDirectory(executablePath),
      });
      this.activeProcesses.set(key, process);
      const handler = (event) => {
        if (event.detail.id !== process.id || event.detail.action !== "exit")
          return;
        Neutralino.events.off("spawnedProcess", handler);
        this.activeProcesses.delete(key);
        onStateChange?.("completed");
      };
      await Neutralino.events.on("spawnedProcess", handler);
      onStateChange?.("launched");
      return true;
    } catch (error) {
      onStateChange?.("error");
      return false;
    }
  }

  async close(key, onStateChange) {
    const process = this.activeProcesses.get(key);
    if (!process) return false;
    onStateChange?.("closing");
    try {
      await Neutralino.os.updateSpawnedProcess(process.id, "exit");
      return true;
    } catch (error) {
      onStateChange?.("error");
      return false;
    }
  }

  isRunning(key) {
    return this.activeProcesses.has(key);
  }
}
