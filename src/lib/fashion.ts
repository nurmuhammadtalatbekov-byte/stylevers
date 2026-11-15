// Pure data + rules for garments, materials and patterns (no React, no three.js).
import type { ModelId, ModelPose } from "./fashion-models";

export const GARMENTS = [
  "tshirt",
  "shirt",
  "hoodie",
  "jacket",
  "dress",
  "trousers",
  "skirt",
  "coat",
] as const;
export type GarmentType = (typeof GARMENTS)[number];
export const GARMENT_LABEL: Record<GarmentType, string> = {
  tshirt: "T-shirt",
  shirt: "Shirt",
  hoodie: "Hoodie",
  jacket: "Jacket",
  dress: "Dress",
  trousers: "Trousers",
  skirt: "Skirt",
  coat: "Coat",
};

export const MATERIALS = [
  "cotton",
  "denim",
  "leather",
  "silk",
  "wool",
  "satin",
  "linen",
  "velvet",
  "chiffon",
  "organza",
] as const;
export type MaterialType = (typeof MATERIALS)[number];
export const MATERIAL_PROPS: Record<
  MaterialType,
  {
    roughness: number;
    metalness: number;
    sheen: number;
    clearcoat: number;
    weave: number;
    opacity?: number;
  }
> = {
  cotton: { roughness: 0.9, metalness: 0, sheen: 0.3, clearcoat: 0, weave: 0.08 },
  denim: { roughness: 0.85, metalness: 0, sheen: 0.1, clearcoat: 0, weave: 0.22 },
  leather: { roughness: 0.38, metalness: 0.05, sheen: 0, clearcoat: 0.45, weave: 0.03 },
  silk: { roughness: 0.28, metalness: 0.05, sheen: 1, clearcoat: 0.1, weave: 0.02 },
  wool: { roughness: 1, metalness: 0, sheen: 0.6, clearcoat: 0, weave: 0.18 },
  satin: { roughness: 0.16, metalness: 0.08, sheen: 0.8, clearcoat: 0.6, weave: 0.01 },
  linen: { roughness: 0.95, metalness: 0, sheen: 0.2, clearcoat: 0, weave: 0.16 },
  velvet: { roughness: 0.95, metalness: 0, sheen: 1, clearcoat: 0, weave: 0.12 },
  chiffon: { roughness: 0.6, metalness: 0, sheen: 0.4, clearcoat: 0, weave: 0.04, opacity: 0.65 },
  organza: {
    roughness: 0.35,
    metalness: 0,
    sheen: 0.7,
    clearcoat: 0.15,
    weave: 0.05,
    opacity: 0.48,
  },
};

export const PATTERNS = ["solid", "stripes", "floral", "geometric", "abstract", "custom"] as const;
export type PatternType = (typeof PATTERNS)[number];

export const SLEEVES = ["auto", "none", "short", "elbow", "long"] as const;
export type SleeveStyle = (typeof SLEEVES)[number];
export const SLEEVE_LEN: Record<Exclude<SleeveStyle, "auto">, number> = {
  none: 0,
  short: 0.2,
  elbow: 0.36,
  long: 0.58,
};
export const COLLARS = ["auto", "none", "crew", "stand", "hood"] as const;
export type CollarStyle = (typeof COLLARS)[number];
export const TOPS: readonly string[] = ["tshirt", "shirt", "hoodie", "jacket", "coat"];

export type PartId = "body" | "sleeves" | "trim";
export const PART_LABEL: Record<PartId, string> = {
  body: "Main body",
  sleeves: "Sleeves / legs",
  trim: "Trim & details",
};

export interface PartStyle {
  color: string;
  accent: string;
  material: MaterialType;
  pattern: PatternType;
  customTexture?: string | undefined;
}

export interface Design {
  id: string;
  name: string;
  garment: GarmentType;
  fit: number; // 0.85 – 1.25
  length: number; // 0.8 – 1.2
  parts: Record<PartId, PartStyle>;
  sleeve?: SleeveStyle | undefined;
  collar?: CollarStyle | undefined;
  modelId?: ModelId | undefined;
  modelPose?: ModelPose | undefined;
  studioEnvironment?: "light" | "dark" | undefined;
  collectionId?: string | undefined;
  preview?: string | undefined;
  updatedAt: number;
}

export const PALETTE = [
  "#0d0d10",
  "#f4f2ee",
  "#7c3aed",
  "#22d3ee",
  "#1e3a8a",
  "#9f1239",
  "#d4a373",
  "#3f6212",
  "#6b7280",
  "#f59e0b",
];

export function defaultParts(): Record<PartId, PartStyle> {
  return {
    body: { color: "#15151a", accent: "#7c3aed", material: "cotton", pattern: "solid" },
    sleeves: { color: "#15151a", accent: "#7c3aed", material: "cotton", pattern: "solid" },
    trim: { color: "#7c3aed", accent: "#22d3ee", material: "satin", pattern: "solid" },
  };
}

export function newDesign(garment: GarmentType = "hoodie"): Design {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    name: "Untitled design",
    garment,
    fit: 1,
    length: 1,
    parts: defaultParts(),
    updatedAt: Date.now(),
  };
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1] ?? "0", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")
  );
}
export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);
