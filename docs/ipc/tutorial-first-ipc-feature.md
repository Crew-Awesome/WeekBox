# Tutorial: Build Your First IPC Feature

This tutorial walks you through adding one complete IPC feature in WeekBox.

By the end, you will:
- Register a new main-process handler
- Expose it through `window.weekbox` in preload
- Call it from renderer code
- Handle standard IPC success/error responses

## Before you start

You should be familiar with:
- JavaScript basics
- Electron main vs renderer process

You will edit:
- `node/ipc/index.js`
- `web/preload.js`

## Step 1: Add a handler in main process

Open `node/ipc/index.js` and add a handler inside `registerIpcHandlers(...)`:

```js
ipcMain.handle("weekbox:ping", invoke(async () => ok({ message: "pong" })));
```

What this means:
- Channel name is `weekbox:ping`.
- `invoke(...)` wraps errors and adds `durationMs`.
- `ok(...)` returns a successful response envelope.

## Step 2: Expose it in preload

Open `web/preload.js` and add an app method:

```js
app: {
  // existing methods...
  ping: () => invoke("weekbox:ping"),
},
```

What this means:
- Renderer code can now call `window.weekbox.app.ping()`.
- Renderer does not need direct access to `ipcRenderer`.

## Step 3: Call it from renderer

In renderer code:

```js
const res = await window.weekbox.app.ping();
if (!res.ok) {
  console.error("IPC failed:", res.error);
} else {
  console.log(res.data.message); // "pong"
}
```

## Step 4: Use payload validation for non-trivial handlers

If your handler accepts input, validate payload fields early:

```js
ipcMain.handle("weekbox:example", invoke(async (_event, payload) => {
  assertObject(payload, "payload");
  assertString(payload.name, "name");
  return ok({ greeting: `hello ${payload.name}` });
}));
```

This prevents silent assumptions and produces clear `IPC_ERROR` messages.

## Step 5: Understand response shape

Every handler response has this top-level shape:

```js
{
  ok: true | false,
  data: any | null,
  error: { code, message, details } | null,
  durationMs: number
}
```

Use `ok` as the first branch in UI code.

## Step 6: Optional event push pattern

If you need streaming updates:
- Main emits: `runtime.emitToRenderer("your:event", payload)` (indirectly via emitter wiring)
- Preload listens with `ipcRenderer.on(...)`
- Expose `onXxx(listener)` that returns unsubscribe

See:
- [How-to: Add an Event Channel](C:\Users\Henry\Documents\GitHub\WeekBox\docs\ipc\how-to-add-event-channel.md)
- [Reference: Event Channels](C:\Users\Henry\Documents\GitHub\WeekBox\docs\ipc\reference-events.md)

## Next steps

- For exact channel catalog, read [WeekBox Channels](C:\Users\Henry\Documents\GitHub\WeekBox\docs\ipc\reference-channels-weekbox.md).
- For common recipes, open [How-to Index](C:\Users\Henry\Documents\GitHub\WeekBox\docs\ipc\how-to-index.md).
