import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/DesignCard";
import { actions, useStore } from "@/lib/store";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_dash/collections")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "My Collections — STYLEVERSE" },
      { name: "description", content: "My Collections in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "My Collections — STYLEVERSE" },
      { property: "og:description", content: "My Collections in STYLEVERSE." },
    ],
  }),
  component: Collections,
});

function Collections() {
  const { collections, designs } = useStore();
  const [name, setName] = useState("");
  return <SimplePage title="My Collections">
    <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; actions.createCollection(name.trim()); setName(""); }}>
      <input aria-label="Collection name" maxLength={200} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" className="min-w-0 flex-1 rounded-md border bg-secondary px-3 py-2 text-sm" />
      <Button type="submit">Create</Button>
    </form>
    {collections.map((c) => <section key={c.id} className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between"><h3 className="font-display text-2xl">{c.name}</h3>
        <Button size="icon" variant="ghost" aria-label={`Delete ${c.name}`} onClick={() => { if (confirm(`Delete collection “${c.name}”? Designs will be kept.`)) actions.deleteCollection(c.id); }}><Trash2 /></Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{designs.filter((d) => d.collectionId === c.id).map((d) => <DesignCard key={d.id} d={d} />)}</div>
      {!designs.some((d) => d.collectionId === c.id) && <p className="text-sm text-muted-foreground">No designs in this collection.</p>}
    </section>)}
  </SimplePage>;
}
