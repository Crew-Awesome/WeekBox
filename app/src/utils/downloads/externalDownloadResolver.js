function quoteCommandArgument(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function getGoogleDriveFileId(url) {
  const parsed = new URL(url);
  return (
    parsed.searchParams.get("id") ||
    parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ||
    null
  );
}

export async function resolveExternalDownloadUrl(url, executeCommand) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "drive.google.com") {
    const fileId = getGoogleDriveFileId(url);
    if (!fileId) throw new Error("Could not find the Google Drive file ID");
    return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
  }
  if (hostname === "mediafire.com" || hostname === "www.mediafire.com") {
    const result = await executeCommand(
      `curl -fsSL --connect-timeout 10 --max-time 30 ${quoteCommandArgument(url)}`,
      { background: false },
    );
    if (result.exitCode !== 0) {
      throw new Error(
        result.stdErr || "Could not open the MediaFire download page",
      );
    }
    const directUrl = (result.stdOut || "")
      .replaceAll("&amp;", "&")
      .match(/https?:\/\/download[^"'\s<>]+\.mediafire\.com[^"'\s<>]*/i)?.[0];
    if (!directUrl) {
      throw new Error("Could not find the MediaFire download link");
    }
    return directUrl;
  }
  return url;
}

export async function getRangeSupportedFileSize(url, executeCommand) {
  const result = await executeCommand(
    `curl -sS -L -I --connect-timeout 3 --max-time 3 --range 0-0 ${quoteCommandArgument(url)}`,
    { background: false },
  );
  if (result.exitCode !== 0) {
    throw new Error(
      result.stdErr || `Range check failed with exit code ${result.exitCode}`,
    );
  }
  const headers = `${result.stdOut || ""}\n${result.stdErr || ""}`;
  const match = headers.match(/content-range:\s*bytes\s+0-0\/(\d+)/i);
  return match ? Number(match[1]) : 0;
}
