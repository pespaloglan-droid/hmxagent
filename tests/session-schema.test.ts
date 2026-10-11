import type { T } from "./run.js";

export async function run(t: T) {
  const { validateSessionsPersist } = await import("../apps/web/src/stores/schema.js");

  const valid = {
    sessions: {
      s1: {
        id: "s1", title: "Test", selectedAgentId: null, selectedModelId: null,
        activeTab: "chat", draft: "taslak", messages: [
          { id: "m1", role: "user", content: "selam", createdAt: 1 },
        ],
        scrollOffset: 42, updatedAt: 1,
      },
    },
    activeSessionId: "s1",
  };
  t("schema: gecerli persist yuklenir", validateSessionsPersist(valid)?.sessions.s1.draft === "taslak");

  t("schema: bozuk persist null doner (crash yok)", validateSessionsPersist({ sessions: { s1: { bozuk: true } }, activeSessionId: "s1" }) === null);
  t("schema: null/undefined guvenli", validateSessionsPersist(null) === null && validateSessionsPersist(undefined) === null);

  // Tutarsiz activeSessionId duzeltilir
  const fixed = validateSessionsPersist({ ...valid, activeSessionId: "yok-boyle" });
  t("schema: tutarsiz activeSessionId sifirlanir", fixed !== null && fixed.activeSessionId === null);
}
