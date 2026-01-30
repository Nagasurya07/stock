import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import { MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../supabaseClient";

export default function VerifyEmailScreen() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Get email from route params or query
  const getEmailFromUrl = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
      }
    } catch (error) {
      console.error("Error getting email:", error);
    }
  };

  // Check if email is verified
  const checkEmailVerification = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        // Email verified!
        Alert.alert("✅ Success!", "Your email has been verified!", [
          {
            text: "Go to Login",
            onPress: () => router.push("/auth/login"),
          },
        ]);
      } else {
        Alert.alert(
          "⏳ Pending",
          "Your email has not been verified yet. Please check your email and click the confirmation link.",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to check verification status");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resendEmailConfirmation(email);

      if (error) {
        Alert.alert(
          "Error",
          error.message || "Failed to resend verification email",
        );
      } else {
        Alert.alert(
          "✅ Email Sent!",
          `A new verification email has been sent to ${email}`,
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Open email app
  const openEmailApp = async () => {
    try {
      // Try to open the email app
      await Linking.openURL("mailto:");
    } catch (error) {
      console.error("Error opening email app:", error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text
          style={[
            styles.headerText,
            {
              fontFamily: fontsLoaded ? "PressStart2P_400Regular" : undefined,
            },
          ]}
        >
          SOCAI
        </Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="mail-outline" size={64} color="#87bfff" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Your Email</Text>

        {/* Message */}
        <Text style={styles.message}>
          We've sent a confirmation email to verify your account. Please click
          the link in the email to activate your account.
        </Text>

        {/* Email Display */}
        {email ? (
          <View style={styles.emailBox}>
            <MaterialIcons name="email" size={20} color="#87bfff" />
            <Text style={styles.emailText}>{email}</Text>
          </View>
        ) : null}

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>What to do:</Text>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Check your inbox and spam folder
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Look for email from Supabase</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Click "Confirm Email" button</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>You'll be redirected to login</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Check Verification Button */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={checkEmailVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Check Verification Status</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Open Email App Button */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={openEmailApp}
            disabled={loading}
          >
            <MaterialIcons name="open-in-new" size={20} color="#87bfff" />
            <Text style={styles.secondaryButtonText}>Open Email App</Text>
          </TouchableOpacity>

          {/* Resend Email Button */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={resendVerificationEmail}
            disabled={loading}
          >
            <MaterialIcons name="mail-outline" size={20} color="#87bfff" />
            <Text style={styles.secondaryButtonText}>
              Resend Verification Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Already Verified Link */}
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => router.push("/auth/login")}
          disabled={loading}
        >
          <Text style={styles.linkText}>Already verified? Go to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f2e8",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  headerText: {
    fontSize: 32,
    fontWeight: "200",
    color: "#6d6875",
    textAlign: "center",
    letterSpacing: 2,
  },
  contentContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d2d2d",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    color: "#6d6875",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emailBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#87bfff",
  },
  emailText: {
    fontSize: 13,
    color: "#2d2d2d",
    fontWeight: "600",
    flex: 1,
  },
  stepsContainer: {
    marginBottom: 28,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d2d2d",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#87bfff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  stepText: {
    fontSize: 14,
    color: "#2d2d2d",
    flex: 1,
    paddingTop: 6,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#87bfff",
    shadowColor: "#87bfff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#87bfff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#87bfff",
    letterSpacing: 0.5,
  },
  linkContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 13,
    color: "#87bfff",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
