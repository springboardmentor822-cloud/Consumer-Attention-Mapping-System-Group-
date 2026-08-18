import RoleGuard from "../_components/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["SuperAdmin"]}>{children}</RoleGuard>;
}
