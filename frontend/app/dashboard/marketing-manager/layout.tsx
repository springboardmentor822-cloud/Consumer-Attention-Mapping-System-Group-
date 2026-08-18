import RoleGuard from "../_components/RoleGuard";

export default function MarketingManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["MarketingManager"]}>
      {children}
    </RoleGuard>
  );
}
