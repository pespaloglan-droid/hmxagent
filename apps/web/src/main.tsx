import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/design-system.css";

// Renderer hatalarını merkezi JSONL kanalıyla raporla; mesaj içeriği/anahtar gönderilmez.
const report = (msg: string, meta: Record<string, unknown>) => {
  void fetch("/api/client-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level: "error", msg, meta }),
  }).catch(() => {});
};
window.addEventListener("error", (event) =>
  report("Arayüz hatası", { file: event.filename, line: event.lineno }),
);
window.addEventListener("unhandledrejection", () =>
  report("Arayüzde yakalanmamış Promise reddi", {}),
);

createRoot(document.getElementById("root")!).render(<App />);
