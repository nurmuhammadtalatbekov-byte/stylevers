import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";

export const Route = createFileRoute("/_dash/marketplace")({
  head: () => ({
    meta: [
      { title: "Fashion Marketplace — STYLEVERSE" },
      { name: "description", content: "Fashion Marketplace in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "Fashion Marketplace — STYLEVERSE" },
      { property: "og:description", content: "Fashion Marketplace in STYLEVERSE." },
    ],
  }),
  component: () => <SimplePage title="Fashion Marketplace" />,
});
