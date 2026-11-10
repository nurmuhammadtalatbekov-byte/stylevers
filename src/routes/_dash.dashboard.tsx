import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";

export const Route = createFileRoute("/_dash/dashboard")({
  head: () => ({
    meta: [
      { title: "Home — STYLEVERSE" },
      { name: "description", content: "Home in STYLEVERSE, the 3D fashion design studio." },
      { property: "og:title", content: "Home — STYLEVERSE" },
      { property: "og:description", content: "Home in STYLEVERSE." },
    ],
  }),
  component: () => <SimplePage title="Home" />,
});
