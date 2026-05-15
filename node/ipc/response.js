function ok(data) {
  return { ok: true, data, error: null };
}

function fail(code, message, details) {
  return { ok: false, data: null, error: { code, message, details: details || null } };
}

function wrap(fn) {
  return async (...args) => {
    const startedAt = Date.now();
    try {
      const result = await fn(...args);
      return { ...result, durationMs: Date.now() - startedAt };
    } catch (error) {
      return {
        ...fail("IPC_ERROR", error?.message || "Unknown IPC error"),
        durationMs: Date.now() - startedAt,
      };
    }
  };
}

module.exports = { ok, fail, wrap };
