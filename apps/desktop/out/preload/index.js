"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("hmxAPI", {
  platform: process.platform,
  versions: { electron: process.versions.electron, chrome: process.versions.chrome }
});
