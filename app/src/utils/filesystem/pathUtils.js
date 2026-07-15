export function sanitizePathSegment(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*]+/g, "")
    .trim();
}

export function getParentPath(path) {
  return path.slice(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")));
}

export function getRealEntries(entries) {
  return entries.filter((entry) => entry.entry !== "." && entry.entry !== "..");
}

export function getModFolderName(mod) {
  return mod.folderName || sanitizePathSegment(mod.name);
}
