import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { DesignCard, Empty } from "@/components/DesignCard";
import { useStore } from "@/lib/store";

function Portfolio() {
  const { designs } = useStore();
  return (
    <SimplePage title="My Portfolio">
      {designs.length === 0 ? (
        <Empty title="No saved designs yet"><Link to="/studio" className="text-primary underline">Create one in the 3D studio</Link></Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{designs.map((d) => <DesignCard key={d.id} d={d} />)}</div>
      )}
    </SimplePage>
  );
}

export const Route = createFileRoute("/_dash/portfolio")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "My Portfolio — STYLEVERSE" },
      { name: "description", content: "My Portfolio in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "My Portfolio — STYLEVERSE" },
      { property: "og:description", content: "My Portfolio in STYLEVERSE." },
    ],
  }),
  component: Portfolio,
});
