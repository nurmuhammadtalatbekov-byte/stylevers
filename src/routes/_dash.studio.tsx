
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Download,
  FileJson,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  GarmentScene,
  type SceneHandle,
  type View,
} from "@/components/studio/GarmentScene";
import { Button } from "@/components/ui/button";

import {
  COLLARS,
  GARMENTS,
  GARMENT_LABEL,
  SLEEVES,
  TOPS,
  MATERIALS,
  PALETTE,
  PART_LABEL,
  PATTERNS,
  hexToRgb,
  isHex,
  newDesign,
  rgbToHex,
  type Design,
  type PartId,
  type PartStyle,
} from "@/lib/fashion";

import { designSchema } from "@/lib/design-schema";
import { actions } from "@/lib/store";
import { FASHION_MODELS } from "@/lib/fashion-models";

import femalePreview from "@/assets/models/female-preview.webp.asset.json";

export const Route = createFileRoute("/_dash/studio")({
  ssr: false,

  validateSearch: (
    s: Record<string, unknown>,
  ): { id?: string } =>
    typeof s["id"] === "string"
      ? { id: s["id"] }
      : {},

  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        title: "3D Design Studio — STYLEVERSE",
      },
      {
        name: "description",
        content:
          "Design garments on a detailed female 3D fashion model: colours, fabrics, patterns and fit.",
      },
      {
        property: "og:title",
        content: "3D Design Studio — STYLEVERSE",
      },
      {
        property: "og:description",
        content:
          "Create garment studies on a female 3D fashion model.",
      },
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

    if (saved) {
      return structuredClone(saved);
    }

    const pending = sessionStorage.getItem(PENDING_KEY);

    if (pending) {
      sessionStorage.removeItem(PENDING_KEY);

      try {
        const parsed = designSchema.safeParse(
          JSON.parse(pending),
        );

        if (parsed.success) {
          return parsed.data;
        }
      } catch {
        // Invalid draft: start a new design.
      }
    }

    return newDesign();
  });

  const [part, setPart] = useState<PartId>("body");
  const [dirty, setDirty] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const saved = id ? actions.getDesign(id) : undefined;

    if (saved && saved.id !== design.id) {
      setDesign(structuredClone(saved));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<Design>) => {
    setDesign((current) => ({
      ...current,
      ...patch,
    }));

    setDirty(true);
  };

  const updatePart = (patch: Partial<PartStyle>) => {
    setDesign((current) => ({
      ...current,
      parts: {
        ...current.parts,
        [part]: {
          ...current.parts[part],
          ...patch,
        },
      },
    }));

    setDirty(true);
  };

  const p = design.parts[part];

  async function save() {
    setSaving(true);

    try {
      const preview = scene.current?.snapshot();
      const thumbnail = preview
        ? await downscale(preview)
        : undefined;

      const saved = actions.saveDesign(
        designSchema.parse({
          ...design,
          modelId: "female",
          preview: thumbnail,
        }),
      );

      setDesign(saved);
      setDirty(false);

      await navigate({
        to: "/studio",
        search: { id: saved.id },
        replace: true,
      });

      toast.success(`Saved “${saved.name}”`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function exportPng() {
    const url = scene.current?.snapshot();

    if (!url) {
      toast.error("3D preview is not ready");
      return;
    }

    download(url, `${slug(design.name)}.png`);
    toast.success("Preview exported");
  }

  function exportJson() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...design,
            preview: undefined,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );

    download(
      URL.createObjectURL(blob),
      `${slug(design.name)}.styleverse.json`,
    );
  }

  function importJson(file?: File) {
    if (!file) return;

    file.text().then((content) => {
      try {
        const parsed = designSchema.parse(
          JSON.parse(content),
        );

        const fresh = newDesign(parsed.garment);

        setDesign({
          ...fresh,
          ...parsed,
          id: newDesign().id,
          modelId: "female",
        });

        setDirty(true);

        toast.success(
          "Design opened — save to keep it",
        );
      } catch {
        toast.error(
          "That file isn't a STYLEVERSE design",
        );
      }
    });
  }

  function onUpload(file?: File) {
    if (!file) return;

    if (file.size > 1.5e6) {
      toast.error(
        "Please use an image under 1.5 MB",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updatePart({
        pattern: "custom",
        customTexture: String(reader.result),
      });
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="grid lg:h-[min(900px,calc(100vh-4rem))] lg:grid-cols-[1fr_360px]">
      <section className="relative h-[58vh] min-h-[380px] lg:h-full">
        <GarmentScene
          ref={scene}
          design={design}
        />

        {/* Studio environment */}
        <div className="glass absolute bottom-3 left-3 flex gap-1 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={
              design.studioEnvironment !== "dark"
            }
            onClick={() =>
              update({ studioEnvironment: "light" })
            }
          >
            Light
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-pressed={
              design.studioEnvironment === "dark"
            }
            onClick={() =>
              update({ studioEnvironment: "dark" })
            }
          >
            Dark
          </Button>
        </div>

        {/* Camera views */}
        <div className="glass absolute left-3 top-3 flex flex-wrap gap-1 rounded-xl p-1">
          {(
            ["front", "back", "left", "right"] as View[]
          ).map((view) => (
            <Button
              variant="ghost"
              key={view}
              onClick={() =>
                scene.current?.setView(view)
              }
              className="rounded-lg px-3 py-1.5 text-xs capitalize hover:bg-secondary"
            >
              {view}
            </Button>
          ))}

          <Button
            variant="ghost"
            aria-pressed={spinning}
            onClick={() => {
              const next = !spinning;

              setSpinning(next);
              scene.current?.spin(next);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              spinning
                ? "bg-accent"
                : "hover:bg-secondary"
            }`}
          >
            360°
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="glass absolute right-3 top-3 flex flex-col gap-1 rounded-xl p-1">
          <Button
            variant="ghost"
            aria-label="Zoom in"
            onClick={() =>
              scene.current?.zoom(0.8)
            }
            className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
          >
            <Plus className="size-4" />
          </Button>

          <Button
            variant="ghost"
            aria-label="Zoom out"
            onClick={() =>
              scene.current?.zoom(1.25)
            }
            className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
          >
            <Minus className="size-4" />
          </Button>

          <Button
            variant="ghost"
            aria-label="Reset camera"
            onClick={() =>
              scene.current?.reset()
            }
            className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </section>

      {/* Studio editor */}
      <aside className="space-y-6 overflow-y-auto border-l p-5">
        {/* Design management */}
        <div className="space-y-2">
          <label
            className="eyebrow"
            htmlFor="dname"
          >
            Design name
          </label>

          <input
            id="dname"
            value={design.name}
            onChange={(event) =>
              update({ name: event.target.value })
            }
            className="w-full rounded-lg border bg-secondary px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              disabled={saving}
              onClick={save}
              className="bg-brand"
            >
              <Save />
              {saving
                ? "Saving…"
                : dirty
                  ? "Save"
                  : "Saved"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDesign(newDesign(design.garment));
                setDirty(true);

                navigate({
                  to: "/studio",
                  search: {},
                  replace: true,
                });
              }}
            >
              New
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                update({
                  parts: newDesign().parts,
                  fit: 1,
                  length: 1,
                  sleeve: "auto",
                  collar: "auto",
                });

                scene.current?.reset();
              }}
            >
              <RotateCcw />
              Reset
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={exportPng}
            >
              <Download />
              PNG
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={exportJson}
            >
              <FileJson />
              File
            </Button>

            <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-3 text-xs hover:bg-secondary">
              <Upload className="size-3.5" />
              Open file

              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(event) =>
                  importJson(event.target.files?.[0])
                }
              />
            </label>
          </div>
        </div>

        {/* Female fashion model */}
        <Section title="Fashion model">
          <div className="grid grid-cols-1 gap-2">
            {FASHION_MODELS
              .filter((model) => model.id === "female")
              .map((model) => (
                <div
                  key={model.id}
                  className="overflow-hidden rounded-xl border border-primary bg-accent p-3"
                >
                  <img
                    src={femalePreview.url}
                    alt={model.name}
                    className="aspect-[4/3] w-full rounded-lg object-contain"
                  />

                  <div className="mt-3 space-y-1 text-center">
                    <p className="text-sm font-medium">
                      {model.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {Math.round(model.height * 100)} cm
                      {" · "}
                      {model.build}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Chip
              active={design.modelPose !== "runway"}
              onClick={() =>
                update({ modelPose: "standing" })
              }
            >
              Fitting pose
            </Chip>

            <Chip
              active={design.modelPose === "runway"}
              onClick={() =>
                update({ modelPose: "runway" })
              }
            >
              Model walk
            </Chip>
          </div>
        </Section>

        {/* Garment selection */}
        <Section title="Garment">
          <div className="grid grid-cols-4 gap-1.5">
            {GARMENTS.map((garment) => (
              <Chip
                key={garment}
                active={design.garment === garment}
                onClick={() =>
                  update({ garment })
                }
              >
                {GARMENT_LABEL[garment]}
              </Chip>
            ))}
          </div>

          <Slider
            label="Fit"
            value={design.fit}
            min={0.85}
            max={1.25}
            onChange={(fit) => update({ fit })}
            fmt={(value) =>
              value < 0.95
                ? "Slim"
                : value > 1.1
                  ? "Oversized"
                  : "Regular"
            }
          />

          <Slider
            label="Length"
            value={design.length}
            min={0.8}
            max={1.2}
            onChange={(length) =>
              update({ length })
            }
            fmt={(value) =>
              `${Math.round(value * 100)}%`
            }
          />
        </Section>

        {/* Sleeves and collar */}
        {TOPS.includes(design.garment) && (
          <Section title="Sleeves & collar">
            <div className="grid grid-cols-5 gap-1.5">
              {SLEEVES.map((sleeve) => (
                <Chip
                  key={sleeve}
                  active={
                    (design.sleeve ?? "auto") === sleeve
                  }
                  onClick={() =>
                    update({ sleeve })
                  }
                >
                  {sleeve}
                </Chip>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {COLLARS.map((collar) => (
                <Chip
                  key={collar}
                  active={
                    (design.collar ?? "auto") === collar
                  }
                  onClick={() =>
                    update({ collar })
                  }
                >
                  {collar}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {/* Garment parts */}
        <Section title="Garment part">
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(PART_LABEL) as PartId[]).map(
              (key) => (
                <Chip
                  key={key}
                  active={part === key}
                  onClick={() => setPart(key)}
                >
                  {PART_LABEL[key]}
                </Chip>
              ),
            )}
          </div>
        </Section>

        {/* Colour editor */}
        <Section title="Colour">
          <ColorEditor
            value={p.color}
            onChange={(color) =>
              updatePart({ color })
            }
          />
        </Section>

        {/* Material editor */}
        <Section title="Material">
          <div className="grid grid-cols-4 gap-1.5">
            {MATERIALS.map((material) => (
              <Chip
                key={material}
                active={p.material === material}
                onClick={() =>
                  updatePart({ material })
                }
              >
                {material}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Pattern editor */}
        <Section title="Pattern">
          <div className="grid grid-cols-3 gap-1.5">
            {PATTERNS
              .filter((pattern) => pattern !== "custom")
              .map((pattern) => (
                <Chip
                  key={pattern}
                  active={p.pattern === pattern}
                  onClick={() =>
                    updatePart({ pattern })
                  }
                >
                  {pattern}
                </Chip>
              ))}

            <label
              className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs ${
                p.pattern === "custom"
                  ? "border-primary bg-accent"
                  : "hover:bg-secondary"
              }`}
            >
              <Upload className="size-3" />
              Upload

              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) =>
                  onUpload(event.target.files?.[0])
                }
              />
            </label>
          </div>

          {p.pattern !== "solid" &&
            p.pattern !== "custom" && (
              <div className="pt-2">
                <p className="eyebrow mb-2">
                  Pattern colour
                </p>

                <ColorEditor
                  value={p.accent}
                  onChange={(accent) =>
                    updatePart({ accent })
                  }
                  compact
                />
              </div>
            )}
        </Section>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">{title}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      aria-pressed={active}
      className={`h-auto min-h-9 whitespace-normal rounded-lg border px-2 py-2 text-xs capitalize transition-colors ${
        active
          ? "border-primary bg-accent text-foreground"
          : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </Button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  fmt: (value: number) => string;
}) {
  return (
    <label className="block text-xs">
      <span className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">
          {fmt(value)}
        </span>
      </span>

      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(event) =>
          onChange(+event.target.value)
        }
        className="mt-2 w-full accent-[var(--primary)]"
      />
    </label>
  );
}

function ColorEditor({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [hex, setHex] = useState(value);

  useEffect(() => {
    setHex(value);
  }, [value]);

  const rgb = hexToRgb(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PALETTE.map((color) => (
          <Button
            variant="ghost"
            key={color}
            aria-label={`Colour ${color}`}
            onClick={() => onChange(color)}
            style={{ background: color }}
            className={`size-7 rounded-full border-2 ${
              value.toLowerCase() === color
                ? "border-foreground"
                : "border-transparent"
            }`}
          />
        ))}

        <input
          type="color"
          aria-label="Pick custom colour"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="size-7 cursor-pointer rounded-full bg-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <span
          className="size-9 shrink-0 rounded-lg border"
          style={{ background: value }}
          aria-hidden
        />

        <input
          aria-label="HEX colour"
          value={hex}
          onChange={(event) => {
            const next = event.target.value;
            setHex(next);

            if (isHex(next)) {
              onChange(next);
            }
          }}
          className={`w-full rounded-lg border bg-secondary px-3 py-2 font-mono text-xs ${
            isHex(hex) ? "" : "border-destructive"
          }`}
        />
      </div>

      {!compact &&
        (["R", "G", "B"] as const).map(
          (channel, index) => (
            <label
              key={channel}
              className="flex items-center gap-2 text-xs"
            >
              <span className="w-3 text-muted-foreground">
                {channel}
              </span>

              <input
                type="range"
                min={0}
                max={255}
                value={rgb[index]}
                className="w-full accent-[var(--primary)]"
                onChange={(event) => {
                  const next = [...rgb] as [
                    number,
                    number,
                    number,
                  ];

                  next[index] = +event.target.value;

                  onChange(rgbToHex(...next));
                }}
              />

              <span className="w-8 text-right font-mono">
                {rgb[index]}
              </span>
            </label>
          ),
        )}
    </div>
  );
}

function download(url: string, name: string) {
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = name;
  anchor.click();

  if (url.startsWith("blob:")) {
    setTimeout(
      () => URL.revokeObjectURL(url),
      1000,
    );
  }
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "design";

function downscale(src: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      const width = 320;
      const height = 400;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        resolve("");
        return;
      }

      const scale = Math.max(
        width / image.width,
        height / image.height,
      );

      context.drawImage(
        image,
        (width - image.width * scale) / 2,
        (height - image.height * scale) / 2,
        image.width * scale,
        image.height * scale,
      );

      resolve(
        canvas.toDataURL("image/jpeg", 0.8),
      );
    };

    image.onerror = () => resolve("");
    image.src = src;
  });
}

export { PENDING_KEY };
