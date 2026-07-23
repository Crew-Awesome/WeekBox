const FALLBACK_IMAGE = "assets/icons/launcher-icon.png";

export function getImageUrl(mod) {
  const screenshot = mod?._aPreviewContent?.screenshot;
  if (screenshot?._sBaseUrl) {
    const filename =
      screenshot._sFile530 || screenshot._sFile220 || screenshot._sFile;
    if (filename) return `${screenshot._sBaseUrl}/${filename}`;
  }
  const image = mod?._aPreviewMedia?._aImages?.[0];
  return image ? `${image._sBaseUrl}/${image._sFile}` : FALLBACK_IMAGE;
}

export function getTimeAgo(timestamp) {
  if (!timestamp) return "N/A";
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  const units = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  const match = units.find(([duration]) => seconds / duration > 1);
  return match
    ? `${Math.floor(seconds / match[0])}${match[1]}`
    : `${Math.floor(seconds)}s`;
}

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const precision = decimals < 0 ? 0 : decimals;
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / 1024 ** index).toFixed(precision))} ${units[index]}`;
}

export function toGridMod(mod, getEngineId) {
  return {
    id: mod._idRow,
    title: mod._sName,
    author: mod._aSubmitter?._sName || "Unknown",
    gameId: Number(mod._aGame?._idRow || mod._idGame || 0),
    image: getImageUrl(mod),
    likes: mod._nLikeCount || 0,
    views: mod._nViewCount || 0,
    submittedAt: Number(mod._tsDateAdded || 0) * 1000,
    timeAgo: getTimeAgo(mod._tsDateAdded),
    engineId: mod.__resolvedEngineId || getEngineId(mod),
  };
}
