import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SimplePage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h2 className="font-display text-3xl font-bold">{title}</h2>
      {children ?? (
        <div className="glass rounded-2xl p-8 text-sm text-muted-foreground">
          This section is not finished yet.{" "}
          <Link to="/studio" className="text-primary underline">
            Open the 3D studio
          </Link>
        </div>
      )}
    </div>
  );
}
