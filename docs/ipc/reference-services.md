# Reference: Connected Services

These services define behavior behind several IPC handlers.

## Settings service (`node/services/settings.js`)

### Responsibilities
- Read and write app settings under `app.getPath("userData")`.
- Merge missing keys with defaults.

### Defaults

- `firstRunCompleted: false`
- `checkAppUpdatesOnStartup: true`
- `autoDownloadAppUpdates: false`
- `showAnimations: true`
- `gamebananaIntegration.pollingIntervalSeconds: 300`

### IPC connections
- `weekbox:getSettings`
- `weekbox:updateSettings`

## Launch service (`node/services/launches.js`)

### Responsibilities
- Spawn executable processes.
- Track running launches in memory.
- Emit `launch-exit` when process ends.

### Key behaviors
- `launch(payload)` needs `executablePath` or `installPath`.
- `kill(payload)` expects `launchId`.
- Running list is in-memory only.

### IPC connections
- `weekbox:launchEngine`
- `weekbox:getRunningLaunches`
- `weekbox:killLaunch`
- Event: `weekbox:launch-exit`

## GameBanana service (`node/services/gamebanana.js`)

### Responsibilities
- Store auth token data in user data directory.
- Resolve auth status.
- Fetch profile and avatar from GameBanana API.
- Simulate download jobs with progress and cancellation.

### Storage
- Base dir: `app.getPath("userData")/gamebanana`
- Auth file: `auth.json`

### IPC connections
- `gamebanana:auth:start`
- `gamebanana:auth:status`
- `gamebanana:auth:clear`
- `gamebanana:user:info`
- `gamebanana:user:avatar`
- `gamebanana:cache:clear`
- `gamebanana:download:start`
- `gamebanana:download:cancel`
- Event: `gamebanana:download-progress`
