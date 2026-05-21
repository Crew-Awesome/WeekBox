# Reference: GameBanana Channels

## Auth and user channels

### `gamebanana:auth:start`
- Preload: `window.weekbox.gamebanana.authStart(payload)`
- Expected payload fields:
  - `userId` (positive number)
  - optional `token`
  - optional `source`
- Output: `{ connected, userId, connectedAt }`
- Failure case: invalid `userId` throws

### `gamebanana:auth:status`
- Preload: `window.weekbox.gamebanana.authStatus()`
- Output (not connected): `{ connected: false }`
- Output (connected): `{ connected: true, userId, connectedAt }`

### `gamebanana:auth:clear`
- Preload: `window.weekbox.gamebanana.authClear()`
- Output: `{ connected: false }`

### `gamebanana:user:info`
- Preload: `window.weekbox.gamebanana.userInfo()`
- Output: service-driven object
- Typical values:
  - `{ loggedIn: false }` when no auth or fetch error
  - `{ loggedIn: false, reason: "HTTP_###" }` on non-OK API status
  - `{ loggedIn: true, ...profileFields }` on success

### `gamebanana:user:avatar`
- Preload: `window.weekbox.gamebanana.userAvatar()`
- Output: `{ avatarUrl, loggedIn }`

### `gamebanana:cache:clear`
- Preload: `window.weekbox.gamebanana.clearCache()`
- Output: `{ cleared: true }`

## Download channels

### `gamebanana:download:start`
- Preload: `window.weekbox.gamebanana.downloadStart(payload)`
- Payload: service-defined download descriptor
- Output on complete: `{ jobId, canceled: false, targetPath }`
- Output on cancel path: `{ jobId, canceled: true }`

### `gamebanana:download:cancel`
- Preload: `window.weekbox.gamebanana.downloadCancel(payload)`
- Expected payload: `{ jobId }`
- Output: `{ canceled, jobId }`
