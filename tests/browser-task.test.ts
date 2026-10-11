import type { T } from "./run.js";

/** Sahte sayfa: cagrilari kaydeder, "boom" selectorunde hata firlatir */
function fakePage() {
  const calls: string[] = [];
  return {
    calls,
    url: () => "https://site.test/page",
    goto: async (u: string) => { calls.push(`goto:${u}`); },
    click: async (s: string) => { calls.push(`click:${s}`); if (s.includes("boom")) throw new Error("element yok"); },
    fill: async (s: string, txt: string) => { calls.push(`fill:${s}:${txt}`); },
    textContent: async () => "sayfa icerigi",
    evaluate: async () => ({ url: "https://site.test/page", title: "Test", elements: ["[0] button#ok :: Tamam"], bodyText: "govde" }),
    waitForTimeout: async () => {},
  };
}

/** Sirali cevaplar veren sahte LLM */
function fakeLlm(replies: string[]) {
  let i = 0;
  return { chat: async () => replies[Math.min(i++, replies.length - 1)] };
}

export async function run(t: T) {
  const { runBrowserTask, parseModelAction, isDestructive } = await import("@hmx/agent-core");

  // 1) Eylem ayristirma
  t("bt: gecerli JSON eyleme cevrilir", JSON.stringify(parseModelAction('Tabii ki: {"action":"click","selector":"#ok"}')) === JSON.stringify({ action: "click", selector: "#ok", reason: undefined }));
  t("bt: gecersiz cevap null", parseModelAction("bilmiyorum") === null);

  // 2) Yikici eylem tespiti
  t("bt: delete butonu yikici", isDestructive({ action: "click", selector: "button.delete-video" }));
  t("bt: normal tiklama yikici degil", !isDestructive({ action: "click", selector: "#next-page" }));

  // 3) done ile tamamlanan gorev
  {
    const page = fakePage();
    const llm = fakeLlm(['{"action":"click","selector":"#ok"}', '{"action":"done","summary":"is tamam"}']);
    const r = await runBrowserTask(
      { url: "https://site.test", task: "test gorevi" },
      { llm: llm as any, openPage: async () => page as any },
    );
    t("bt: done ile tamamlanir", r.ok && r.summary === "is tamam" && r.steps === 2);
  }

  // 4) Onaysiz yikici eylem -> dur
  {
    const page = fakePage();
    const llm = fakeLlm(['{"action":"click","selector":"button.delete-all","reason":"hesabi sil"}']);
    const r = await runBrowserTask(
      { url: "https://site.test", task: "gorev" },
      { llm: llm as any, openPage: async () => page as any },
    );
    t("bt: onaysiz yikici eylem durdurur", !r.ok && r.error!.includes("onay"));
    t("bt: reddedilen yikici eylem icra edilmez", !page.calls.some((c) => c.includes("delete-all")));
  }

  // 5) Ayni eylem 2 kez basarisiz -> dur (Kural 1.5)
  {
    const page = fakePage();
    const llm = fakeLlm(['{"action":"click","selector":"#boom"}']);
    const r = await runBrowserTask(
      { url: "https://site.test", task: "gorev" },
      { llm: llm as any, openPage: async () => page as any },
    );
    t("bt: ayni eylem 2 kez basarisizsa durur", !r.ok && r.error!.includes("2+ kez"));
  }

  // 6) Adim limiti
  {
    const page = fakePage();
    const llm = fakeLlm(['{"action":"extract"}']);
    const r = await runBrowserTask(
      { url: "https://site.test", task: "bitmeyen gorev", maxSteps: 3 },
      { llm: llm as any, openPage: async () => page as any },
    );
    t("bt: adim limiti durdurur", !r.ok && r.error!.includes("Adim limiti") && r.steps === 3);
  }
}
