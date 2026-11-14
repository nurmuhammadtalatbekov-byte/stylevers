import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { INSPIRATION, INSPIRATION_CATEGORIES } from "@/lib/demo-content";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/_dash/inspiration")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Inspiration Gallery — STYLEVERSE" },
      {
        name: "description",
        content: "Inspiration Gallery in STYLEVERSE, the 3D fashion design studio.",
      },
      { property: "og:title", content: "Inspiration Gallery — STYLEVERSE" },
      { property: "og:description", content: "Inspiration Gallery in STYLEVERSE." },
    ],
  }),
  component: InspirationGallery,
});

function InspirationGallery() {
  const { favorites } = useStore();
  const [category, setCategory] = useState("All looks");
  const categories = ["All looks", ...INSPIRATION_CATEGORIES];
  const looks =
    category === "All looks"
      ? INSPIRATION
      : INSPIRATION.filter((look) => look.category === category);

  return (
    <SimplePage title="Inspiration Gallery">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="eyebrow">The STYLEVERSE lookbook</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Explore silhouettes, surfaces and color stories. Save references to your device or
              take an idea into the studio.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/studio">
              Open the 3D studio <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Filter inspiration by category"
        >
          {categories.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={category === item ? "secondary" : "ghost"}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className="shrink-0"
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {looks.map((look) => {
            const saved = favorites.includes(look.id);
            return (
              <article key={look.id} className="glass group overflow-hidden rounded-xl">
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                  <img
                    src={look.image}
                    alt={`${look.title}, ${look.category} fashion reference`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label={
                      saved ? `Remove ${look.title} from saved inspiration` : `Save ${look.title}`
                    }
                    aria-pressed={saved}
                    onClick={() => actions.toggle("favorites", look.id)}
                    className="absolute right-2 top-2 rounded-full sm:right-3 sm:top-3"
                  >
                    <Heart className={saved ? "fill-current text-primary" : ""} />
                  </Button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-12 sm:p-4 sm:pt-16">
                    <p className="text-[10px] uppercase tracking-wider text-white/75">
                      {look.category}
                    </p>
                    <h3 className="mt-1 font-display text-base text-white sm:text-xl">
                      {look.title}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3">
                  {look.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </SimplePage>
  );
}
