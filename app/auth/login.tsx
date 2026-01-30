import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import { MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { logUserLogin, signInWithEmail } from "../../supabaseClient";
import PublicRoute from "../components/PublicRoute";

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const router = useRouter();

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email blur to validate
  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Enhanced login handler with better validation and error handling
  const handleLogin = async () => {
    // Clear previous errors
    setError("");
    setEmailError("");

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Dismiss keyboard
    Keyboard.dismiss();

    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await signInWithEmail(
        email.trim().toLowerCase(),
        password,
      );

      if (authError) {
        // Custom error messages for better UX
        let errorMessage = authError.message;

        if (authError.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (authError.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email before logging in.";
        } else if (authError.message.includes("too many requests")) {
          errorMessage = "Too many login attempts. Please try again later.";
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Log the login activity to the database
        try {
          await logUserLogin(data.user.id);
        } catch (logError) {
          console.error("Failed to log user activity:", logError);
          // Don't block login if activity logging fails
        }

        // Success - navigate to home
        router.replace("/");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key on web
  const handleKeyPress = (e: any) => {
    if (Platform.OS === "web" && e.nativeEvent.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <PublicRoute>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Header */}
          <View style={styles.headerSection}>
            <Text
              style={[
                styles.headerText,
                {
                  fontFamily: fontsLoaded
                    ? "PressStart2P_400Regular"
                    : undefined,
                },
              ]}
            >
              SOCAI
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>LOGIN</Text>
            <Text style={styles.subtitle}>
              Welcome back! Please login to continue.
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={18} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  emailError && styles.inputError,
                  !loading && email && !emailError && styles.inputValid,
                ]}
                placeholder="Enter your email"
                placeholderTextColor="#b0a8ba"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                  setError("");
                }}
                onBlur={handleEmailBlur}
                onKeyPress={handleKeyPress}
                editable={!loading}
              />
              {emailError ? (
                <Text style={styles.fieldError}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor="#b0a8ba"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={22}
                    color="#6d6875"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (loading || !email || !password) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.loadingText}>Logging in...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>LOGIN</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/signup")}
                disabled={loading}
              >
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PublicRoute>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 60,
    height: 100,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 36,
    fontWeight: "200",
    color: "#6d6875",
    textAlign: "center",
    letterSpacing: 2,
  },
  formContainer: {
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d2d2d",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: "#6d6875",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "400",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffe5e5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#ff6b6b",
    fontWeight: "500",
    flex: 1,
  },
  fieldError: {
    fontSize: 12,
    color: "#ff6b6b",
    marginTop: 4,
    marginLeft: 4,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d2d2d",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2d2d2d",
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#ff6b6b",
    backgroundColor: "#fff5f5",
  },
  inputValid: {
    borderColor: "#10a37f",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  button: {
    backgroundColor: "#87bfff",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 28,
    alignItems: "center",
    shadowColor: "#87bfff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#6d6875",
    fontWeight: "500",
  },
  footerLink: {
    fontSize: 13,
    color: "#87bfff",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
