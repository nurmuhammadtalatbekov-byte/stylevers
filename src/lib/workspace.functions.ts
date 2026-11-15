import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { workspaceSchema } from "./design-schema";
import type { Json } from "@/integrations/supabase/types";

export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => workspaceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fashion_workspaces").upsert({
      user_id: context.userId,
      workspace: data as unknown as Json,
      updated_at: new Date().toISOString(),
    });
    if (error)
      throw new Error("Your cloud backup could not be saved. Your device designs are unchanged.");
    return { saved: true };
  });

export const readWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fashion_workspaces")
      .select("workspace, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Your cloud backup could not be opened.");
    return data
      ? { workspace: workspaceSchema.parse(data.workspace), updatedAt: data.updated_at }
      : null;
  });
