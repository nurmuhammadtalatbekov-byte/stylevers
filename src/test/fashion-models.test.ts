import { describe, expect, it } from "vitest";
import { designSchema } from "@/lib/design-schema";
import { newDesign } from "@/lib/fashion";
import { modelFor } from "@/lib/fashion-models";
import { actions } from "@/lib/store";

describe("Fashion model persistence", () => {
  it("opens legacy garments without requiring new model fields", () => {
    const design = designSchema.parse(newDesign());
    expect(modelFor(design.modelId).id).toBe("female");
  });
  it("provides both licensed model choices", () => {
    expect(modelFor("female").assetUrl).toContain("female-base-character-rigged.glb");
    expect(modelFor("male").assetUrl).toContain("male-fashion.glb");
  });
  it("saves male model, runway pose, and dark environment with the design", () => {
    const design = designSchema.parse({
      ...newDesign(),
      modelId: "male",
      modelPose: "runway",
      studioEnvironment: "dark",
    });
    actions.saveDesign(design);
    const reopened = actions.getDesign(design.id);
    expect(reopened?.modelId).toBe("male");
    expect(reopened?.modelPose).toBe("runway");
    expect(reopened?.studioEnvironment).toBe("dark");
  });
  it("rejects unknown models instead of loading a missing asset", () => {
    expect(designSchema.safeParse({ ...newDesign(), modelId: "missing" }).success).toBe(false);
  });
  it("persists a device-local GLB reference with the portable design", () => {
    const design = designSchema.parse({ ...newDesign(), garmentAssetId: "glb-asset-123" });
    actions.saveDesign(design);
    expect(actions.getDesign(design.id)?.garmentAssetId).toBe("glb-asset-123");
  });
});
