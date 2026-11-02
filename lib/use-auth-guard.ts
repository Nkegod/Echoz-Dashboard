"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const checkInProgress = useRef(false);
  const hasLoadedProfile = useRef(false);
  const mounted = useRef(true);

  const checkUser = useCallback(async () => {
    if (checkInProgress.current) return;
    checkInProgress.current = true;

    try {
      // getUser() verifies the session with Supabase Auth instead of
      // relying only on the session cached in this browser.
      const { data, error } = await supabase.auth.getUser();

      if (!mounted.current) return;

      if (error) {
        // A 401/403 means the session is no longer accepted. Other errors
        // may be temporary network/server problems, so do not log the user
        // out just because Supabase cannot be reached.
        if (error.status === 401 || error.status === 403) {
          await supabase.auth.signOut({ scope: "local" });
          if (mounted.current) {
            setUser(null);
            setProfile(null);
            router.replace("/login");
          }
        } else {
          console.error("Unable to verify session with Supabase:", error.message);

          // On the first check only, allow the cached session to keep the
          // dashboard usable during a temporary connection problem. The
          // focus and interval checks below will retry verification.
          if (!hasLoadedProfile.current) {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (mounted.current && session?.user) {
              setUser(session.user);
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("id, email, full_name, role")
                .eq("id", session.user.id)
                .single();

              if (!mounted.current) return;
              if (profileError) {
                console.error("Failed to load profile:", profileError.message);
              } else {
                setProfile(profileData);
              }
              hasLoadedProfile.current = true;
            }
          }
        }

        return;
      }

      if (!data.user) {
        await supabase.auth.signOut({ scope: "local" });
        if (mounted.current) {
          setUser(null);
          setProfile(null);
          router.replace("/login");
        }
        return;
      }

      setUser(data.user);

      if (!hasLoadedProfile.current) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name, role")
          .eq("id", data.user.id)
          .single();

        if (!mounted.current) return;

        if (profileError) {
          console.error("Failed to load profile:", profileError.message);
          setProfile(null);
        } else {
          setProfile(profileData);
        }
        hasLoadedProfile.current = true;
      }
    } catch (error) {
      console.error("Unexpected error while checking dashboard session:", error);
    } finally {
      checkInProgress.current = false;
      if (mounted.current) setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    mounted.current = true;
    void checkUser();

    const handleFocus = () => {
      void checkUser();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkUser();
      }
    };

    // Recheck when the user returns to this tab and periodically while
    // it remains open, so a remote sign-out is detected without a reload.
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(() => {
      void checkUser();
    }, 60_000);

    return () => {
      mounted.current = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [checkUser]);

  return { checking, user, profile };
}
