# Reference: Event Channels

## WeekBox event channels

### `weekbox:deep-link`
- Renderer subscription: `window.weekbox.deeplink.onDeepLink(listener)`
- Payload: `{ url }`
- Produced by: `enqueueDeepLink(...)`

### `weekbox:install-progress`
- Renderer subscription: `window.weekbox.install.onProgress(listener)`
- Payload: `{ jobId, phase, progress, message, timestamp }`
- Produced by: `publishInstall(...)` during simulated install/import jobs

### `weekbox:launch-exit`
- Renderer subscription: `window.weekbox.launch.onLaunchExit(listener)`
- Payload: `{ launchId, code, signal, timestamp }`
- Produced by: launch manager child process `exit` event

### `weekbox:app-update`
- Renderer subscription: not exposed in `web/preload.js` currently
- Payload: updater-defined object
- Produced by: runtime emitter `updater-status`

## GameBanana event channels

### `gamebanana:download-progress`
- Renderer subscription: `window.weekbox.gamebanana.onDownloadProgress(listener)`
- Payload: `{ jobId, progress, canceled }`
- Produced by: GameBanana service `download(...)`
