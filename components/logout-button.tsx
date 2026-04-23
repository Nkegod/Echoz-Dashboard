"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Logout failed.");
      return;
    }

    toast.success("Logged out.");
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-gray-300 border border-white/10 hover:bg-gray-800 transition-colors"
    >
      Logout
    </button>
  );
}