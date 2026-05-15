const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("weekbox", {
  version: "0.1.0"
});
