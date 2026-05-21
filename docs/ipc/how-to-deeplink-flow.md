# How-to: Handle Deep Links Safely

## Goal

Process deep links without losing links that arrive before renderer is ready.

## Correct boot sequence

1. Call `window.weekbox.deeplink.getPending()` once at startup.
2. Process each returned URL.
3. Register `onDeepLink` listener for live links.

## Example

```js
const pending = await window.weekbox.deeplink.getPending();
if (pending.ok) {
  for (const url of pending.data.links) {
    handleDeepLink(url);
  }
}

const unsubscribe = window.weekbox.deeplink.onDeepLink(({ url }) => {
  handleDeepLink(url);
});
```

## Important behavior

- `getPending()` drains queue (read-once).
- `onDeepLink` is for future arrivals only.
