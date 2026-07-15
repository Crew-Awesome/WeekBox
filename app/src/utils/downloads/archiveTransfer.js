function formatArchiveEntry(output) {
  const lines = output.trim().split("\n");
  let name = lines[lines.length - 1]
    .trim()
    .replace(/^x\s+/, "")
    .replace(/^inflating:\s+/, "")
    .replace(/^extracting:\s+/, "")
    .replace(/^creating:\s+/, "")
    .trim();
  const parts = name.split(/[/\\]/);
  if (parts.length > 2) name = `.../${parts.slice(-2).join("/")}`;
  return name;
}

function listenForProcess(process, getTask, onEvent) {
  return new Promise(async (resolve, reject) => {
    const handler = (event) => {
      const task = getTask();
      if (task?.cancelled) {
        Neutralino.events.off("spawnedProcess", handler);
        reject(new Error("Cancelled"));
        return;
      }
      if (event.detail.id !== process.id) return;
      onEvent(event.detail, handler, resolve, reject);
    };
    try {
      await Neutralino.events.on("spawnedProcess", handler);
    } catch (error) {
      reject(error);
    }
  });
}

export async function downloadArchive({ url, outPath, getTask, onProgress }) {
  const process = await Neutralino.os.spawnProcess(
    `curl -# -L "${url}" -o "${outPath}"`,
  );
  const task = getTask();
  if (task) task.pid = process.id ?? process.pid;

  let maxPercent = 0;
  return listenForProcess(
    process,
    getTask,
    (event, handler, resolve, reject) => {
      if (event.action === "stdErr" || event.action === "stdOut") {
        const matches = event.data.match(/(\d+\.?\d*)%/g);
        if (!matches?.length) return;
        const percent = Number.parseFloat(matches[matches.length - 1]);
        if (Number.isNaN(percent) || percent < maxPercent) return;
        maxPercent = percent;
        onProgress?.("Downloading...", 2 + percent * 0.96);
        return;
      }
      if (event.action !== "exit") return;
      Neutralino.events.off("spawnedProcess", handler);
      if (event.data === 0) resolve();
      else reject(new Error(`Download failed with exit code ${event.data}`));
    },
  );
}

export async function extractArchive({
  archivePath,
  destinationPath,
  getTask,
  onEntry,
}) {
  const isWindows = window.NL_OS === "Windows";
  const command = isWindows
    ? `tar -xvf "${archivePath}" -C "${destinationPath}"`
    : `unzip -o "${archivePath}" -d "${destinationPath}"`;
  const process = await Neutralino.os.spawnProcess(command);
  const task = getTask();
  if (task) task.pid = process.id ?? process.pid;

  return listenForProcess(
    process,
    getTask,
    (event, handler, resolve, reject) => {
      if (event.action === "stdOut" || event.action === "stdErr") {
        const output = event.data.trim();
        if (output) onEntry?.(formatArchiveEntry(output));
        return;
      }
      if (event.action !== "exit") return;
      Neutralino.events.off("spawnedProcess", handler);
      if (event.data === 0 || (isWindows && event.data === 1)) resolve();
      else reject(new Error(`Extraction failed with exit code ${event.data}`));
    },
  );
}
