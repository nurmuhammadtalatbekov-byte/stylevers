import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";

export const Route = createFileRoute("/_dash/ai")({
  head: () => ({
    meta: [
      { title: "AI Fashion Designer — STYLEVERSE" },
      { name: "description", content: "AI Fashion Designer in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "AI Fashion Designer — STYLEVERSE" },
      { property: "og:description", content: "AI Fashion Designer in STYLEVERSE." },
    ],
  }),
  component: () => <SimplePage title="AI Fashion Designer" />,
});
