CREATE TABLE public.fashion_workspaces (user_id uuid PRIMARY KEY, workspace jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fashion_workspaces TO authenticated;
GRANT ALL ON public.fashion_workspaces TO service_role;
ALTER TABLE public.fashion_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own workspace" ON public.fashion_workspaces FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Create own workspace" ON public.fashion_workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own workspace" ON public.fashion_workspaces FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own workspace" ON public.fashion_workspaces FOR DELETE TO authenticated USING (auth.uid() = user_id);