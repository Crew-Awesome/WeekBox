# How-to: Use GameBanana Download Flow

## Goal

Integrate GameBanana download lifecycle with progress and cancel.

## Flow

1. Optionally validate auth (`authStatus`).
2. Call `downloadStart(payload)`.
3. Subscribe to `onDownloadProgress`.
4. Cancel with `downloadCancel({ jobId })` when needed.

## Example

```js
const unsub = window.weekbox.gamebanana.onDownloadProgress((p) => {
  renderDownloadProgress(p.jobId, p.progress, p.canceled);
});

const start = await window.weekbox.gamebanana.downloadStart({
  jobId: "dl-1",
  targetPath: "C:\\mods",
});

if (shouldCancel) {
  await window.weekbox.gamebanana.downloadCancel({ jobId: "dl-1" });
}
```

## Notes

- Service emits progress steps until completion or cancellation.
- Final response includes `{ canceled, targetPath }` on success path.
