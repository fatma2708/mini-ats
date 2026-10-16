import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Briefcase, Building2, Columns3, Eye, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/shared/brand";
import { Avatar } from "@/components/shared/badges";
import { cn } from "@/lib/utils";

const ALL = "__all__";

function ViewingAsSelect({ className }: { className?: string }) {
  const { viewingAs, setViewingAs } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const customers = profiles.filter((p) => p.role === "customer");

  return (
    <Select
      value={viewingAs?.id ?? ALL}
      onValueChange={(id) => {
        const c = customers.find((p) => p.id === id);
        setViewingAs(c ? { id: c.id, email: c.email, company_name: c.company_name, full_name: c.full_name } : null);
      }}
    >
      <SelectTrigger pill className={cn("h-9 w-full bg-surface-container sm:w-60", className)} aria-label="Viewing as">
        <span className="flex min-w-0 items-center gap-2">
          <Eye className="size-4 shrink-0 text-secondary" />
          <span className="type-label-sm text-on-surface-variant uppercase">Viewing</span>
          <span className="truncate">
            <SelectValue />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Select customer</SelectLabel>
          <SelectItem value={ALL}>All customers</SelectItem>
        </SelectGroup>
        {customers.length > 0 && <SelectSeparator />}
        {customers.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.company_name || c.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const navItems = [
  { to: "/board", label: "Board", icon: Columns3 },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
];

export function AppLayout() {
  const { profile, isAdmin, viewingAs, setViewingAs, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const items = isAdmin ? [...navItems, { to: "/admin", label: "Admin", icon: ShieldCheck }] : navItems;
  const displayName = profile?.full_name || profile?.email || "";

  // Close the mobile menu on navigation.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const nav = (
    <nav className="flex flex-col gap-1.5" aria-label="Main">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-full px-4 py-2.5 type-body-md transition-all",
              isActive
                ? "bg-primary-container type-body-md-bold text-on-primary shadow-[0_4px_14px_rgb(59_63_216/0.2)]"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
            )
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const userCard = (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container p-3 shadow-highlight">
      <Avatar name={displayName} className="bg-primary text-on-primary" />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate type-body-md-bold text-on-surface">{displayName}</div>
        <div className="truncate type-label-sm text-on-surface-variant uppercase">
          {isAdmin ? "Administrator" : profile?.company_name || "Customer"}
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={signOut} title="Log out" aria-label="Log out">
        <LogOut />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between bg-surface-container-low px-3 py-5 shadow-bar lg:flex">
        <div className="flex flex-col gap-8">
          <NavLink to="/board" className="rounded-lg px-3">
            <Logo />
          </NavLink>
          {nav}
        </div>
        {userCard}
      </aside>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between bg-surface-container-low px-3 py-5 shadow-clay-lg">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-3">
                <Logo />
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <X />
                </Button>
              </div>
              {nav}
              {isAdmin && (
                <div className="px-1">
                  <ViewingAsSelect />
                </div>
              )}
            </div>
            {userCard}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-surface/85 px-4 shadow-[0_1px_8px_rgb(70_60_45/0.04)] backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <NavLink to="/board" className="lg:hidden">
            <Logo compact />
          </NavLink>

          <div className="flex min-w-0 items-center gap-2 type-body-md">
            <Building2 className="hidden size-4 shrink-0 text-secondary sm:block" aria-hidden="true" />
            <span className="hidden truncate type-body-md-bold text-on-surface sm:inline">
              {isAdmin ? (viewingAs?.company_name || viewingAs?.email || "All customers") : profile?.company_name || "My workspace"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {isAdmin && <ViewingAsSelect className="hidden md:flex" />}
            <span className="hidden lg:block" title={displayName}>
              <Avatar name={displayName} className="size-8 bg-primary text-xs text-on-primary" />
            </span>
          </div>
        </header>

        {isAdmin && viewingAs && (
          <div className="px-4 pt-4 sm:px-6">
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary p-3 text-on-primary shadow-[0_4px_16px_rgb(30_29_194/0.18)] sm:px-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Eye className="size-5 text-secondary-fixed" aria-hidden="true" />
                <span className="rounded-full bg-primary-container px-2 py-0.5 type-label-sm text-on-primary-container uppercase">
                  Impersonation active
                </span>
                <span className="type-body-md">
                  Acting on behalf of{" "}
                  <strong className="type-body-md-bold">{viewingAs.company_name || viewingAs.email}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingAs(null)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-primary-container px-3.5 py-1.5 type-body-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-fixed-variant focus-visible:outline-white"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Exit view
              </button>
            </div>
          </div>
        )}

        <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
