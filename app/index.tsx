import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Header from "./components/header";
import Hero from "./components/hero";
import { useAuth } from "./contexts/AuthContext";

export default function Index() {
  const [showInputOnly, setShowInputOnly] = useState(false);
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log(
      "🟢 Index: session changed to:",
      session ? "logged in" : "null",
    );
    console.log("🟢 Index: loading:", loading);

    if (loading) {
      console.log("🟢 Index: Still loading, not doing anything");
      return;
    }

    if (!session) {
      console.log("🟢 Index: No session detected, redirecting to /auth/login");
      router.replace("/auth/login");
    }
  }, [session, loading]);

  // Show loading screen while checking auth
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

  // Don't render home if not logged in (will redirect)
  if (!session) {
    return null;
  }

  return (
    <View style={{ backgroundColor: "#f8f2e8", flex: 1 }}>
      <Header
        onNewChat={() => setShowInputOnly(true)}
        onHome={() => setShowInputOnly(false)}
      />
      <Hero
        inputOnly={showInputOnly}
        onExitInputOnly={() => setShowInputOnly(false)}
      />
    </View>
  );
}
