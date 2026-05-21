# Reference: WeekBox Channels

This file lists all non-GameBanana request/response channels.

## App channels

### `weekbox:getVersion`
- Preload: `window.weekbox.app.getVersion()`
- Input: none
- Output: `{ version }`
- Purpose: expose app version

### `weekbox:getOS`
- Preload: `window.weekbox.app.getOS()`
- Input: none
- Output: `{ platform, release, version }`
- Purpose: expose runtime OS info

### `weekbox:isPackaged`
- Preload: `window.weekbox.app.isPackaged()`
- Input: none
- Output: `{ isPackaged }`
- Purpose: dev vs packaged mode checks

### `weekbox:diagnosticInfo`
- Preload: `window.weekbox.app.diagnosticInfo()`
- Input: none
- Output: `{ appName, appVersion, platform, now, jobs }`
- Purpose: consolidated diagnostics

### `weekbox:showWindow`
- Preload: `window.weekbox.app.showWindow()`
- Input: none
- Output: `{ shown: true }`
- Purpose: show sender window

### `weekbox:minimizeWindow`
- Preload: `window.weekbox.app.minimizeWindow()`
- Input: none
- Output: `{ minimized: true }`
- Purpose: minimize sender window

### `weekbox:toggleFullscreen`
- Preload: `window.weekbox.app.toggleFullscreen()`
- Input: none
- Output: `{ fullScreen: boolean }`
- Purpose: toggle fullscreen for sender window

## System channels

### `weekbox:openExternalUrl`
- Preload: `window.weekbox.system.openExternalUrl(payload)`
- Required payload: `{ url: string }`
- Output: `{ opened: true }`
- Side effect: opens external browser

### `weekbox:openPath`
- Preload: `window.weekbox.system.openPath(payload)`
- Required payload: `{ targetPath: string }`
- Output: `{ opened: true, targetPath }`
- Side effect: opens path via OS

### `weekbox:openAnyPath`
- Preload: `window.weekbox.system.openAnyPath(payload)`
- Required payload: `{ targetPath: string }`
- Output: `{ opened: true, targetPath }`
- Side effect: currently same as `openPath`

### `weekbox:showItemInFolder`
- Preload: `window.weekbox.system.showItemInFolder(payload)`
- Required payload: `{ targetPath: string }`
- Output: `{ shown: true, targetPath }`
- Side effect: reveals file in explorer

### `weekbox:pickFolder`
- Preload: `window.weekbox.system.pickFolder(payload?)`
- Optional payload: `{ title?, defaultPath? }`
- Output (cancel): `{ canceled: true }`
- Output (select): `{ canceled: false, path }`

### `weekbox:pickFile`
- Preload: `window.weekbox.system.pickFile(payload?)`
- Optional payload: `{ title?, defaultPath?, filters? }`
- Output (cancel): `{ canceled: true }`
- Output (select): `{ canceled: false, path }`

### `weekbox:inspectPath`
- Preload: `window.weekbox.system.inspectPath(payload)`
- Required payload: `{ targetPath: string }`
- Output: `{ targetPath, exists: true, isFile, isDirectory, size }`
- Failure behavior: missing path throws and returns `IPC_ERROR`

### `weekbox:listDirectory`
- Preload: `window.weekbox.system.listDirectory(payload)`
- Required payload: `{ targetPath: string }`
- Output: `{ targetPath, entries: [{ name, isDirectory, isFile }] }`

## Settings channels

### `weekbox:getSettings`
- Preload: `window.weekbox.settings.get()`
- Input: none
- Output: merged settings object from settings service

### `weekbox:updateSettings`
- Preload: `window.weekbox.settings.update(payload)`
- Required payload: settings patch object
- Output: updated settings object

## Deep-link channels

### `weekbox:getPendingDeepLinks`
- Preload: `window.weekbox.deeplink.getPending()`
- Input: none
- Output: `{ links: string[] }`
- Behavior: drains queue after reading

## Install channels

### `weekbox:installArchive`
- Preload: `window.weekbox.install.installArchive(payload?)`
- Output: `{ jobId, canceled, result? }`
- Behavior: starts simulated install job

### `weekbox:installEngine`
- Preload: `window.weekbox.install.installEngine(payload?)`
- Output: `{ jobId, canceled, result? }`
- Behavior: starts simulated install job

### `weekbox:importEngineFolder`
- Preload: `window.weekbox.install.importEngineFolder(payload?)`
- Output: `{ jobId, canceled, result? }`
- Behavior: starts simulated import job

### `weekbox:importModFolder`
- Preload: `window.weekbox.install.importModFolder(payload?)`
- Output: `{ jobId, canceled, result? }`
- Behavior: starts simulated import job

### `weekbox:cancelInstall`
- Preload: `window.weekbox.install.cancelInstall(payload)`
- Required payload: `{ jobId: string }`
- Output: `{ canceled: boolean, jobId }`

### `weekbox:inspectEngineInstall`
- Preload: `window.weekbox.install.inspectEngineInstall(payload)`
- Required payload: `{ installPath: string }`
- Output: `{ installPath, exists, recognized }`
- Current meaning: `recognized` mirrors `exists`

## Launch channels

### `weekbox:launchEngine`
- Preload: `window.weekbox.launch.launchEngine(payload)`
- Payload: pass-through to launch manager
- Output: launch result from `launch(payload)`

### `weekbox:getRunningLaunches`
- Preload: `window.weekbox.launch.getRunningLaunches()`
- Input: none
- Output: `{ launches }`

### `weekbox:killLaunch`
- Preload: `window.weekbox.launch.killLaunch(payload)`
- Payload: pass-through to launch manager
- Output: kill result from `kill(payload)`
