import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";

export const Route = createFileRoute("/_dash/collections")({
  head: () => ({
    meta: [
      { title: "My Collections — STYLEVERSE" },
      { name: "description", content: "My Collections in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "My Collections — STYLEVERSE" },
      { property: "og:description", content: "My Collections in STYLEVERSE." },
    ],
  }),
  component: () => <SimplePage title="My Collections" />,
});
