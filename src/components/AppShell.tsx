import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Box,
  FolderHeart,
  Home,
  Images,
  LayoutGrid,
  Menu,
  Settings,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { designs } = useStore();
  const current = NAV.find((n) => path.startsWith(n.to))?.label ?? "STYLEVERSE";

  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    menuCloseRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        menuPanelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ??
          [],
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!notif) return;
    function onPointerDown(event: PointerEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotif(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNotif(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notif]);

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
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
          <p className="mb-1 font-semibold text-foreground">STYLEVERSE Atelier</p>
          <Link to="/settings" className="text-primary">
            Workspace & cloud backups
          </Link>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            ref={menuPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            className="glass flex h-full w-72 flex-col gap-8 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                ref={menuCloseRef}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-40 flex h-16 items-center gap-3 border-x-0 border-t-0 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            ref={menuButtonRef}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="truncate font-display text-base font-semibold">{current}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                aria-expanded={notif}
                aria-controls="notifications-panel"
                onClick={() => setNotif((v) => !v)}
                className="grid size-9 place-items-center rounded-full hover:bg-secondary"
              >
                <Bell className="size-4" />
              </Button>
              {notif && (
                <div
                  id="notifications-panel"
                  role="status"
                  aria-live="polite"
                  className="glass absolute right-0 top-11 z-50 w-72 rounded-xl p-4 text-sm"
                >
                  <p className="eyebrow mb-2">Notifications</p>
                  <p className="text-muted-foreground">
                    {designs.length
                      ? `You have ${designs.length} saved design${designs.length > 1 ? "s" : ""}.`
                      : "Welcome to STYLEVERSE — open the studio to start your first design."}
                  </p>
                </div>
              )}
            </div>
            <Link
              to="/portfolio"
              aria-label="Profile"
              className="grid size-9 place-items-center rounded-full bg-brand text-primary-foreground"
            >
              <UserRound className="size-4" />
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
