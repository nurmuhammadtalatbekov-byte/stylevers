import { z } from "zod";
import { COLLARS, GARMENTS, MATERIALS, PATTERNS, SLEEVES } from "./fashion";
import { MODEL_IDS, MODEL_POSES, STUDIO_ENVIRONMENTS } from "./fashion-models";

const style = z.object({
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  material: z.enum(MATERIALS),
  pattern: z.enum(PATTERNS),
  customTexture: z
    .string()
    .max(2200000)
    .regex(/^data:image\/(png|jpeg|webp|gif);base64,/)
    .optional(),
});
export const designSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  garment: z.enum(GARMENTS),
  fit: z.number().min(0.85).max(1.25),
  length: z.number().min(0.8).max(1.2),
  parts: z.object({ body: style, sleeves: style, trim: style }),
  sleeve: z.enum(SLEEVES).optional(),
  collar: z.enum(COLLARS).optional(),
  modelId: z.enum(MODEL_IDS).optional(),
  modelPose: z.enum(MODEL_POSES).optional(),
  studioEnvironment: z.enum(STUDIO_ENVIRONMENTS).optional(),
  collectionId: z.string().optional(),
  preview: z.string().max(1000000).optional(),
  updatedAt: z.number().finite(),
});
export const collectionSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  createdAt: z.number().finite(),
});

export const workspaceSchema = z.object({
  designs: z.array(designSchema).max(500),
  collections: z.array(collectionSchema).max(500),
  likes: z.array(z.string()),
  favorites: z.array(z.string()),
});
