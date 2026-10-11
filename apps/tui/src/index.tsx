// Based on opencode-dev/packages/tui (MIT) — React ile terminal UI deseni (Ink).
// Cekirdek ile ayni HmxAgent kullanilir: UI != mantik.
import React, { useEffect, useState } from "react";
import { render, Box, Text } from "ink";
import TextInput from "ink-text-input";
import { HmxAgent } from "@hmx/agent-core";
import { AccountPool } from "@hmx/providers";
import { parsePromptRoute } from "@hmx/router";
import { loadProviderConfigs } from "@hmx/providers";

type Line = { kind: "user" | "agent" | "sys" | "err"; text: string; plan?: string[]; done?: boolean };

/** @-mention renklendirmesi: "@image:Flow AI" parcalari mor, gerisi normal */
function Colored({ text }: { text: string }) {
  const parts = text.split(/(@(?:image|video|audio|llm):[^@\s]+(?:\s[^@\s]+)*)/gi);
  return (
    <Text>
      {parts.map((p, i) =>
        /^@(image|video|audio|llm):/i.test(p) ? <Text key={i} color="magenta">{p}</Text> : <Text key={i}>{p}</Text>)}
    </Text>
  );
}

function StatusBar() {
  const [info, setInfo] = useState({ accounts: 0, cooldown: 0, model: "" });
  useEffect(() => {
    const load = () => {
      const pool = new AccountPool();
      const all = pool.listAll();
      setInfo({
        accounts: all.length,
        cooldown: all.filter((a) => a.status === "cooldown").length,
        model: process.env.HMX_LLM_MODEL ?? "qwen2.5:14b",
      });
    };
    load();
    const iv = setInterval(load, 15_000);
    return () => clearInterval(iv);
  }, []);
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text color="green">●</Text>
      <Text> {info.model}  </Text>
      <Text color="gray">|  hesap: {info.accounts}  cooldown: {info.cooldown}  |  cikis: exit</Text>
    </Box>
  );
}

function PlanSteps({ plan, done }: { plan: string[]; done?: boolean }) {
  return (
    <Box flexDirection="column" marginLeft={2}>
      {plan.map((p, i) => (
        <Text key={i} color={done ? "green" : "yellow"}>
          {done ? "✓" : "⏳"} {p}
        </Text>
      ))}
    </Box>
  );
}

function TuiApp() {
  const [agent] = useState(() => new HmxAgent());
  const [lines, setLines] = useState<Line[]>([{ kind: "sys", text: `HMX Agent TUI — oturum: ${agent.sessionId}` }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ planIdx: number } | null>(null);

  async function submit(text: string) {
    if (!text.trim()) return;
    if (["exit", "quit", "cikis"].includes(text.toLowerCase())) process.exit(0);

    // Plan onayi bekleniyorsa: e/h
    if (pending) {
      const ok = text.trim().toLowerCase() === "e";
      setPending(null);
      setLines((l) => [...l, { kind: "user", text }]);
      if (!ok) {
        setLines((l) => [...l, { kind: "sys", text: "Plan iptal edildi." }]);
        return;
      }
      setBusy(true);
      try {
        const reply = await agent.step("Plani uygula. Her adimdan sonra dogrulama yap ve <verification> raporu ile bitir.");
        setLines((l) => {
          const copy = [...l];
          if (copy[pending.planIdx]) copy[pending.planIdx] = { ...copy[pending.planIdx], done: true };
          return [...copy, { kind: "agent", text: reply }];
        });
      } catch (e: any) {
        setLines((l) => [...l, { kind: "err", text: `HMX DURDU: ${e.message}` }]);
      }
      setBusy(false);
      return;
    }

    // Yeni gorev: @-mention rotasi onizlemesi + plan
    setLines((l) => [...l, { kind: "user", text }]);
    const route = parsePromptRoute(text, {}, loadProviderConfigs());
    if (route.unknown.length > 0) {
      setLines((l) => [...l, { kind: "err", text: `Bilinmeyen model: ${route.unknown.map((u) => u.name).join(", ")}` }]);
    }
    setBusy(true);
    try {
      const { goal, plan } = await agent.startTask(text);
      setLines((l) => {
        const idx = l.length;
        setPending({ planIdx: idx });
        return [...l,
          { kind: "agent", text: `HEDEF: ${goal}` },
          { kind: "agent", text: "PLAN (onay: e, iptal: h)", plan: plan.split("\n").filter(Boolean), done: false },
        ];
      });
    } catch (e: any) {
      setLines((l) => [...l, { kind: "err", text: e.message }]);
    }
    setBusy(false);
  }

  return (
    <Box flexDirection="column">
      {lines.map((l, i) => (
        <Box key={i} flexDirection="column">
          <Text color={l.kind === "err" ? "red" : l.kind === "sys" ? "gray" : l.kind === "user" ? "cyan" : "white"}>
            {l.kind === "user" ? "sen> " : l.kind === "agent" ? "hmx> " : l.kind === "err" ? "!!! " : ""}
            {l.kind === "user" ? <Colored text={l.text} /> : l.text}
          </Text>
          {l.plan && <PlanSteps plan={l.plan} done={l.done} />}
        </Box>
      ))}
      {busy && <Text color="yellow">⏳ calisiyor…</Text>}
      <Box>
        <Text color="cyan">sen&gt; </Text>
        <TextInput value={input} onChange={setInput} onSubmit={submit} />
      </Box>
      <StatusBar />
    </Box>
  );
}

render(<TuiApp />);
