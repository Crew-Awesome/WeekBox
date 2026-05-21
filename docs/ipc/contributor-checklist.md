# Contributor Checklist: IPC Changes

Use this checklist whenever you add or modify IPC behavior.

## Implementation

- Add/update handler in `node/ipc/index.js`.
- Validate payload fields in handler.
- Keep response envelope (`ok(...)` or thrown error for wrapper).
- For streams, wire emitter -> `emitToRenderer` -> preload listener.

## Preload API

- Add or update `window.weekbox` method/listener in `web/preload.js`.
- Keep naming consistent and action-oriented.

## Service alignment

- If handler delegates to service, confirm service returns stable shape.
- If service emits events, confirm payload fields are documented.

## Documentation updates

- Update relevant files under `docs/ipc/`:
  - tutorial (if onboarding path changed)
  - how-to recipe (if workflow changed)
  - reference entry (always)
  - explanation/tradeoffs (if architecture behavior changed)

## Validation and smoke tests

- Call handler from renderer or dev console.
- Verify success and failure responses.
- Verify event subscription and unsubscribe behavior.
- Verify channel names in preload exactly match main registration.
