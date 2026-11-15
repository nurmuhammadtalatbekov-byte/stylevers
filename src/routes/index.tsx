import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Box, Sparkles, Store } from "lucide-react";
import hero from "@/assets/hero-editorial.jpg";
import { Logo, NAV } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "STYLEVERSE — Design the Future of Fashion" },
      {
        name: "description",
        content:
          "Create, customize and experience your fashion ideas in an immersive 3D digital studio.",
      },
      { property: "og:title", content: "STYLEVERSE — Design the Future of Fashion" },
      {
        property: "og:description",
        content:
          "Create, customize and experience your fashion ideas in an immersive 3D digital studio.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          {NAV.slice(1, 6).map((n) => (
            <Link key={n.to} to={n.to} className="hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard">Dashboard</Link>
        </Button>
      </header>

      <section className="relative mx-4 mb-8 min-h-[520px] overflow-hidden md:mx-6 md:min-h-[620px]">
        <img
          src={hero}
          alt="Sculptural black coat with violet satin lining"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="editorial-shade absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-12">
          <p className="eyebrow mb-6">Your Imagination. Your Fashion. Your World.</p>
          <h1 className="font-display text-6xl font-normal md:text-8xl">STYLEVERSE</h1>
          <p className="mt-6 max-w-sm text-lg">Your digital fashion atelier.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/studio">
                Enter 3D studio <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/portfolio">My designs</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          {
            icon: Box,
            t: "3D Design Studio",
            d: "Fabric & silhouette studies.",
            to: "/studio" as const,
          },
          {
            icon: Sparkles,
            t: "AI Fashion Designer",
            d: "Concepts & production briefs.",
            to: "/ai" as const,
          },
          { icon: Store, t: "Marketplace", d: "Digital fashion.", to: "/marketplace" as const },
        ].map(({ icon: Icon, t, d, to }) => (
          <Link
            key={t}
            to={to}
            className="glass group rounded-2xl p-6 transition-transform hover:-translate-y-1"
          >
            <Icon className="size-5 text-primary" />
            <p className="mt-4 font-display text-lg font-semibold">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
