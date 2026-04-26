"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    if (sending) return;

    setSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setSending(false);
      return;
    }

    toast.success("Password reset link sent. Check your email.");
    setEmail("");
    setSending(false);
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
          onSubmit={handleReset}
          className="rounded-2xl border border-white/10 bg-white/4 p-6 shadow-2xl sm:p-8 space-y-5"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Password Recovery
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Enter your email address and we will send you a password reset
              link.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Reset Link"}
          </button>

          <a
            href="/login"
            className="block text-center text-sm text-gray-400 hover:text-white transition"
          >
            Back to Login
          </a>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          © 2026 ECHOZ MULTI VENTURES LTD. All rights reserved.
        </p>
      </div>
    </main>
  );
}