"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Logout failed.");
      setSigningOut(false);
      return;
    }

    toast.success("Logged out.");
    router.push("/login");
  }

  async function handleSignOutAllDevices() {
    const confirmed = window.confirm(
      "Sign out of ECHOZ on all devices? This will also sign you out on this device."
    );

    if (!confirmed) return;

    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      toast.error("Could not sign out of all devices. Please try again.");
      setSigningOut(false);
      return;
    }

    toast.success("You have been signed out on this device. Other sessions have been revoked.");
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSignOutAllDevices}
        disabled={signingOut}
        className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-red-950/40 text-red-300 border border-red-400/20 hover:bg-red-950/70 transition-colors disabled:opacity-50"
      >
        Sign out all devices
      </button>

      <button
        onClick={handleLogout}
        disabled={signingOut}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-gray-300 border border-white/10 hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        Logout
      </button>
    </div>
  );
}
