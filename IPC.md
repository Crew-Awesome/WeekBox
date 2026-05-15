# WeekBox IPC

WeekBox now uses a strict allowlisted IPC bridge inspired by FunkHub/Fresh/Deltamod patterns.

## Response Envelope

Every invoke returns:

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "durationMs": 1
}
```

Error shape:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "IPC_ERROR",
    "message": "Human-readable error",
    "details": null
  },
  "durationMs": 1
}
```

## Commands

### `weekbox:*`

- `weekbox:getVersion`
- `weekbox:getOS`
- `weekbox:isPackaged`
- `weekbox:diagnosticInfo`
- `weekbox:showWindow`
- `weekbox:minimizeWindow`
- `weekbox:toggleFullscreen`
- `weekbox:openExternalUrl`
- `weekbox:openPath`
- `weekbox:openAnyPath`
- `weekbox:showItemInFolder`
- `weekbox:pickFolder`
- `weekbox:pickFile`
- `weekbox:getSettings`
- `weekbox:updateSettings`
- `weekbox:getPendingDeepLinks`
- `weekbox:installArchive`
- `weekbox:installEngine`
- `weekbox:importEngineFolder`
- `weekbox:importModFolder`
- `weekbox:cancelInstall`
- `weekbox:listDirectory`
- `weekbox:inspectPath`
- `weekbox:inspectEngineInstall`
- `weekbox:launchEngine`
- `weekbox:getRunningLaunches`
- `weekbox:killLaunch`

### `gamebanana:*`

- `gamebanana:auth:start`
- `gamebanana:auth:status`
- `gamebanana:auth:clear`
- `gamebanana:user:info`
- `gamebanana:user:avatar`
- `gamebanana:cache:clear`
- `gamebanana:download:start`
- `gamebanana:download:cancel`

## Events

- `weekbox:deep-link`
- `weekbox:install-progress`
- `weekbox:launch-exit`
- `gamebanana:download-progress`

## Security Rules

- No generic free-form channel invoke exposed to renderer.
- Preload exposes explicit method allowlist only.
- Payload checks for required object/string fields.
- Path operations resolve to absolute paths.
- GameBanana auth state is stored in app data and not exposed as raw file access to renderer.

## Architecture

- `node/ipc/index.js`: channel registration and runtime wiring
- `node/ipc/response.js`: envelope helpers
- `node/ipc/validate.js`: payload guards
- `node/services/settings.js`: settings persistence
- `node/services/launches.js`: process launch/list/kill
- `node/services/updater.js`: updater state and events
- `node/services/gamebanana.js`: auth/status/user/cached downloads
- `web/preload.js`: strict renderer bridge
