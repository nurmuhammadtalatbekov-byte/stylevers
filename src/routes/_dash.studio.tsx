import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, FileJson, Minus, Plus, RotateCcw, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GarmentScene, type SceneHandle, type View } from "@/components/studio/GarmentScene";
import { Button } from "@/components/ui/button";
import {
  GARMENTS, GARMENT_LABEL, MATERIALS, PALETTE, PART_LABEL, PATTERNS, hexToRgb, isHex, newDesign, rgbToHex,
  type Design, type PartId, type PartStyle,
} from "@/lib/fashion";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/_dash/studio")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s.id === "string" ? { id: s.id } : {}),
  head: () => ({
    meta: [
      { title: "3D Design Studio — STYLEVERSE" },
      { name: "description", content: "Design garments on a real-time 3D mannequin: colours, fabrics, patterns and fit." },
      { property: "og:title", content: "3D Design Studio — STYLEVERSE" },
      { property: "og:description", content: "Design garments on a real-time 3D mannequin." },
    ],
  }),
  component: Studio,
});

const PENDING_KEY = "styleverse:pending";

function Studio() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const scene = useRef<SceneHandle>(null);
  const [design, setDesign] = useState<Design>(() => {
    const saved = id ? actions.getDesign(id) : undefined;
    if (saved) return structuredClone(saved);
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (pending) { sessionStorage.removeItem(PENDING_KEY); return JSON.parse(pending) as Design; }
    return newDesign();
  });
  const [part, setPart] = useState<PartId>("body");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const saved = id ? actions.getDesign(id) : undefined;
    if (saved && saved.id !== design.id) setDesign(structuredClone(saved));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<Design>) => { setDesign((d) => ({ ...d, ...patch })); setDirty(true); };
  const updatePart = (patch: Partial<PartStyle>) => {
    setDesign((d) => ({ ...d, parts: { ...d.parts, [part]: { ...d.parts[part], ...patch } } })); setDirty(true);
  };
  const p = design.parts[part];

  function save() {
    try {
      const preview = scene.current?.snapshot();
      const thumb = preview ? downscale(preview) : Promise.resolve(undefined);
      thumb.then((t) => {
        const saved = actions.saveDesign({ ...design, preview: t });
        setDesign(saved); setDirty(false);
        navigate({ to: "/studio", search: { id: saved.id }, replace: true });
        toast.success(`Saved “${saved.name}”`);
      });
    } catch (e) { toast.error((e as Error).message); }
  }
  function exportPng() {
    const url = scene.current?.snapshot(); if (!url) return;
    download(url, `${slug(design.name)}.png`); toast.success("Preview exported");
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify({ ...design, preview: undefined }, null, 2)], { type: "application/json" });
    download(URL.createObjectURL(blob), `${slug(design.name)}.styleverse.json`);
  }
  function onUpload(file?: File) {
    if (!file) return;
    if (file.size > 1.5e6) return toast.error("Please use an image under 1.5 MB");
    const r = new FileReader();
    r.onload = () => updatePart({ pattern: "custom", customTexture: String(r.result) });
    r.readAsDataURL(file);
  }

  return (
    <div className="grid lg:h-[calc(100vh-4rem)] lg:grid-cols-[1fr_360px]">
      <section className="relative h-[58vh] min-h-[380px] lg:h-full">
        <GarmentScene ref={scene} design={design} />
        <div className="glass absolute left-3 top-3 flex flex-wrap gap-1 rounded-xl p-1">
          {(["front", "back", "left", "right"] as View[]).map((v) => (
            <button key={v} onClick={() => scene.current?.setView(v)} className="rounded-lg px-3 py-1.5 text-xs capitalize hover:bg-secondary">{v}</button>
          ))}
        </div>
        <div className="glass absolute right-3 top-3 flex flex-col gap-1 rounded-xl p-1">
          <button aria-label="Zoom in" onClick={() => scene.current?.zoom(0.8)} className="grid size-8 place-items-center rounded-lg hover:bg-secondary"><Plus className="size-4" /></button>
          <button aria-label="Zoom out" onClick={() => scene.current?.zoom(1.25)} className="grid size-8 place-items-center rounded-lg hover:bg-secondary"><Minus className="size-4" /></button>
          <button aria-label="Reset camera" onClick={() => scene.current?.reset()} className="grid size-8 place-items-center rounded-lg hover:bg-secondary"><RotateCcw className="size-4" /></button>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-3 text-xs text-muted-foreground">Drag to rotate · scroll/pinch to zoom · right-drag or two fingers to pan</p>
      </section>

      <aside className="space-y-6 overflow-y-auto border-l p-5">
        <div className="space-y-2">
          <label className="eyebrow" htmlFor="dname">Design name</label>
          <input id="dname" value={design.name} onChange={(e) => update({ name: e.target.value })} className="w-full rounded-lg border bg-secondary px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={save} className="bg-brand"><Save /> {dirty ? "Save" : "Saved"}</Button>
            <Button size="sm" variant="outline" onClick={() => { setDesign(newDesign(design.garment)); setDirty(true); navigate({ to: "/studio", search: {}, replace: true }); }}>New</Button>
            <Button size="sm" variant="outline" onClick={() => { update({ parts: newDesign().parts, fit: 1, length: 1 }); scene.current?.reset(); }}><RotateCcw /> Reset</Button>
            <Button size="sm" variant="ghost" onClick={exportPng}><Download /> PNG</Button>
            <Button size="sm" variant="ghost" onClick={exportJson}><FileJson /> File</Button>
          </div>
        </div>

        <Section title="Garment">
          <div className="grid grid-cols-4 gap-1.5">
            {GARMENTS.map((g) => (
              <Chip key={g} active={design.garment === g} onClick={() => update({ garment: g })}>{GARMENT_LABEL[g]}</Chip>
            ))}
          </div>
          <Slider label="Fit" value={design.fit} min={0.85} max={1.25} onChange={(fit) => update({ fit })} fmt={(v) => (v < 0.95 ? "Slim" : v > 1.1 ? "Oversized" : "Regular")} />
          <Slider label="Length" value={design.length} min={0.8} max={1.2} onChange={(length) => update({ length })} fmt={(v) => `${Math.round(v * 100)}%`} />
        </Section>

        <Section title="Garment part">
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(PART_LABEL) as PartId[]).map((k) => <Chip key={k} active={part === k} onClick={() => setPart(k)}>{PART_LABEL[k]}</Chip>)}
          </div>
        </Section>

        <Section title="Colour">
          <ColorEditor value={p.color} onChange={(color) => updatePart({ color })} />
        </Section>

        <Section title="Material">
          <div className="grid grid-cols-4 gap-1.5">
            {MATERIALS.map((m) => <Chip key={m} active={p.material === m} onClick={() => updatePart({ material: m })}>{m}</Chip>)}
          </div>
        </Section>

        <Section title="Pattern">
          <div className="grid grid-cols-3 gap-1.5">
            {PATTERNS.filter((x) => x !== "custom").map((x) => <Chip key={x} active={p.pattern === x} onClick={() => updatePart({ pattern: x })}>{x}</Chip>)}
            <label className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs ${p.pattern === "custom" ? "border-primary bg-accent" : "hover:bg-secondary"}`}>
              <Upload className="size-3" /> Upload
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
            </label>
          </div>
          {p.pattern !== "solid" && p.pattern !== "custom" && (
            <div className="pt-2"><p className="eyebrow mb-2">Pattern colour</p><ColorEditor value={p.accent} onChange={(accent) => updatePart({ accent })} compact /></div>
          )}
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-3"><p className="eyebrow">{title}</p>{children}</div>;
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`rounded-lg border px-2 py-2 text-xs capitalize transition-colors ${active ? "border-primary bg-accent text-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
      {children}
    </button>
  );
}
function Slider({ label, value, min, max, onChange, fmt }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <label className="block text-xs">
      <span className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground">{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
    </label>
  );
}
function ColorEditor({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const rgb = hexToRgb(value);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PALETTE.map((c) => (
          <button key={c} aria-label={`Colour ${c}`} onClick={() => onChange(c)} style={{ background: c }}
            className={`size-7 rounded-full border-2 ${value.toLowerCase() === c ? "border-foreground" : "border-transparent"}`} />
        ))}
        <input type="color" aria-label="Pick custom colour" value={value} onChange={(e) => onChange(e.target.value)} className="size-7 cursor-pointer rounded-full bg-transparent" />
      </div>
      <div className="flex items-center gap-2">
        <span className="size-9 shrink-0 rounded-lg border" style={{ background: value }} aria-hidden />
        <input aria-label="HEX colour" value={hex} onChange={(e) => { setHex(e.target.value); if (isHex(e.target.value)) onChange(e.target.value); }}
          className={`w-full rounded-lg border bg-secondary px-3 py-2 font-mono text-xs ${isHex(hex) ? "" : "border-destructive"}`} />
      </div>
      {!compact && (["R", "G", "B"] as const).map((ch, i) => (
        <label key={ch} className="flex items-center gap-2 text-xs">
          <span className="w-3 text-muted-foreground">{ch}</span>
          <input type="range" min={0} max={255} value={rgb[i]} className="w-full accent-[var(--primary)]"
            onChange={(e) => { const n = [...rgb] as [number, number, number]; n[i] = +e.target.value; onChange(rgbToHex(...n)); }} />
          <span className="w-8 text-right font-mono">{rgb[i]}</span>
        </label>
      ))}
    </div>
  );
}

function download(url: string, name: string) { const a = document.createElement("a"); a.href = url; a.download = name; a.click(); }
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design";
function downscale(src: string): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); const w = 320; const h = 400; c.width = w; c.height = h;
      const g = c.getContext("2d")!; const s = Math.max(w / img.width, h / img.height);
      g.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => res("");
    img.src = src;
  });
}

export { PENDING_KEY };
