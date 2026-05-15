const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");

function createLaunchManager(emitter) {
  const launches = new Map();

  function list() {
    return [...launches.values()].map((item) => ({
      launchId: item.launchId,
      pid: item.pid,
      executablePath: item.executablePath,
      installPath: item.installPath,
      startTime: item.startTime,
    }));
  }

  async function launch(payload) {
    const executablePath = payload?.executablePath || payload?.installPath;
    if (!executablePath) throw new Error("Missing executablePath or installPath");

    const launchId = payload?.launchId || randomUUID();
    const args = Array.isArray(payload?.args) ? payload.args : [];
    const child = spawn(executablePath, args, { detached: false, shell: false, stdio: "ignore" });

    const metadata = {
      launchId,
      executablePath,
      installPath: payload?.installPath || "",
      pid: child.pid || 0,
      startTime: Date.now(),
      process: child,
    };
    launches.set(launchId, metadata);

    child.on("exit", (code, signal) => {
      launches.delete(launchId);
      emitter.emit("launch-exit", { launchId, code: code ?? null, signal: signal ?? null, timestamp: Date.now() });
    });

    return { launchId, pid: metadata.pid };
  }

  async function kill(payload) {
    const launchId = payload?.launchId;
    if (!launchId || !launches.has(launchId)) return { killed: false, launchId };
    const running = launches.get(launchId);
    let killed = false;
    try {
      killed = running.process.kill();
    } catch {
      killed = false;
    }
    if (killed) launches.delete(launchId);
    return { killed, launchId };
  }

  return { list, launch, kill };
}

module.exports = { createLaunchManager };
