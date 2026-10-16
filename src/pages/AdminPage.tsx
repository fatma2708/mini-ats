import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeIcon, EyeOff, Loader2, LogIn, RefreshCw, Search, ShieldCheck, UserPlus, Users, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/hooks/queries";
import { createUser, queryKeys } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Dot } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, EmptyState, Eyebrow, Field, PageHeader } from "@/components/common";
import { cn, errorMessage, formatDate } from "@/lib/utils";
import type { Role } from "@/types";

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "customer", label: "Customer", description: "Own jobs and candidates only" },
  { value: "admin", label: "Admin", description: "All customers and account creation" },
];

type RoleFilter = Role | "all";

export function AdminPage() {
  const { profile: me, setViewingAs } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profiles, isPending, isError, error } = useProfiles();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<Role>("customer");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const create = useMutation({
    mutationFn: () =>
      createUser({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        company_name: company.trim(),
        role,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profiles });
      toast.success(`Account created for ${email}. Share the temporary password securely.`);
      setEmail("");
      setPassword("");
      setFullName("");
      setCompany("");
      setRole("customer");
    },
    onError: (err) => toast.error(`Could not create account: ${errorMessage(err)}`),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("The temporary password must have at least 8 characters.");
    if (role === "customer" && !company.trim()) return toast.error("A customer account needs a company name.");
    create.mutate();
  }

  const all = profiles ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (p) =>
        (roleFilter === "all" || p.role === roleFilter) &&
        (!q || [p.full_name, p.email, p.company_name].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [all, query, roleFilter]);
  const adminCount = all.filter((p) => p.role === "admin").length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={<Badge variant="neutral">Admin · Accounts & access</Badge>}
        title="Account management"
        description="Create admin or customer accounts and act on behalf of any customer."
        actions={
          profiles && (
            <div className="flex items-center gap-1 rounded-full bg-surface-container-low p-1.5 shadow-[inset_0_1px_2px_rgb(70_60_45/0.05)]">
              <div className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-1.5 shadow-sm">
                <Dot className="bg-secondary" />
                <Eyebrow>Customers</Eyebrow>
                <span className="type-body-md-bold text-on-surface">{all.length - adminCount}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Eyebrow>Admins</Eyebrow>
                <span className="type-body-md-bold text-tertiary">{adminCount}</span>
              </div>
            </div>
          )
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-12">
        {/* Account directory */}
        <section className="flex flex-col gap-4 xl:col-span-8" aria-labelledby="accounts-title">
          <h2 id="accounts-title" className="sr-only">
            Accounts
          </h2>
          <div className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-clay lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email or company…"
                aria-label="Search accounts"
                className="h-10 w-full rounded-full bg-surface-container-low pr-4 pl-10 type-body-sm text-on-surface shadow-well outline-none placeholder:text-on-surface-variant focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary-container/70 focus-visible:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                <SelectTrigger pill className="h-10 w-44 type-body-sm" aria-label="Filter by role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admins only</SelectItem>
                  <SelectItem value="customer">Customers only</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => qc.invalidateQueries({ queryKey: queryKeys.profiles })}
                aria-label="Refresh accounts"
                title="Refresh"
              >
                <RefreshCw />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-clay">
            {isPending ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-4">
                <EmptyState compact title="Could not load accounts" description={error?.message} className="shadow-none" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  compact
                  icon={<Users />}
                  title={all.length === 0 ? "No accounts" : "No account matches"}
                  description={all.length === 0 ? undefined : "Try another search or role filter."}
                  className="shadow-none"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low type-label-sm text-on-surface-variant uppercase">
                      <th scope="col" className="py-3 pr-2 pl-5 font-semibold">
                        User
                      </th>
                      <th scope="col" className="px-2 py-3 font-semibold">
                        Company
                      </th>
                      <th scope="col" className="hidden px-2 py-3 font-semibold md:table-cell">
                        Email
                      </th>
                      <th scope="col" className="px-2 py-3 font-semibold">
                        Role
                      </th>
                      <th scope="col" className="hidden px-2 py-3 font-semibold lg:table-cell">
                        Created
                      </th>
                      <th scope="col" className="py-3 pr-5 pl-2 text-right font-semibold">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="type-body-sm">
                    {filtered.map((p) => {
                      const isAdminRow = p.role === "admin";
                      return (
                        <tr key={p.id} className="group transition-colors hover:bg-surface-container-low/70">
                          <td className="py-3 pr-2 pl-5">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={p.full_name || p.email}
                                className={isAdminRow ? undefined : "bg-secondary-fixed text-on-secondary-fixed-variant"}
                              />
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate type-body-md-bold text-on-surface transition-colors group-hover:text-primary">
                                  {p.full_name || "—"}
                                  {p.id === me?.id && <span className="ml-1 type-label-sm text-on-surface-variant">(you)</span>}
                                </span>
                                <span className="truncate type-label-sm text-on-surface-variant md:hidden">{p.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            {p.company_name ? (
                              <span className="flex items-center gap-1.5">
                                <Dot className={isAdminRow ? "bg-primary" : "bg-secondary"} />
                                <span className="type-body-md-bold text-on-surface">{p.company_name}</span>
                              </span>
                            ) : (
                              <span className="text-on-surface-variant">—</span>
                            )}
                          </td>
                          <td className="hidden px-2 py-3 type-label-md tracking-normal text-on-surface-variant md:table-cell">
                            {p.email}
                          </td>
                          <td className="px-2 py-3">
                            <Badge variant={isAdminRow ? "primary" : "success"}>
                              {isAdminRow ? "Admin" : "Customer"}
                            </Badge>
                          </td>
                          <td className="hidden px-2 py-3 type-label-sm whitespace-nowrap text-on-surface-variant lg:table-cell">
                            {formatDate(p.created_at)}
                          </td>
                          <td className="py-3 pr-5 pl-2 text-right">
                            {isAdminRow ? (
                              <ShieldCheck
                                className="ml-auto size-[18px] text-on-surface-variant/60"
                                aria-label="Administrator"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingAs({
                                    id: p.id,
                                    email: p.email,
                                    company_name: p.company_name,
                                    full_name: p.full_name,
                                  });
                                  navigate("/board");
                                }}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-surface-container-low px-3 py-1 type-body-sm font-semibold whitespace-nowrap text-on-surface-variant transition-colors hover:bg-primary-fixed hover:text-on-primary-fixed"
                              >
                                <LogIn className="size-3.5" aria-hidden="true" /> View as
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {profiles && profiles.length > 0 && (
              <div className="flex items-center gap-2 bg-surface-container-low/60 px-5 py-3 text-on-surface-variant">
                <Eyebrow>Showing</Eyebrow>
                <span className="type-body-md-bold text-on-surface">{filtered.length}</span>
                <Eyebrow>of {all.length} accounts</Eyebrow>
              </div>
            )}
          </div>
        </section>

        {/* Create account */}
        <section className="xl:col-span-4" aria-labelledby="create-title">
          <div className="rounded-lg bg-surface-container-lowest p-6 shadow-clay xl:sticky xl:top-24">
            <div className="mb-5 flex items-start justify-between border-b border-surface-variant/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Dot className="bg-primary-container" />
                  <h2 id="create-title" className="type-headline-sm text-on-surface">
                    Create account
                  </h2>
                </div>
                <p className="mt-1 type-body-sm text-on-surface-variant">
                  The user can log in right away with the temporary password.
                </p>
              </div>
              <UserPlus className="size-6 text-outline-variant" aria-hidden="true" />
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <Field label="Full name" htmlFor="u-name" caps>
                <Input id="u-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Doe" />
              </Field>
              <Field label="Work email" htmlFor="u-email" required caps>
                <Input
                  id="u-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  required
                />
              </Field>
              <Field label="Company" htmlFor="u-company" required={role === "customer"} caps>
                <Input id="u-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme" />
              </Field>
              <Field
                label="Temporary password"
                htmlFor="u-password"
                required
                caps
                aside={
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(randomPassword());
                      setShowPassword(true);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-sm type-label-sm text-primary uppercase transition-colors hover:text-on-primary-fixed-variant"
                  >
                    <WandSparkles className="size-3.5" aria-hidden="true" /> Generate
                  </button>
                }
              >
                <div className="relative">
                  <Input
                    id="u-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                    aria-describedby="u-password-hint"
                    className="pr-11 font-label tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-full p-1 text-on-surface-variant transition-colors hover:text-on-surface"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-[18px]" /> : <EyeIcon className="size-[18px]" />}
                  </button>
                </div>
                <p id="u-password-hint" className="type-body-sm text-on-surface-variant">
                  At least 8 characters. Share it with the user securely.
                </p>
              </Field>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 type-label-sm text-on-surface-variant uppercase">Role & permissions</legend>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-surface-container-low p-1">
                  {ROLE_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className={cn(
                        "relative flex cursor-pointer flex-col rounded-[12px] p-2.5 text-on-surface transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-container",
                        role === o.value ? "bg-surface-container-lowest shadow-clay-sm" : "hover:bg-surface-container-lowest/70",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="type-body-md-bold">{o.label}</span>
                        <input
                          type="radio"
                          name="account-role"
                          value={o.value}
                          checked={role === o.value}
                          onChange={() => setRole(o.value)}
                          className="accent-primary-container"
                        />
                      </span>
                      <span className="mt-1 text-[11px] leading-tight text-on-surface-variant">{o.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
                Create account
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
