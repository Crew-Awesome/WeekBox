# How-to: Add an Event Channel

## Goal

Push real-time updates from main process to renderer.

## Steps

1. Add event constant in `IPC_EVENTS` (`node/ipc/index.js`).
2. Emit from runtime via `emitter.emit(...)` in service/runtime code.
3. Wire emitter to renderer with `emitToRenderer(...)`.
4. Expose preload subscription helper with unsubscribe function.

## Pattern

Main wiring:

```js
const IPC_EVENTS = {
  myEvent: "weekbox:my-event",
};

emitter.on("my-event-internal", (payload) => emitToRenderer(IPC_EVENTS.myEvent, payload));
```

Preload:

```js
myGroup: {
  onMyEvent: (listener) => on("weekbox:my-event", listener),
}
```

Renderer:

```js
const unsubscribe = window.weekbox.myGroup.onMyEvent((payload) => {
  console.log(payload);
});
```

## When to use events vs handlers

Use events when:
- Progress is incremental
- State changes are asynchronous
- Main process receives updates over time

Use handlers when:
- You need one direct request/response
