import type { T } from "./run.js";

export async function run(t: T) {
  const { startDashboard } = await import("@hmx/dashboard-api");

  const port = 41000 + Math.floor(Math.random() * 2000);
  const server = startDashboard(port);
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1) health ucu gercek veri dondurur
    const health = await (await fetch(`${base}/api/health`)).json();
    t("dashboard: /api/health ok + ffmpeg durumu", health.ok === true && typeof health.ffmpeg === "boolean");

    // 2) routing ucu tier zincirleri + kota takibi dondurur
    const routing = await (await fetch(`${base}/api/routing`)).json();
    t("dashboard: /api/routing zincir + hesap + tokenSaver", Array.isArray(routing.order.audio) && Array.isArray(routing.accounts) && !!routing.tokenSaver);

    // 3) route-preview: bilinmeyen model uyarisi
    const preview = await (await fetch(`${base}/api/route-preview`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "@audio:BilinmeyenModel test", uiSelection: {} }),
    })).json();
    t("dashboard: route-preview bilinmeyeni raporlar", preview.unknown?.length === 1);

    // 4) ana sayfa HTML sunar (React dist veya fallback)
    const html = await (await fetch(`${base}/`)).text();
    t("dashboard: / HTML sunar", html.includes("<"));

    // 5) accounts ucu dizi dondurur
    const accounts = await (await fetch(`${base}/api/accounts`)).json();
    t("dashboard: /api/accounts dizi", Array.isArray(accounts));
  } finally {
    server.close();
  }
}
