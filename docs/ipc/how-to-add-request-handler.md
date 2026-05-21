# How-to: Add a Request/Response Handler

## Goal

Add a new `ipcMain.handle(...)` endpoint and expose it safely to renderer.

## Steps

1. Add channel in `node/ipc/index.js` inside `registerIpcHandlers(...)`.
2. Wrap with `invoke(async (...) => ok(...))`.
3. Validate payload with `assertObject` and `assertString` as needed.
4. Expose preload method in `web/preload.js`.
5. Consume in renderer and branch on `res.ok`.

## Pattern

```js
ipcMain.handle("weekbox:myChannel", invoke(async (_event, payload) => {
  assertObject(payload, "payload");
  assertString(payload.value, "value");
  return ok({ normalized: payload.value.trim() });
}));
```

Preload:

```js
myGroup: {
  myMethod: (payload) => invoke("weekbox:myChannel", payload),
}
```

Renderer:

```js
const res = await window.weekbox.myGroup.myMethod({ value: "abc" });
if (!res.ok) {
  // show res.error.message
}
```

## Verification checklist

- Channel name is namespaced (`weekbox:` or `gamebanana:`).
- Preload API name is clear and action-oriented.
- Payload validation errors are meaningful.
- UI handles both success and error shape.
