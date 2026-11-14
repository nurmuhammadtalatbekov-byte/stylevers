
export const MODEL_IDS = ["female", "male"] as const;
export type ModelId = (typeof MODEL_IDS)[number];

export const MODEL_POSES = ["standing", "runway"] as const;
export type ModelPose = (typeof MODEL_POSES)[number];

export const STUDIO_ENVIRONMENTS = ["light", "dark"] as const;

// Hozircha faqat ayol modeli ko‘rsatiladi.
// MODEL_IDS eski saqlangan dizaynlar buzilmasligi uchun qoldirildi.
export const FASHION_MODELS = [
  {
    id: "female",
    name: "Female · 01",
    height: 1.68,
    build: "Slender",
    description: "Female fashion model · 168 cm",
  },
] as const;

export function modelFor(id?: ModelId) {
  return FASHION_MODELS.find((model) => model.id === id)
    ?? FASHION_MODELS[0];
}
