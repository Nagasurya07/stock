import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

interface ProfileCardProps {
  onClose?: () => void;
}

export default function ProfileCard({ onClose }: ProfileCardProps) {
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Extract user information from metadata or email
  const firstName = (user?.user_metadata?.first_name as string) || "User";
  const lastName = (user?.user_metadata?.last_name as string) || "";
  const email = user?.email || "No email";
  const fullName = `${firstName} ${lastName}`.trim() || email;

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log("🔴 Starting logout process...");
      console.log("🔴 Current user before logout:", user?.email);

      await signOut();

      console.log("🔴 Signout completed");
      console.log("🔴 Closing profile card...");

      onClose?.();

      console.log("🔴 Logout complete - index.tsx will handle redirect");
      // Don't manually redirect - let index.tsx detect session=null and redirect
      // This prevents race conditions with PublicRoute
    } catch (error) {
      console.error("🔴 Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop - use Pressable so it doesn't block siblings */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Profile Card - elevation ensures it sits above backdrop */}
      <View style={styles.card} pointerEvents="auto">
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#6d6875" />
        </TouchableOpacity>

        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={48} color="#ffffff" />
          </View>
        </View>

        {/* User Info */}
        <View style={styles.infoContainer}>
          {/* Name */}
          <Text style={styles.name}>{fullName}</Text>

          {/* Email */}
          <Text style={styles.email}>{email}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onClose}
            >
              <MaterialIcons name="edit" size={18} color="#ffffff" />
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={18} color="#ffffff" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Logout Confirmation */}
      {showLogoutConfirm ? (
        <View style={styles.confirmOverlay} pointerEvents="auto">
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Logout</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmNoButton]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmYesButton]}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  void performLogout();
                }}
              >
                <Text style={styles.confirmYesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 12,
    backgroundColor: "transparent",
    position: "relative",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 12,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e8f0ff",
  },
  infoContainer: {
    gap: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
    textAlign: "center",
  },
  email: {
    fontSize: 13,
    color: "#6d6875",
    marginBottom: 16,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e8e8e8",
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#8e92a9",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  dividerVertical: {
    width: 1,
    backgroundColor: "#e8e8e8",
    marginHorizontal: 12,
  },
  buttonContainer: {
    gap: 10,
    marginTop: 4,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  dangerButton: {
    backgroundColor: "#c1121f",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#007bff",
  },
  secondaryButtonText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "600",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  confirmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmNoButton: {
    backgroundColor: "#111111",
  },
  confirmYesButton: {
    backgroundColor: "#c1121f",
  },
  confirmNoText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmYesText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
