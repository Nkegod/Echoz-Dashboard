"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "staff";
};

export function useAuthGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (mounted) setChecking(false);
        router.replace("/login");
        return;
      }

      if (!mounted) return;
      setUser(session.user);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", session.user.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("Failed to load profile:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setChecking(false);
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  return { checking, user, profile };
}