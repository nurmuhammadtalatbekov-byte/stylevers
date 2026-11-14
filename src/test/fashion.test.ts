import { describe, expect, it } from "vitest";
import { MATERIALS, MATERIAL_PROPS, newDesign } from "@/lib/fashion";
import { designSchema } from "@/lib/design-schema";
import { actions } from "@/lib/store";

describe("Studio design rules", () => {
  it.each([
    "silk",
    "satin",
    "velvet",
    "cotton",
    "denim",
    "linen",
    "chiffon",
    "leather",
    "wool",
    "organza",
  ])("supports %s fabric", (fabric) => {
    expect(MATERIALS).toContain(fabric);
    expect(MATERIAL_PROPS[fabric as keyof typeof MATERIAL_PROPS].roughness).toBeGreaterThan(0);
  });
  it("rejects an imported design missing sleeve and trim data", () => {
    const d = newDesign();
    expect(designSchema.safeParse({ ...d, parts: { body: d.parts.body } }).success).toBe(false);
  });
  it("saves, reopens and edits the same design without duplication", () => {
    const d = { ...newDesign(), name: "Silk study" };
    actions.saveDesign(d);
    actions.saveDesign({ ...d, name: "Edited silk study" });
    expect(actions.getDesign(d.id)?.name).toBe("Edited silk study");
    expect(actions.snapshot().designs.filter((x) => x.id === d.id)).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem("styleverse:v1") ?? "{}").designs.find(
        (x: { id: string }) => x.id === d.id,
      ).name,
    ).toBe("Edited silk study");
  });
  it("keeps existing designs when restoring a cloud backup", () => {
    const local = newDesign();
    actions.saveDesign(local);
    const remote = newDesign();
    actions.mergeWorkspace({ designs: [remote], collections: [], likes: [], favorites: [] });
    expect(actions.getDesign(local.id)?.id).toBe(local.id);
    expect(actions.getDesign(remote.id)?.id).toBe(remote.id);
  });
  it("deletes only the selected design", () => {
    const a = newDesign(),
      b = newDesign();
    actions.saveDesign(a);
    actions.saveDesign(b);
    actions.deleteDesign(a.id);
    expect(actions.getDesign(a.id)).toBeUndefined();
    expect(actions.getDesign(b.id)?.id).toBe(b.id);
  });
  it("toggles saved pieces and inspiration in device persistence", () => {
    actions.toggle("likes", "p1");
    actions.toggle("favorites", "look-1");
    expect(actions.snapshot().likes).toContain("p1");
    expect(actions.snapshot().favorites).toContain("look-1");

    actions.toggle("likes", "p1");
    actions.toggle("favorites", "look-1");
    expect(actions.snapshot().likes).not.toContain("p1");
    expect(actions.snapshot().favorites).not.toContain("look-1");
  });
});
