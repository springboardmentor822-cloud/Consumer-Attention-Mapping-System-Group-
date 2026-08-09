import { FiMail, FiShield, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const details = [
    ["Full Name", user?.full_name, FiUser],
    ["Email", user?.email, FiMail],
    ["Role", user?.role, FiShield],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Profile</h2>
        <p className="mt-1 text-sm text-slate-400">Authenticated user profile from the backend API.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {details.map(([label, value, Icon]) => (
          <section key={label} className="rounded-md border border-line bg-panel p-5">
            <Icon className="text-blue-300" size={22} />
            <p className="mt-4 text-sm text-slate-400">{label}</p>
            <p className="mt-1 break-words font-semibold text-white">{value}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
