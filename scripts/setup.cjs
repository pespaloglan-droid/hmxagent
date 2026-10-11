// postinstall: runtime dizinlerini hazirla, ffmpeg/playwright durumunu raporla
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execSync } = require("node:child_process");

const home = path.join(os.homedir(), ".hmx");
for (const d of ["sessions", "assets", "media", "logs", "providers"]) {
  fs.mkdirSync(path.join(home, d), { recursive: true });
}
console.log("HMX runtime dizinleri hazir:", home);

try {
  execSync("ffmpeg -version", { stdio: "ignore" });
  console.log("ffmpeg: OK");
} catch {
  console.warn("UYARI: ffmpeg bulunamadi. Birlestirme icin kur: https://ffmpeg.org/download.html");
}
console.log("Playwright tarayicisi icin bir kez calistir: npx playwright install chromium");
