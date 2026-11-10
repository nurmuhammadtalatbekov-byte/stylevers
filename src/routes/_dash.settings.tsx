import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";

export const Route = createFileRoute("/_dash/settings")({
  head: () => ({
    meta: [
      { title: "Settings — STYLEVERSE" },
      { name: "description", content: "Settings in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "Settings — STYLEVERSE" },
      { property: "og:description", content: "Settings in STYLEVERSE." },
    ],
  }),
  component: () => <SimplePage title="Settings" />,
});
