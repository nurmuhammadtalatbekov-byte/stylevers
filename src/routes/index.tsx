import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Box, Sparkles, Store } from "lucide-react";
import hero from "@/assets/hero-editorial.jpg";
import { Logo, NAV } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STYLEVERSE — Design the Future of Fashion" },
      { name: "description", content: "Create, customize and experience your fashion ideas in an immersive 3D digital studio." },
      { property: "og:title", content: "STYLEVERSE — Design the Future of Fashion" },
      { property: "og:description", content: "Create, customize and experience your fashion ideas in an immersive 3D digital studio." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="animate-drift pointer-events-none absolute -left-40 top-20 size-[520px] rounded-full bg-primary/25 blur-[140px]" />
      <div className="animate-drift pointer-events-none absolute -right-40 bottom-0 size-[420px] rounded-full bg-cyan/15 blur-[140px]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          {NAV.slice(1, 6).map((n) => <Link key={n.to} to={n.to} className="hover:text-foreground">{n.label}</Link>)}
        </nav>
        <Button asChild variant="outline" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-6 md:grid-cols-[1.1fr_0.9fr] md:pt-12">
        <div className="animate-rise">
          <p className="eyebrow mb-6">Your Imagination. Your Fashion. Your World.</p>
          <h2 className="font-display text-5xl font-extrabold leading-[0.95] md:text-7xl">
            DESIGN THE <span className="text-brand">FUTURE</span> OF FASHION.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Create, customize and experience your fashion ideas in an immersive digital studio.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand shadow-glow tracking-widest"><Link to="/studio">ENTER 3D STUDIO <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="tracking-widest"><Link to="/marketplace">EXPLORE COLLECTIONS</Link></Button>
          </div>
        </div>
        <div className="relative animate-rise [animation-delay:200ms]">
          <img src={hero} alt="Model in a sculptural black coat with violet satin lining" width={1024} height={1280} className="aspect-[4/5] w-full rounded-3xl object-cover shadow-glow" />
          <div className="glass absolute -bottom-6 left-4 right-4 rounded-2xl p-4 md:-left-10 md:right-auto md:w-72">
            <p className="eyebrow">Live in the studio</p>
            <p className="mt-1 text-sm">Rotate, recolour and re-fabric 8 garment types on a real-time 3D mannequin.</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: Box, t: "3D Design Studio", d: "Real-time garments, 7 fabrics, patterns and per-part colour.", to: "/studio" as const },
          { icon: Sparkles, t: "AI Fashion Designer", d: "Describe an idea — get colours, fabrics and a ready-to-edit design.", to: "/ai" as const },
          { icon: Store, t: "Marketplace", d: "Discover digital fashion from independent designers.", to: "/marketplace" as const },
        ].map(({ icon: Icon, t, d, to }) => (
          <Link key={t} to={to} className="glass group rounded-2xl p-6 transition-transform hover:-translate-y-1">
            <Icon className="size-5 text-primary" />
            <p className="mt-4 font-display text-lg font-semibold">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
