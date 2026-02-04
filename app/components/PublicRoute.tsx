import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (session) {
      // User is already logged in, redirect to home
      router.replace("/");
    }
  }, [session, loading]);

  // Don't render if user is logged in (will redirect)
  if (loading || session) {
    return null;
  }

  return <>{children}</>;
}
