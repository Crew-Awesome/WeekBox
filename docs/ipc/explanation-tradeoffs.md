# Explanation: Design Decisions and Tradeoffs

## Uniform response wrapper

Decision:
- Wrap every handler with `wrap(...)`.

Benefit:
- Predictable error handling and duration data.

Tradeoff:
- Domain-specific error codes are not differentiated yet; many failures become `IPC_ERROR`.

## Preload-only renderer API

Decision:
- Expose IPC through `window.weekbox` only.

Benefit:
- Stronger boundary and clearer contract for UI developers.

Tradeoff:
- Every new channel requires preload edits.

## Event model for long-running work

Decision:
- Use events for progress (`install-progress`, `download-progress`, `launch-exit`).

Benefit:
- Real-time feedback without polling.

Tradeoff:
- UI must correlate events by IDs and manage subscriptions.

## Current caveats

- `openPath` and `openAnyPath` currently behave the same.
- `ensureSafePath` resolves paths but does not enforce containment to sandbox root.
- `inspectPath` reports missing path as error, not `{ exists: false }`.
- `weekbox:app-update` is emitted but not exposed in preload listeners.
