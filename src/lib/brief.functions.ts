import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ concept: z.string().trim().min(5).max(2000) });

const SYSTEM = `You are a senior fashion design director. Turn the designer's rough concept into a polished studio design brief in Markdown with these sections:
## Concept title
## Mood & story
## Silhouette & fit
## Colour palette (3-5 colours with HEX codes)
## Fabrics & materials
## Pattern & surface details
## Construction notes
## Target customer
Be concise, specific and production-minded.`;

export const generateBrief = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ brief?: string; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI is not configured." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: data.concept,
        reasoning: { effort: "low" },
        store: false,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, t);
      if (res.status === 429) return { error: "Too many requests — please try again in a moment." };
      if (res.status === 402) return { error: "AI credits are used up for this workspace." };
      let msg = "The AI could not create a brief right now.";
      try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? msg; } catch { /* keep */ }
      return { error: msg };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "", refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const frames = buf.split("\n\n");
      buf = frames.pop() ?? "";
      for (const f of frames) {
        const line = f.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          else if (ev.type === "response.refusal.delta") refused = true;
          else if (ev.type === "response.failed" || ev.type === "error") return { error: ev.response?.error?.message ?? ev.message ?? "Generation failed." };
        } catch { /* partial */ }
      }
    }
    if (refused || !out.trim()) return { error: "The AI declined to write a brief for this concept." };
    return { brief: out.trim() };
  });
