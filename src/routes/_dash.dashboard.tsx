import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { DesignCard } from "@/components/DesignCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_dash/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Home — STYLEVERSE" },
      { name: "description", content: "Home in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "Home — STYLEVERSE" },
      { property: "og:description", content: "Home in STYLEVERSE." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { designs, collections } = useStore();
  return <SimplePage title="Your atelier">
    <div className="flex flex-wrap items-center gap-4 border-b pb-6">
      <span className="text-sm text-muted-foreground">{designs.length} designs · {collections.length} collections</span>
      <Button asChild><Link to="/studio">New design</Link></Button>
      <Button asChild variant="outline"><Link to="/ai">Create a brief</Link></Button>
    </div>
    <h3 className="font-display text-2xl">Recent designs</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{designs.slice(0, 6).map((d) => <DesignCard key={d.id} d={d} />)}</div>
    {!designs.length && <p className="text-sm text-muted-foreground">No saved designs yet.</p>}
  </SimplePage>;
}
