import { useEffect, useState } from "react";
import { authApi } from "../api/resources";
import Spinner from "../components/Spinner";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.users().then((response) => setUsers(response.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Users</h2>
        <p className="mt-1 text-sm text-slate-400">Registered user profiles and role assignments.</p>
      </div>
      <section className="overflow-hidden rounded-md border border-line bg-panel">
        {loading ? <div className="p-5"><Spinner label="Loading users" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface text-slate-300">
                <tr>
                  {["ID", "Name", "Email", "Role", "Active", "Created"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id} className="text-slate-300">
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3">{user.full_name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{new Date(user.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
