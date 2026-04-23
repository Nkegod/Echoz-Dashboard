"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        router.replace("/");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast.success("Login successful.");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/4 p-6 text-center">
          <p className="text-sm text-gray-400">Checking session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="min-h-screen grid lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between border-r border-white/10 p-10 xl:p-14">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/images/echoz-logo.png"
                alt="ECHOZ Logo"
                width={150}
                height={52}
                priority
              />
              <span className="text-gray-200 text-lg font-semibold tracking-wide">
                MULTI VENTURES LTD
              </span>
            </div>

            <div className="mt-16 max-w-xl">
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gray-500">
                Sales & Inventory Dashboard
              </p>

              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-tight text-white">
                Smart business control for stock, sales, and performance.
              </h1>

              <p className="mt-5 text-base leading-7 text-gray-400">
                Access your dashboard to monitor inventory, record sales, and
                manage daily business operations in one secure system.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-gray-300">
              Secure access for authorized staff only.
            </p>
            <p className="mt-2 text-xs leading-6 text-gray-500">
              Admin users can manage stock and inventory records, while staff
              users can record sales based on assigned permissions.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
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

            <div className="rounded-2xl border border-white/10 bg-white/4 p-6 shadow-2xl sm:p-8">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Sign In
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Sign in to access your dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      Password
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-xs leading-6 text-gray-500">
                  This system is restricted to authorized users. Contact your
                  administrator if you need account access.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-600">
              © 2026 ECHOZ MULTI VENTURES LTD. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}