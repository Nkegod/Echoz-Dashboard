"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (saving) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    toast.success("Password updated successfully.");
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/images/echoz-logo.png"
            alt="ECHOZ Logo"
            width={150}
            height={52}
            priority
          />
          <p className="mt-3 text-sm tracking-wide text-gray-400">
            MULTI VENTURES LTD
          </p>
        </div>

        <form
          onSubmit={handleUpdatePassword}
          className="rounded-2xl border border-white/10 bg-white/4 p-6 shadow-2xl sm:p-8 space-y-5"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Create New Password
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Enter and confirm your new password.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">
                New Password
              </label>

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs text-gray-500 transition hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          © 2026 ECHOZ MULTI VENTURES LTD. All rights reserved.
        </p>
      </div>
    </main>
  );
}