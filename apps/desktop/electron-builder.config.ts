// Based on opencode-dev/packages/desktop/electron-builder.config.ts (MIT) — win paketleme deseni.
import type { Configuration } from "electron-builder";

const config: Configuration = {
  appId: "com.hmx.agent",
  productName: "HMX Agent",
  directories: { output: "../../release" },
  files: ["out/**", "package.json"],
  extraResources: [
    { from: "../web/dist", to: "web-dist" },
    { from: "assets/icon.png", to: "branding/icon.png" },
    { from: "../../config/providers", to: "config/providers" },
  ],
  win: { icon: "assets/icon.ico", target: ["nsis", "portable"] },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    artifactName: "HMX-Agent-Setup-${version}.${ext}",
  },
  portable: {
    artifactName: "HMX-Agent-${version}-portable.${ext}",
  },
};

export default config;
