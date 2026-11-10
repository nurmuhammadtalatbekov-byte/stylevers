import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Box, FolderHeart, Home, Images, LayoutGrid, Menu, Settings, Sparkles, Store, UserRound, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

export const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/studio", label: "3D Design Studio", icon: Box },
  { to: "/ai", label: "AI Fashion Designer", icon: Sparkles },
  { to: "/collections", label: "My Collections", icon: FolderHeart },
  { to: "/marketplace", label: "Fashion Marketplace", icon: Store },
  { to: "/inspiration", label: "Inspiration Gallery", icon: Images },
  { to: "/portfolio", label: "My Portfolio", icon: LayoutGrid },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo() {
  return (
    <Link to="/" className="font-display text-lg font-extrabold tracking-[0.18em]">
      STYLE<span className="text-brand">VERSE</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [notif, setNotif] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { designs } = useStore();
  const current = NAV.find((n) => path.startsWith(n.to))?.label ?? "STYLEVERSE";

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to} to={to} onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-accent text-foreground" }}
        >
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r p-5 lg:flex">
        <Logo />
        {nav}
        <div className="glass mt-auto rounded-xl p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Demo workspace</p>
          Designs are saved on this device. Accounts & cloud sync come next.
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur lg:hidden" onClick={() => setOpen(false)}>
          <aside className="glass flex h-full w-72 flex-col gap-8 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-40 flex h-16 items-center gap-3 border-x-0 border-t-0 px-4 md:px-6">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <h1 className="truncate font-display text-base font-semibold">{current}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button aria-label="Notifications" onClick={() => setNotif((v) => !v)} className="grid size-9 place-items-center rounded-full hover:bg-secondary">
                <Bell className="size-4" />
              </button>
              {notif && (
                <div className="glass absolute right-0 top-11 w-72 rounded-xl p-4 text-sm">
                  <p className="eyebrow mb-2">Notifications</p>
                  <p className="text-muted-foreground">{designs.length ? `You have ${designs.length} saved design${designs.length > 1 ? "s" : ""}.` : "Welcome to STYLEVERSE — open the studio to start your first design."}</p>
                </div>
              )}
            </div>
            <Link to="/portfolio" aria-label="Profile" className="grid size-9 place-items-center rounded-full bg-brand text-primary-foreground"><UserRound className="size-4" /></Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
