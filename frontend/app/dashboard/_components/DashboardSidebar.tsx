"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SidebarSection = {
  id: string;
  label: string;
};

type SidebarProps = {
  roleLabel: string;
  storeName?: string | null;
  sections: SidebarSection[];
};

// The switcher is navigation between dashboards for the CURRENT authenticated
// role. It does not impersonate another role and never grants access by itself.
// The destination layout.tsx performs the authoritative role check.
const ROLE_SWITCHER = [
  { href: "/dashboard", label: "Live view", roles: ["StoreManager", "Analyst"] },
  { href: "/dashboard/store-manager", label: "Store Manager", roles: ["StoreManager"] },
  { href: "/dashboard/retail-analyst", label: "Retail Analyst", roles: ["Analyst"] },
  { href: "/dashboard/marketing-manager", label: "Marketing Manager", roles: ["MarketingManager"] },
  { href: "/dashboard/admin", label: "Admin", roles: ["SuperAdmin"] },
];

export default function DashboardSidebar({
  roleLabel,
  storeName,
  sections,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .getMe()
      .then((me) => {
        if (!cancelled) setCurrentRole(me.role_name);
      })
      .catch(() => {
        if (!cancelled) setCurrentRole(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleSwitcherLinks = ROLE_SWITCHER.filter(
    (item) => currentRole !== null && item.roles.includes(currentRole)
  );

  function scrollTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.replace("/login");
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <p className="text-sm font-semibold">{roleLabel}</p>
        {storeName && (
          <p className="text-xs text-muted-foreground truncate">{storeName}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
            On this page
          </p>

          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className="text-left text-sm px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
            >
              {section.label}
            </button>
          ))}
        </div>

        {visibleSwitcherLinks.length > 1 && (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
              Your views
            </p>

            {visibleSwitcherLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "text-sm px-2 py-1.5 rounded-md transition-colors " +
                  (pathname === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted")
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border flex flex-col gap-1">
        <Link
          href="/stores"
          className="text-sm px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          Stores
        </Link>

        <button
          onClick={handleLogout}
          className="text-left text-sm px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
