import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { SimplePage } from "@/components/SimplePage";
import { Button } from "@/components/ui/button";
import { generateBrief } from "@/lib/brief.functions";

export const Route = createFileRoute("/_dash/ai")({
  head: () => ({
    meta: [
      { title: "AI Design Brief — STYLEVERSE" },
      {
        name: "description",
        content: "Describe a garment concept and get a polished, studio-ready design brief.",
      },
      { property: "og:title", content: "AI Design Brief — STYLEVERSE" },
      {
        property: "og:description",
        content: "Turn rough garment ideas into polished design briefs with AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  const run = useServerFn(generateBrief);
  const [concept, setConcept] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    if (concept.trim().length < 5) {
      toast.error("Describe your concept in a few words first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await run({ data: { concept } });
      if (r.error) setError(r.error);
      else setBrief(r.brief ?? "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      toast.success("Copied");
    } catch {
      toast.error("Clipboard access is unavailable in this browser");
    }
  }

  return (
    <SimplePage title="AI Design Brief">
      <div className="space-y-4 border-b pb-6">
        <label htmlFor="concept" className="eyebrow">
          Your garment concept
        </label>
        <textarea
          id="concept"
          rows={5}
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          maxLength={2000}
          disabled={loading}
          placeholder="e.g. An oversized cropped bomber in washed violet satin, inspired by 90s rave culture…"
          className="w-full rounded-lg border bg-secondary px-3 py-2 text-sm"
        />
        <Button onClick={go} disabled={loading} className="bg-brand">
          <Sparkles /> {loading ? "Writing brief…" : "Generate brief"}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      {brief && (
        <div aria-busy={loading} className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Design brief</p>
            <Button size="sm" variant="ghost" onClick={() => void copyBrief()}>
              <Copy /> Copy
            </Button>
          </div>
          <div className="design-brief">
            <Markdown>{brief}</Markdown>
          </div>
        </div>
      )}
    </SimplePage>
  );
}
