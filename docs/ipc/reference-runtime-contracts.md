# Reference: IPC Runtime and Contracts

## Source files

- `node/ipc/index.js`
- `node/ipc/response.js`
- `node/ipc/validate.js`
- `web/preload.js`

## Runtime construction

`createIpcRuntime({ app })` constructs shared infrastructure:
- `emitter` for internal event fan-out
- `launchManager` from `node/services/launches.js`
- `gamebanana` service from `node/services/gamebanana.js`
- job tracking map for install/import simulation
- deep-link queue support

## Main registration

`registerIpcHandlers({ app, runtime })` binds all `ipcMain.handle(...)` channels.

Handler wrapper:
- `invoke = (handler) => wrap(handler)`

This means every handler gets uniform response envelope and automatic error capture.

## Response envelope

Success:

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "durationMs": 12
}
```

Failure:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "IPC_ERROR",
    "message": "payload must be an object",
    "details": null
  },
  "durationMs": 4
}
```

## Validation contract

- `assertObject(value, name)` rejects null, non-objects, arrays.
- `assertString(value, name)` requires non-empty trimmed string.

Validation exceptions are returned as `IPC_ERROR` by wrapper.

## Preload exposure contract

`web/preload.js` exposes only selected APIs under `window.weekbox`.

Groups:
- `app`
- `system`
- `settings`
- `deeplink`
- `install`
- `launch`
- `gamebanana`

Event subscriptions use helper `on(eventName, listener)` and return unsubscribe functions.
