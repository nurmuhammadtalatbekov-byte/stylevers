import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";

export const Route = createFileRoute("/_dash/inspiration")({
  head: () => ({
    meta: [
      { title: "Inspiration Gallery — STYLEVERSE" },
      { name: "description", content: "Inspiration Gallery in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "Inspiration Gallery — STYLEVERSE" },
      { property: "og:description", content: "Inspiration Gallery in STYLEVERSE." },
    ],
  }),
  component: () => <SimplePage title="Inspiration Gallery" />,
});
