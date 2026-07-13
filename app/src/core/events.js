export const appEvents = new EventTarget();

export function emitViewChange(view) {
    appEvents.dispatchEvent(new CustomEvent('view:loaded', { detail: view }));
}
