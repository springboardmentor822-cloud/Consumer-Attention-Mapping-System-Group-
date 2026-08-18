import RoleGuard from "../_components/RoleGuard";

export default function RetailAnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["Analyst"]}>{children}</RoleGuard>;
}
