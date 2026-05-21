# Explanation: IPC Architecture Model

WeekBox IPC uses a boundary-first architecture:

- Main process owns privileged operations.
- Renderer only sees approved methods via preload.
- Services encapsulate domain behavior (settings, launches, GameBanana).

## Layers

1. Renderer UI layer
- Calls `window.weekbox.*`.
- Receives event streams through preload listeners.

2. Preload boundary layer
- Maps method names to channel strings.
- Hides raw `ipcRenderer` from application UI code.

3. IPC handler layer
- Registers channels in one place (`registerIpcHandlers`).
- Applies uniform wrapping for timing and error envelope.

4. Service layer
- Handles business logic and side effects.
- Emits events through runtime emitter where needed.

## Why this model helps

- Centralized channel registration simplifies audits.
- Renderer API stays stable even if main internals evolve.
- Shared response shape lowers UI complexity.
