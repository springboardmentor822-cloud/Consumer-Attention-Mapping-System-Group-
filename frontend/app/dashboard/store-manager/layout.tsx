import RoleGuard from "../_components/RoleGuard";

export default function StoreManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["StoreManager"]}>{children}</RoleGuard>;
}
