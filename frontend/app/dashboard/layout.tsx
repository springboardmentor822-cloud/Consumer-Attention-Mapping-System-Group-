// Do NOT put RoleGuard here.
//
// Next.js applies this parent layout to every nested dashboard route.
// A guard here would also run for:
//   /dashboard/admin
//   /dashboard/store-manager
//   /dashboard/retail-analyst
//   /dashboard/marketing-manager
//
// Role-specific access is enforced by each child layout instead.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}