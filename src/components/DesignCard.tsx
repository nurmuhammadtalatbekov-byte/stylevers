import { Link } from "@tanstack/react-router";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { GARMENT_LABEL, type Design } from "@/lib/fashion";
import { actions, useStore } from "@/lib/store";

export function DesignCard({ d, manage = true }: { d: Design; manage?: boolean }) {
  const { collections } = useStore();
  return (
    <div className="glass group overflow-hidden rounded-2xl">
      <Link to="/studio" search={{ id: d.id }} className="block aspect-[4/5] bg-secondary">
        {d.preview ? <img src={d.preview} alt={d.name} className="h-full w-full object-cover" loading="lazy" />
          : <div className="grid h-full place-items-center text-xs text-muted-foreground">No preview</div>}
      </Link>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{d.name}</p>
          <span className="eyebrow shrink-0">{GARMENT_LABEL[d.garment]}</span>
        </div>
        {manage && (
          <>
            <select
              aria-label="Collection" value={d.collectionId ?? ""}
              onChange={(e) => actions.moveToCollection(d.id, e.target.value || undefined)}
              className="w-full rounded-md border bg-secondary px-2 py-1 text-xs"
            >
              <option value="">No collection</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-1">
              <Link to="/studio" search={{ id: d.id }} aria-label="Edit" className="grid size-8 place-items-center rounded-md hover:bg-secondary"><Pencil className="size-3.5" /></Link>
              <button aria-label="Duplicate" onClick={() => actions.duplicateDesign(d.id)} className="grid size-8 place-items-center rounded-md hover:bg-secondary"><Copy className="size-3.5" /></button>
              <button aria-label="Delete" onClick={() => confirm(`Delete “${d.name}”?`) && actions.deleteDesign(d.id)} className="ml-auto grid size-8 place-items-center rounded-md text-destructive hover:bg-secondary"><Trash2 className="size-3.5" /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <p className="font-display text-lg">{title}</p>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
