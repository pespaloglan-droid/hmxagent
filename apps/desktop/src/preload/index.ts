// Guvenli IPC kopruleri (contextIsolation acik, nodeIntegration kapali)
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("hmxAPI", {
  platform: process.platform,
  versions: { electron: process.versions.electron, chrome: process.versions.chrome },
});
