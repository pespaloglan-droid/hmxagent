import { HMX_SYSTEM_PROMPT } from "./prompt.js";
import { LlmClient, type ChatMessage } from "@hmx/core";
import { TaskLedger } from "./ledger.js";

/**
 * HMX Agent dongusu.
 * Kural 1.2'nin teknik karsiligi: her 5 adimda bir hedef, baglama tekrar enjekte edilir.
 * Kural 1.5'in karsiligi: ayni hata 2 kez ust uste gelirse dongu durur.
 *
 * Root-cause fix'ler:
 *  - chat(): plan-onay akisina GIRMEDEN direkt (streaming) sohbet — basit mesajlar icin
 *  - setModel(): session bozulmadan model degisimi (history korunur)
 *  - agent profili: AgentRegistry'den promptAddon ile davranis varyanti
 */
export class HmxAgent {
  private ledger = new TaskLedger();
  private history: ChatMessage[] = [];
  private lastError: string | null = null;
  private errorStreak = 0;
  private promptAddon: string;

  constructor(private llm: LlmClient = LlmClient.fromEnv(), promptAddon = "") {
    this.promptAddon = promptAddon;
    this.history.push({ role: "system", content: HMX_SYSTEM_PROMPT + this.promptAddon });
  }

  get sessionId() {
    return this.ledger.sessionId;
  }

  get currentModel() {
    return this.llm.model;
  }

  /** Session'i bozmadan model degistir (history ve hedef korunur) */
  setModel(model: string) {
    this.llm = this.llm.withModel(model);
  }

  /**
   * Direkt sohbet: plan/onay dongusune girmeden tek mesajlik yanit.
   * Streaming icin onToken ver; verilmezse tek parca doner.
   */
  async chat(userContent: string, onToken?: (token: string) => void): Promise<string> {
    this.ledger.log("action", `chat: ${userContent.slice(0, 120)}`);
    const out = await this.safeChat(userContent, onToken);
    this.ledger.log("verify", out.slice(0, 500));
    return out;
  }

  /** Yeni gorev: once goal + plan urettir, kullaniciya goster. */
  async startTask(userRequest: string): Promise<{ goal: string; plan: string }> {
    const goalPrompt = `Kullanici istegi: "${userRequest}"\n\nGorev dongusu ADIM 0 ve ADIM 2'yi uygula:\n<goal> ... </goal>\n<plan> ... </plan>\nSadece bu iki blogu yaz.`;
    this.ledger.log("goal", userRequest);
    const out = await this.safeChat(goalPrompt);
    this.ledger.log("plan", out);
    const goal = out.match(/<goal>([\s\S]*?)<\/goal>/)?.[1]?.trim() ?? userRequest;
    const plan = out.match(/<plan>([\s\S]*?)<\/plan>/)?.[1]?.trim() ?? out;
    return { goal, plan };
  }

  /** Bir icra adimi calistir. */
  async step(instruction: string): Promise<string> {
    // Kural 1.2: 5 adimda bir hedef hatirlatmasi
    if (this.ledger.shouldReinjectGoal()) {
      this.history.push({
        role: "system",
        content: `[HEDEF HATIRLATMA] Ana hedefin: ${this.ledger.getGoal()}. Bu adim bu hedefe hizmet ediyor mu?`,
      });
    }
    this.ledger.log("action", instruction);
    const out = await this.safeChat(instruction);
    this.ledger.log("verify", out.slice(0, 500));
    return out;
  }

  private async safeChat(userContent: string, onToken?: (token: string) => void): Promise<string> {
    this.history.push({ role: "user", content: userContent });
    try {
      const reply = onToken
        ? await this.llm.chatStream(this.history, onToken)
        : await this.llm.chat(this.history);
      this.history.push({ role: "assistant", content: reply });
      this.errorStreak = 0;
      this.lastError = null;
      return reply;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Kural 1.5: ayni hata 2 kez ust uste -> dur
      if (this.lastError === msg) {
        this.errorStreak++;
        if (this.errorStreak >= 2) {
          this.ledger.log("error", `Ayni hata 2+ kez: ${msg}. Duruldu, strateji degistirilmeli.`);
          throw new Error(`HMX DURDU: Ayni hata tekrarlandi (${msg}). Kok nedeni cozmeden devam etmiyorum.`);
        }
      } else {
        this.errorStreak = 1;
      }
      this.lastError = msg;
      this.ledger.log("error", msg);
      throw err;
    }
  }

  getLedgerFile() {
    return this.ledger.getFile();
  }
}
