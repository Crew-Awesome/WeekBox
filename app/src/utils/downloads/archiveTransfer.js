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

const MIN_SEGMENTED_DOWNLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DOWNLOAD_SEGMENTS = 4;

function quoteCommandArgument(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function getNullDevice() {
  return window.NL_OS === "Windows" ? "NUL" : "/dev/null";
}

async function getRangeSupportedFileSize(url, getTask) {
  const process = await Neutralino.os.spawnProcess(
    `curl -sS -L --range 0-0 --dump-header - --output ${getNullDevice()} ${quoteCommandArgument(url)}`,
  );
  const task = getTask();
  if (task) task.pid = process.id ?? process.pid;

  let headers = "";
  return listenForProcess(
    process,
    getTask,
    (event, handler, resolve, reject) => {
      if (event.action === "stdErr" || event.action === "stdOut") {
        headers += event.data;
        return;
      }
      if (event.action !== "exit") return;
      Neutralino.events.off("spawnedProcess", handler);
      if (event.data !== 0) {
        reject(new Error(`Range check failed with exit code ${event.data}`));
        return;
      }
      const match = headers.match(/content-range:\s*bytes\s+0-0\/(\d+)/i);
      resolve(match ? Number(match[1]) : 0);
    },
  );
}

function getDownloadSegments(totalBytes, outPath) {
  const count = Math.min(
    MAX_DOWNLOAD_SEGMENTS,
    Math.ceil(totalBytes / MIN_SEGMENTED_DOWNLOAD_BYTES),
  );
  const partSize = Math.ceil(totalBytes / count);
  return Array.from({ length: count }, (_, index) => {
    const start = index * partSize;
    const end = Math.min(totalBytes - 1, start + partSize - 1);
    return {
      start,
      end,
      path: `${outPath}.part-${index}`,
    };
  });
}

async function removeParts(parts) {
  await Promise.all(
    parts.map((part) =>
      Neutralino.filesystem.remove(part.path).catch(() => {}),
    ),
  );
}

async function mergeParts(parts, outPath) {
  const partPaths = parts.map((part) => quoteCommandArgument(part.path));
  const command =
    window.NL_OS === "Windows"
      ? `cmd /c copy /b ${partPaths.join("+")} ${quoteCommandArgument(outPath)} > NUL`
      : `cat ${partPaths.join(" ")} > ${quoteCommandArgument(outPath)}`;
  const result = await Neutralino.os.execCommand(command, {
    background: false,
  });
  if (result.exitCode !== 0) {
    throw new Error(result.stdErr || "Could not merge download parts");
  }
}

async function runCurlDownload(command, getTask, onProgress) {
  const process = await Neutralino.os.spawnProcess(command);
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

async function downloadSingleArchive({ url, outPath, getTask, onProgress }) {
  await runCurlDownload(
    `curl -# -L ${quoteCommandArgument(url)} -o ${quoteCommandArgument(outPath)}`,
    getTask,
    onProgress,
  );
}

async function downloadSegmentedArchive({
  url,
  outPath,
  totalBytes,
  getTask,
  onProgress,
}) {
  const parts = getDownloadSegments(totalBytes, outPath);
  try {
    await removeParts(parts);
    const requests = parts
      .map(
        (part) =>
          `--range ${part.start}-${part.end} -o ${quoteCommandArgument(part.path)} ${quoteCommandArgument(url)}`,
      )
      .join(" ");
    await runCurlDownload(
      `curl -# -L --parallel --parallel-max ${parts.length} ${requests}`,
      getTask,
      onProgress,
    );
    if (getTask()?.cancelled) throw new Error("Cancelled");
    await mergeParts(parts, outPath);
  } finally {
    await removeParts(parts);
  }
}

export async function downloadArchive({ url, outPath, getTask, onProgress }) {
  let remoteFileSize = 0;
  try {
    remoteFileSize = await getRangeSupportedFileSize(url, getTask);
  } catch (error) {
    if (getTask()?.cancelled) throw error;
  }

  if (remoteFileSize >= MIN_SEGMENTED_DOWNLOAD_BYTES) {
    await downloadSegmentedArchive({
      url,
      outPath,
      totalBytes: remoteFileSize,
      getTask,
      onProgress,
    });
    return;
  }

  await downloadSingleArchive({ url, outPath, getTask, onProgress });
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
