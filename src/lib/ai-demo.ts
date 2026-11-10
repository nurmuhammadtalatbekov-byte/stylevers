// Demo-mode design interpreter: deterministic keyword parsing, no external AI.
import type { GarmentType, MaterialType, PatternType } from "./fashion";

const COLORS: Record<string, string> = {
  black: "#0d0d10", white: "#f4f2ee", ivory: "#efe9dc", cream: "#efe6d2", beige: "#d6c6a8", grey: "#6b7280", gray: "#6b7280",
  charcoal: "#2a2a30", violet: "#7c3aed", purple: "#7c3aed", lavender: "#b9a3f0", cyan: "#22d3ee", teal: "#0f766e",
  blue: "#1d4ed8", navy: "#1e2a4a", red: "#b91c1c", burgundy: "#6d1426", pink: "#ec4899", green: "#3f6212",
  olive: "#5b6236", emerald: "#047857", yellow: "#eab308", gold: "#c9a227", orange: "#ea580c", brown: "#6b4226", silver: "#c0c4cc",
};
const GARMENT_WORDS: [RegExp, GarmentType][] = [
  [/t-?shirt|tee\b/, "tshirt"], [/hoodie|sweatshirt/, "hoodie"], [/jacket|bomber|blazer/, "jacket"], [/coat|trench|overcoat/, "coat"],
  [/dress|gown/, "dress"], [/trouser|pants|jeans|slacks/, "trousers"], [/skirt/, "skirt"], [/shirt|blouse/, "shirt"],
];
const MATERIAL_WORDS: MaterialType[] = ["denim", "leather", "silk", "wool", "satin", "linen", "cotton"];
const PATTERN_WORDS: [RegExp, PatternType][] = [
  [/stripe/, "stripes"], [/floral|flower/, "floral"], [/geometric|grid|triangle/, "geometric"], [/abstract|paint|marble/, "abstract"],
];
const STYLE_DEFAULTS: [RegExp, { material: MaterialType; garment: GarmentType; note: string }][] = [
  [/street/, { material: "cotton", garment: "hoodie", note: "Streetwear reads best in heavyweight cotton with a relaxed fit." }],
  [/luxury|premium|elegant/, { material: "silk", garment: "dress", note: "Luxury pieces benefit from fluid silk or satin with minimal trims." }],
  [/minimal/, { material: "linen", garment: "shirt", note: "Minimalism: tonal palettes, linen or cotton, clean lines." }],
  [/futur|cyber|tech/, { material: "satin", garment: "jacket", note: "Futuristic looks pop with high-sheen satin and contrast trims." }],
  [/winter|warm|cozy/, { material: "wool", garment: "coat", note: "Cold-weather design: wool body, longer length." }],
];

export interface Interpretation {
  garment: GarmentType;
  colors: string[];
  material: MaterialType;
  pattern: PatternType;
  fit: number;
  length: number;
  notes: string[];
  fabrics: MaterialType[];
}

export function interpret(prompt: string): Interpretation {
  const p = prompt.toLowerCase();
  const notes: string[] = [];
  const style = STYLE_DEFAULTS.find(([r]) => r.test(p))?.[1];
  const garment = GARMENT_WORDS.find(([r]) => r.test(p))?.[1] ?? style?.garment ?? "tshirt";
  const material = MATERIAL_WORDS.find((m) => p.includes(m)) ?? style?.material ?? "cotton";
  const pattern = PATTERN_WORDS.find(([r]) => r.test(p))?.[1] ?? "solid";
  const found = Object.keys(COLORS)
    .map((k) => ({ k, i: p.indexOf(k) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => COLORS[x.k] ?? "#15151a");
  const colors = [...new Set(found)];
  if (colors.length === 0) colors.push("#15151a", "#7c3aed");
  if (colors.length === 1) colors.push(colors[0] === "#f4f2ee" ? "#0d0d10" : "#f4f2ee");
  const fit = /oversized|baggy|loose|relaxed/.test(p) ? 1.2 : /slim|fitted|tight/.test(p) ? 0.9 : 1;
  const length = /long|maxi|full-length/.test(p) ? 1.15 : /crop|short|mini/.test(p) ? 0.85 : 1;
  if (style) notes.push(style.note);
  notes.push(`Main colour ${colors[0]} with ${colors[1]} details keeps contrast high and readable.`);
  if (pattern !== "solid") notes.push(`Use the ${pattern} pattern on the main body and keep trims solid.`);
  const fabrics = [material, ...MATERIAL_WORDS.filter((m) => m !== material)].slice(0, 3);
  return { garment, colors, material, pattern, fit, length, notes, fabrics };
}
