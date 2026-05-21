# How-to: Implement Install Progress UI

## Goal

Start install job, render progress, and support cancellation.

## Flow

1. Subscribe to `weekbox:install-progress`.
2. Start one of install jobs.
3. Match progress events by `jobId`.
4. Allow cancel using same `jobId`.

## Example

```js
const unsubscribe = window.weekbox.install.onProgress((p) => {
  updateProgressBar(p.jobId, p.progress, p.phase, p.message);
});

const start = await window.weekbox.install.installArchive({ source: "C:\\mods\\pack.zip" });
if (start.ok) {
  const { jobId } = start.data;
  bindCancelButton(() => window.weekbox.install.cancelInstall({ jobId }));
}
```

## Notes

- Current install implementation is simulated (`fakeInstall`).
- Events include timestamp for ordering/debugging.
- `cancelInstall` returns `canceled: false` when `jobId` is unknown.
