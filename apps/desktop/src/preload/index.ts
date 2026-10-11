// Guvenli IPC kopruleri (contextIsolation acik, nodeIntegration kapali)
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("hmxAPI", {
  platform: process.platform,
  openDataDir: (): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke("hmx:open-data-dir"),
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});
