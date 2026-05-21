# Explanation: Operational Flows

## Deep-link flow

- Main captures/normalizes links with `weekbox:` scheme.
- Links are queued before renderer is ready.
- Renderer should first call `getPendingDeepLinks` then subscribe to `weekbox:deep-link`.

Reasoning:
- Combines reliability at startup with live updates after boot.

## Install/import flow

- Start handler creates job ID.
- Job emits progress events with phase and percent.
- Cancel handler marks job canceled.
- Job returns completion or canceled status.

Reasoning:
- Request starts work, event stream reports work.

## Launch flow

- `launchEngine` starts process and returns launch metadata.
- `getRunningLaunches` provides current running set.
- `killLaunch` requests stop.
- `launch-exit` event confirms termination.

Reasoning:
- Combines command, query, and event patterns for process lifecycle.

## GameBanana flow

- Optional auth setup and status check.
- Download start begins long-running operation.
- Progress events stream state to UI.
- Cancel request marks active job canceled.

Reasoning:
- Same event-driven pattern as installs for consistency.
