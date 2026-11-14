export const MODEL_IDS = ["female", "male"] as const;
export type ModelId = (typeof MODEL_IDS)[number];
export const MODEL_POSES = ["standing", "runway"] as const;
export type ModelPose = (typeof MODEL_POSES)[number];
export const STUDIO_ENVIRONMENTS = ["light", "dark"] as const;
export const FASHION_MODELS = [
  { id: "female" as const, name: "Female · 01", height: 1.68, build: "Slender", description: "Short dark hair · 168 cm" },
  { id: "male" as const, name: "Male · 01", height: 1.8, build: "Athletic", description: "Short dark hair · 180 cm" },
] as const;
export function modelFor(id?: ModelId) { return FASHION_MODELS.find((model) => model.id === id) ?? FASHION_MODELS[0]; }