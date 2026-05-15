async function boot() {
  const versionRes = await window.weekbox.app.getVersion();
  const osRes = await window.weekbox.app.getOS();

  console.log("WeekBox IPC online", { versionRes, osRes });

  window.weekbox.install.onProgress((payload) => console.log("Install progress", payload));
  window.weekbox.launch.onLaunchExit((payload) => console.log("Launch exit", payload));
  window.weekbox.deeplink.onDeepLink((payload) => console.log("Deep link", payload));
  window.weekbox.gamebanana.onDownloadProgress((payload) => console.log("GB download", payload));
}

boot().catch((error) => console.error("WeekBox boot failed", error));
