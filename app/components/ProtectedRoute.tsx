import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!session && !inAuthGroup) {
      // User is not logged in and trying to access protected route
      router.replace("/auth/login");
    }
  }, [session, loading, segments]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f2e8",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text
          style={{
            marginTop: 20,
            fontSize: 16,
            color: "#666",
            fontWeight: "500",
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  // If no session and not in auth group, don't render (will redirect)
  if (!session && segments[0] !== "auth") {
    return null;
  }

  return <>{children}</>;
}
