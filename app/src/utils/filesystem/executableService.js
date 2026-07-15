import { getParentPath, getRealEntries } from "./pathUtils.js";

export class ExecutableService {
  async find(dir) {
    try {
      const isWindows = window.NL_OS === "Windows";
      const directories = [dir];

      while (directories.length > 0) {
        const currentDir = directories.pop();
        const entries = getRealEntries(
          await Neutralino.filesystem.readDirectory(currentDir),
        );

        for (const entry of entries) {
          const fullPath = `${currentDir}/${entry.entry}`;
          if (entry.type === "DIRECTORY") {
            directories.push(fullPath);
            continue;
          }
          if (
            entry.type === "FILE" &&
            ((isWindows && entry.entry.toLowerCase().endsWith(".exe")) ||
              (!isWindows && !entry.entry.includes(".")))
          ) {
            return fullPath;
          }
        }
      }
    } catch (error) {}

    return null;
  }

  getDirectory(executablePath) {
    return getParentPath(executablePath);
  }

  async getIconDataUrl(executablePath) {
    try {
      const executableDir = this.getDirectory(executablePath);
      const entries = await Neutralino.filesystem.readDirectory(executableDir);
      const icon = entries.find(
        (entry) =>
          entry.type === "FILE" && entry.entry.toLowerCase().endsWith(".ico"),
      );
      if (!icon) return "";

      const data = await Neutralino.filesystem.readBinaryFile(
        `${executableDir}/${icon.entry}`,
      );
      const bytes = new Uint8Array(data);
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return `data:image/x-icon;base64,${window.btoa(binary)}`;
    } catch (error) {
      return "";
    }
  }
}
