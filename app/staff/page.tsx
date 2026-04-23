"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DashboardShell from "@/components/dashboard-shell";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { supabase } from "@/lib/supabase";

type StaffProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "staff";
};

export default function StaffPage() {
  const { checking, user, profile } = useAuthGuard();

  const fullNameInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [submitting, setSubmitting] = useState(false);

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  async function loadStaff() {
    setLoadingStaff(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("full_name", { ascending: true });

    if (error) {
      toast.error("Failed to load staff: " + error.message);
      setStaffList([]);
    } else {
      setStaffList((data || []) as StaffProfile[]);
    }

    setLoadingStaff(false);
  }

  useEffect(() => {
    if (!checking && profile?.role === "admin") {
      loadStaff();
    }
  }, [checking, profile]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!user?.id) {
      toast.error("Unable to verify current user.");
      return;
    }

    if (password.trim().length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          requestedByUserId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user.");
      }

      toast.success("User account created successfully.");

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("staff");

      await loadStaff();
      fullNameInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        Checking access...
      </main>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <DashboardShell active="staff" pageLabel="Staff Management">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <h1 className="text-lg font-semibold text-red-400">Access denied</h1>
          <p className="mt-2 text-sm text-gray-300">
            Only admin users can manage staff accounts.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell active="staff" pageLabel="Staff Management">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Staff Management
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Create staff accounts and manage who can access the system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              Create New User
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Add a new account for staff or admin access.
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                ref={fullNameInputRef}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Temporary Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter temporary password"
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20"
              />
              <p className="mt-2 text-xs text-gray-500">
                Use at least 6 characters.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "staff" | "admin")}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || profile?.role !== "admin"}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating User..." : "Create User"}
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/4">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">System Users</h2>
              <p className="text-sm text-gray-400">
                Existing users and assigned roles.
              </p>
            </div>

            <button
              onClick={loadStaff}
              disabled={loadingStaff}
              className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingStaff ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 text-left text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Full Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loadingStaff ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : staffList.length > 0 ? (
                  staffList.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-white/3"
                    >
                      <td className="px-4 py-3 text-gray-100">
                        {item.full_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {item.email || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium border ${
                            item.role === "admin"
                              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}