import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";

export const Route = createFileRoute("/_dash/portfolio")({
  head: () => ({
    meta: [
      { title: "My Portfolio — STYLEVERSE" },
      { name: "description", content: "My Portfolio in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "My Portfolio — STYLEVERSE" },
      { property: "og:description", content: "My Portfolio in STYLEVERSE." },
    ],
  }),
  component: () => <SimplePage title="My Portfolio" />,
});
