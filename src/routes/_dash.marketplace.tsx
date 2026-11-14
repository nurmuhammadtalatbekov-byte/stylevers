import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DESIGNERS, PRODUCTS } from "@/lib/demo-content";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/_dash/marketplace")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Fashion Marketplace — STYLEVERSE" },
      {
        name: "description",
        content: "Fashion Marketplace in STYLEVERSE, the 3D fashion design studio.",
      },
      { property: "og:title", content: "Fashion Marketplace — STYLEVERSE" },
      { property: "og:description", content: "Fashion Marketplace in STYLEVERSE." },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const { likes } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All pieces");
  const categories = useMemo(
    () => ["All pieces", ...new Set(PRODUCTS.map((product) => product.category))],
    [],
  );
  const designerById = useMemo(
    () => new Map(DESIGNERS.map((designer) => [designer.id, designer])),
    [],
  );
  const visible = PRODUCTS.filter((product) => {
    const designer = designerById.get(product.designer);
    const matchesCategory = category === "All pieces" || product.category === category;
    const text = `${product.title} ${product.category} ${designer?.name ?? ""}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  });

  return (
    <SimplePage title="Fashion Marketplace">
      <section className="space-y-5">
        <div className="max-w-2xl space-y-2">
          <p className="eyebrow">Independent digital fashion</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Discover concept pieces from the STYLEVERSE lookbook and save the ideas you want to
            revisit.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pieces or designers"
              aria-label="Search pieces or designers"
              className="h-10 w-full rounded-md border bg-secondary pl-9 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>
          <label className="sr-only" htmlFor="marketplace-category">
            Category
          </label>
          <select
            id="marketplace-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-md border bg-secondary px-3 text-sm sm:w-52"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <p role="status" className="text-xs text-muted-foreground">
          {visible.length} {visible.length === 1 ? "piece" : "pieces"}
        </p>

        {visible.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((product) => {
              const designer = designerById.get(product.designer);
              const liked = likes.includes(product.id);
              return (
                <article key={product.id} className="glass overflow-hidden rounded-xl">
                  <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-[10px] uppercase tracking-wider backdrop-blur">
                      {product.category}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label={
                        liked
                          ? `Remove ${product.title} from saved pieces`
                          : `Save ${product.title}`
                      }
                      aria-pressed={liked}
                      onClick={() => actions.toggle("likes", product.id)}
                      className="absolute right-3 top-3 rounded-full"
                    >
                      <Heart className={liked ? "fill-current text-primary" : ""} />
                    </Button>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl">{product.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {designer?.name} · {designer?.city}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm">${product.price}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                    <p className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                      <ShoppingBag className="size-3.5" /> Editorial concept ·{" "}
                      {product.likes + Number(liked)} saves
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground">
            No pieces match this search. Try another category or designer.
          </div>
        )}
      </section>
    </SimplePage>
  );
}
