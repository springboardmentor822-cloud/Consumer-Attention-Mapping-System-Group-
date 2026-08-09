import { useAuth } from "../../context/AuthContext";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Admin Control Center",
  "/store": "Store Manager Dashboard",
  "/analyst": "Retail Analyst Dashboard",
  "/marketing": "Marketing Dashboard",
  "/video": "Video Processing",
  "/camera-grid": "Camera Grid",
  "/live-tracking": "Live Store Tracking",
  "/cameras": "Cameras",
  "/zones": "Zones",
  "/stores": "Stores",
  "/shelves": "Shelves",
  "/products": "Products",
  "/users": "Users",
  "/profile": "Profile",
  "/settings": "Settings",
};

export default function Topbar({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] ?? "CAMS";

  const initials = (user?.full_name ?? "?")
    .split(" ")
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-surface/80 px-6 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{user?.full_name}</p>
          <p className="text-xs text-slate-400">{user?.role}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white">
          {initials || "?"}
        </div>
      </div>
    </header>
  );
}
