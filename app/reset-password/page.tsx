"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function establishRecoverySession() {
      try {
        // First check whether Supabase has already established the session
        // from the recovery link.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          if (mounted) setRecoveryReady(true);
          return;
        }

        // Support recovery links that return tokens in the URL fragment.
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          if (!data.session) {
            throw new Error("The recovery session could not be established. Please request a new password reset link.");
          }

          // Remove sensitive tokens from the address bar after the session is saved.
          window.history.replaceState(
            null,
            document.title,
            window.location.pathname + window.location.search
          );

          if (mounted) setRecoveryReady(true);
          return;
        }

        // Also support PKCE recovery links that return a one-time code.
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
          if (!data.session) {
            throw new Error("The recovery session could not be established. Please request a new password reset link.");
          }

          window.history.replaceState(
            null,
            document.title,
            window.location.pathname
          );

          if (mounted) setRecoveryReady(true);
          return;
        }

        throw new Error("Your password recovery session is missing or has expired. Please request a new password reset link.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to verify your password recovery link.";

        if (mounted) {
          setRecoveryError(message);
          setRecoveryReady(false);
        }
      } finally {
        if (mounted) setCheckingRecovery(false);
      }
    }

    establishRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (saving) return;

    if (!recoveryReady) {
      toast.error("Your recovery session is not valid. Please request a new reset link.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      // Confirm that the recovery session is still active before updating.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error("Your recovery session has expired. Please request a new password reset link.");
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Password updated successfully.");
      window.location.href = "/login";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password.";

      toast.error(message);
      setRecoveryError(message);
      setRecoveryReady(false);
    } finally {
      setSaving(false);
    }
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

          {checkingRecovery ? (
            <p className="rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-gray-400">
              Verifying your password recovery link...
            </p>
          ) : recoveryReady ? (
            <p className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              Recovery link verified. You can now choose a new password.
            </p>
          ) : (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {recoveryError || "Your recovery session is missing or has expired."}
              <a
                href="/forget-password"
                className="mt-2 block font-medium text-white underline underline-offset-4"
              >
                Request a new password reset link
              </a>
            </div>
          )}

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
              disabled={!recoveryReady || checkingRecovery || saving}
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!recoveryReady || checkingRecovery || saving}
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={saving || checkingRecovery || !recoveryReady}
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