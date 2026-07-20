# Mod System Architecture

This document outlines the technical architecture and workflow of the mod management subsystem in Weekbox. The system is designed to handle large binaries asynchronously, maintain parity between physical files and persistent data, and mitigate OS-level race conditions during concurrent IO operations.

## 1. Download and Extraction (`mods.js`)

To prevent V8/Node.js memory heap issues when handling large binaries (GBs in size), the application bypasses JavaScript-based HTTP clients and extraction libraries.

- **Native Tooling**: Downloads are handled via `curl`. Extractions are performed using `tar` (Windows) or `unzip` (macOS/Linux).
- **Asynchronous Execution**: Native shell commands are executed via Neutralino's `spawnProcess`. This prevents the backend from blocking, enabling concurrent mod downloads without UI degradation.
- **Workflow**:
  1. Temporary directories are cleared and recreated.
  2. The binary is downloaded to the `temp` directory.
  3. The file extension is parsed. If missing, it defaults to `.zip`.
  4. The archive is extracted directly into the final `mods/` directory.

## 2. Directory Normalization

A common issue with user-uploaded archives is arbitrary folder nesting (e.g., placing the mod inside a wrapper folder). The `normalizeExtractedMod` function resolves this automatically.

- **Recursive Flattening**: After extraction, the directory tree is scanned. If the root contains exactly one directory and no other files (ignoring system files like `.DS_Store` or `desktop.ini`), the contents of that nested directory are hoisted to the root.
- **Iteration Limit**: The flattening operation runs recursively up to 10 levels deep to prevent infinite loops in malformed archives.
- **Native Move**: The hoisting is performed via `Move-Item` (PowerShell) or `mv` (Bash) to ensure hidden files are preserved and memory overhead remains zero.

## 3. Local Category Detection

Because metadata fetched from external sources (e.g., GameBanana) is often miscategorized by uploaders, the system performs a localized heuristic scan post-extraction to determine the true engine dependency.

- **Heuristics**:
  - **Executable (ID 3827)**: Scans for files ending in `.exe`, `.app`, `.AppImage`, or `.sh`. 
  - **V-Slice / Base Game (ID 29202)**: Scans for `_polymod_meta.json`.
  - **Psych Engine (ID 28367)**: Scans for `pack.json`.
- **Priority**: Executables take absolute precedence. If a mod ships an `.exe` bundled with Psych Engine files, it is treated as a standalone executable.
- **Fallback**: If no recognizable fingerprint is detected, `categoryLocalId` defaults to `null`, deferring to the original metadata category.

## 4. State Persistence (`mods-library.js`)

The source of truth for the frontend is `installed_mods.json`. Relying on a JSON indexer instead of real-time disk IO ensures O(1) load times during application startup.

- **Schema**: Each entry stores `id`, `name`, `folderName`, `categoryId`, `categoryLocalId`, `version`, and `enabled` status.
- **Write Operations**: Modifications strictly filter out existing entries by `id` prior to appending the updated object to prevent duplicates.

## 5. Bidirectional Synchronization & Garbage Collection

To account for out-of-band modifications (e.g., users deleting folders manually via Windows Explorer), a lightweight background watcher (`startLibraryWatcher`) reconciles the physical disk with the JSON indexer.

- **Polling Mechanism**: Runs every 3000ms using `setInterval`. Since it only performs a shallow directory read, CPU and memory impact are negligible.
- **JSON to Disk (Orphaned Folders)**: If a directory exists in `Mods/` but has no corresponding entry in the JSON, it is classified as orphaned and is recursively deleted.
- **Disk to JSON (Missing Folders)**: If a mod exists in the JSON but its physical directory is missing, the mod entry is purged from the database.

## 6. Concurrency and Race Condition Mitigation

Due to the asynchronous nature of the background watcher and OS-level file operations, strict synchronization primitives are required to prevent data corruption.

### 6.1. The Windows Pending Deletion Race Condition (`fs-utils.js`)
When `Remove-Item` is invoked, Windows marks the directory for deletion but processes the operation asynchronously. 
- **The Bug**: If the application immediately recreates the directory and extracts files into it, the OS will eventually finish the pending deletion task, silently wiping the newly extracted files.
- **The Fix**: The `removeDir` utility implements an active polling loop (up to 2 seconds). It continually calls `getStats` on the target path, yielding the event loop, and only resolves the promise once the OS throws an error confirming the path no longer exists.

### 6.2. The Active IO Lock (`lockedFolders`)
Because the background watcher aggressively deletes orphaned physical folders, it poses a risk to active downloads that are currently extracting to disk but haven't yet been registered in the JSON.
- **The Fix**: A Set (`lockedFolders`) is maintained in memory. When a download initiates, its target folder name is added to the Set. The background watcher strictly ignores any folder present in this Set. The folder is removed from the Set in a `finally` block once the JSON database transaction is complete or if the installation fails.
