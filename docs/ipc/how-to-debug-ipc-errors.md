# How-to: Debug IPC Errors

## Symptoms

- `res.ok === false`
- Error message appears in `res.error.message`

## Debug process

1. Confirm channel name matches preload and main handler.
2. Confirm payload shape matches validator expectations.
3. Log full response envelope including `durationMs`.
4. Inspect throwing service method for internal errors.

## Typical failures

- `payload must be an object`
- `targetPath must be a non-empty string`
- Missing launch fields (`executablePath` or `installPath`)
- Service-side network/IO failure

## Minimal logger

```js
function logIpcResult(label, res) {
  if (res.ok) {
    console.log(label, "ok", res.data, `(${res.durationMs}ms)`);
  } else {
    console.error(label, "failed", res.error, `(${res.durationMs}ms)`);
  }
}
```
