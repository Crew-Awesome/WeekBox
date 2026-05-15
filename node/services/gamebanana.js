const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

function createGameBananaService(app) {
  const baseDir = path.join(app.getPath("userData"), "gamebanana");
  const tokenFile = path.join(baseDir, "auth.json");
  const jobs = new Map();

  fs.mkdirSync(baseDir, { recursive: true });

  async function readToken() {
    if (!fs.existsSync(tokenFile)) return null;
    try {
      const raw = JSON.parse(await fsp.readFile(tokenFile, "utf8"));
      return raw;
    } catch {
      return null;
    }
  }

  async function writeToken(payload) {
    await fsp.mkdir(baseDir, { recursive: true });
    await fsp.writeFile(tokenFile, JSON.stringify(payload, null, 2), "utf8");
  }

  async function startAuth(payload) {
    const userId = Number(payload?.userId || 0);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error("userId must be a positive number");
    }
    const saved = {
      userId,
      token: String(payload?.token || ""),
      connectedAt: Date.now(),
      source: payload?.source || "manual",
    };
    await writeToken(saved);
    return { connected: true, userId, connectedAt: saved.connectedAt };
  }

  async function authStatus() {
    const auth = await readToken();
    if (!auth) return { connected: false };
    return {
      connected: true,
      userId: auth.userId,
      connectedAt: auth.connectedAt,
    };
  }

  async function clearAuth() {
    try {
      await fsp.unlink(tokenFile);
    } catch {
    }
    return { connected: false };
  }

  async function userInfo() {
    const auth = await readToken();
    if (!auth?.userId) return { loggedIn: false };
    try {
      const res = await fetch(`https://gamebanana.com/apiv11/Member/${auth.userId}/ProfilePage`);
      if (!res.ok) return { loggedIn: false, reason: `HTTP_${res.status}` };
      const data = await res.json();
      return { loggedIn: true, ...data };
    } catch {
      return { loggedIn: false };
    }
  }

  async function userAvatar() {
    const info = await userInfo();
    return {
      avatarUrl: info?._sAvatarUrl || null,
      loggedIn: info?.loggedIn === true,
    };
  }

  async function clearCache() {
    return { cleared: true };
  }

  async function download(payload, emitter) {
    const jobId = payload?.jobId || randomUUID();
    jobs.set(jobId, { canceled: false });
    for (const progress of [5, 20, 35, 55, 80, 100]) {
      const state = jobs.get(jobId);
      if (!state || state.canceled) {
        emitter.emit("gamebanana-download-progress", { jobId, progress, canceled: true });
        jobs.delete(jobId);
        return { jobId, canceled: true };
      }
      await new Promise((resolve) => setTimeout(resolve, 110));
      emitter.emit("gamebanana-download-progress", { jobId, progress, canceled: false });
    }
    jobs.delete(jobId);
    return { jobId, canceled: false, targetPath: payload?.targetPath || null };
  }

  async function cancelDownload(payload) {
    const jobId = payload?.jobId;
    if (!jobId || !jobs.has(jobId)) return { canceled: false, jobId: jobId || null };
    jobs.set(jobId, { canceled: true });
    return { canceled: true, jobId };
  }

  return {
    startAuth,
    authStatus,
    clearAuth,
    userInfo,
    userAvatar,
    clearCache,
    download,
    cancelDownload,
  };
}

module.exports = { createGameBananaService };
