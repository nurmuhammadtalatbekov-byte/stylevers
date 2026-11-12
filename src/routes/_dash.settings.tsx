import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";
import { actions } from "@/lib/store";
import { readWorkspace, saveWorkspace } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_dash/settings")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Settings — STYLEVERSE" },
      { name: "description", content: "Settings in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "Settings — STYLEVERSE" },
      { property: "og:description", content: "Settings in STYLEVERSE." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const read = useServerFn(readWorkspace), save = useServerFn(saveWorkspace);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  async function backup(restore: boolean) {
    setBusy(true); setMessage("");
    try {
      if (restore) {
        const result = await read();
        if (result) { actions.mergeWorkspace(result.workspace); setMessage("Cloud designs restored. Existing device designs were kept."); }
        else setMessage("No cloud backup yet.");
      } else { await save({ data: actions.snapshot() }); setMessage("Cloud backup saved."); }
    } catch (e) { setMessage((e as Error).message); }
    finally { setBusy(false); }
  }
  async function login(provider: "google" | "lovable") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/settings` });
      if (result.error) setMessage(result.error.message);
    } catch (e) { setMessage((e as Error).message); }
    finally { setBusy(false); }
  }
  return <SimplePage title="Workspace settings">
    <section className="space-y-4 border-b pb-6">
      <h3 className="font-display text-2xl">Private cloud backup</h3>
      {signedIn ? <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => backup(false)}>Back up designs</Button>
        <Button disabled={busy} variant="outline" onClick={() => backup(true)}>Restore cloud designs</Button>
        <Button variant="ghost" onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) setMessage(error.message); }}>Sign out</Button>
      </div> : <div className="flex flex-wrap gap-3">
        <Button disabled={busy} variant="outline" className="google-auth-button" onClick={() => login("google")}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          Continue with Google
        </Button>
        <Button disabled={busy} className="lovable-auth-button" onClick={() => login("lovable")}>Continue with Lovable</Button>
      </div>}
      {busy && <p role="status" className="text-sm text-muted-foreground">Working…</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </section>
  </SimplePage>;
}
