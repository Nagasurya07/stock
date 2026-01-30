import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import { MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { signUpWithEmail } from "../../supabaseClient";
import PublicRoute from "../components/PublicRoute";

export default function SignupScreen() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState("");

  const router = useRouter();

  // Real-time validation functions
  const validateName = (name: string, fieldName: string): string => {
    if (!name.trim()) return "";
    if (name.trim().length < 2)
      return `${fieldName} must be at least 2 characters`;
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim()))
      return `${fieldName} contains invalid characters`;
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Invalid email format";
    return "";
  };

  const calculatePasswordStrength = (pwd: string): string => {
    if (!pwd) return "";
    if (pwd.length < 6) return "weak";

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    const criteriaMet = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
      Boolean,
    ).length;

    if (pwd.length >= 12 && criteriaMet >= 4) return "very-strong";
    if (pwd.length >= 10 && criteriaMet >= 3) return "strong";
    if (pwd.length >= 8 && criteriaMet >= 2) return "moderate";
    return "weak";
  };

  // Handle field changes with validation
  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    setError("");
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    setError("");
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setFieldErrors({ ...fieldErrors, email: "" });
    setError("");
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(calculatePasswordStrength(text));
    setFieldErrors({ ...fieldErrors, password: "" });
    setError("");
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setFieldErrors({ ...fieldErrors, confirmPassword: "" });
    setError("");
  };

  // Handle blur events
  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setFieldErrors({ ...fieldErrors, email: error });
  };

  // Enhanced signup handler
  const handleSignup = async () => {
    // Clear previous errors
    setError("");
    setFieldErrors({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    // Validate all fields
    const errors: any = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    } else {
      const nameError = validateName(firstName, "First name");
      if (nameError) errors.firstName = nameError;
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    } else {
      const nameError = validateName(lastName, "Last name");
      if (nameError) errors.lastName = nameError;
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailError = validateEmail(email);
      if (emailError) errors.email = emailError;
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // If there are validation errors, display them
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors above");
      return;
    }

    // Dismiss keyboard
    Keyboard.dismiss();

    setLoading(true);

    try {
      // Sign up with email, password, and user metadata
      const { data, error: authError } = await signUpWithEmail(
        email.trim().toLowerCase(),
        password,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          displayName: `${firstName.trim()} ${lastName.trim()}`,
        },
      );

      if (authError) {
        // Handle email signups disabled error
        if (
          authError.message.includes("Email signups are disabled") ||
          authError.message.includes("signups not allowed") ||
          authError.message.includes("Signups not allowed")
        ) {
          Alert.alert(
            "🔒 Email Signups Disabled",
            "Email signups are currently disabled in Supabase settings. Please enable them:\n\n1. Go to Supabase Dashboard\n2. Authentication → Providers → Email\n3. Toggle ON 'Enable Email provider'\n4. Click Save\n\nSee QUICKFIX_EMAIL_RATE_LIMIT.md for details.",
            [
              {
                text: "OK",
                style: "default",
              },
            ],
          );
          setLoading(false);
          return;
        }

        // Handle email rate limit errors gracefully
        if (
          authError.message.includes("email rate limit exceeded") ||
          authError.message.includes("rate limit") ||
          authError.message.includes("too many requests")
        ) {
          // Email rate limit hit - but we'll use OTP system instead
          Alert.alert(
            "⚠️ Email Service Limit Reached",
            "Supabase's email service has reached its limit, but don't worry! We'll use our OTP system instead. Your account may already exist - try logging in, or contact support if you need help.",
            [
              {
                text: "Try Login",
                onPress: () => router.push("/auth/login"),
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ],
          );
          setLoading(false);
          return;
        }

        // Custom error messages for other errors
        let errorMessage = authError.message;

        if (authError.message.includes("User already registered")) {
          errorMessage =
            "This email is already registered. Please login instead.";
        } else if (authError.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (authError.message.includes("Password should be")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (authError.message.includes("Unable to validate email")) {
          errorMessage = "Unable to send verification email. Please try again.";
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Success - redirect to login
        Alert.alert(
          "✅ Account Created!",
          `Welcome ${firstName}! Your account has been created successfully. Please login to continue.`,
          [
            {
              text: "Go to Login",
              onPress: () => {
                router.push("/auth/login");
              },
            },
          ],
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key on web
  const handleKeyPress = (e: any) => {
    if (Platform.OS === "web" && e.nativeEvent.key === "Enter") {
      handleSignup();
    }
  };

  // Check if form is complete
  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password.length >= 6 &&
    confirmPassword &&
    password === confirmPassword;

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

          {/* Signup Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>SIGN UP</Text>
            <Text style={styles.subtitle}>
              Create your account to get started
            </Text>

            {/* General Error Message */}
            {error && !Object.values(fieldErrors).some((e) => e) ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={18} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* First Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[
                  styles.input,
                  fieldErrors.firstName && styles.inputError,
                  !loading &&
                    firstName &&
                    !fieldErrors.firstName &&
                    styles.inputValid,
                ]}
                placeholder="Enter your first name"
                placeholderTextColor="#b0a8ba"
                autoCapitalize="words"
                autoComplete="name-given"
                textContentType="givenName"
                value={firstName}
                onChangeText={handleFirstNameChange}
                onKeyPress={handleKeyPress}
                editable={!loading}
              />
              {fieldErrors.firstName ? (
                <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>
              ) : null}
            </View>

            {/* Last Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[
                  styles.input,
                  fieldErrors.lastName && styles.inputError,
                  !loading &&
                    lastName &&
                    !fieldErrors.lastName &&
                    styles.inputValid,
                ]}
                placeholder="Enter your last name"
                placeholderTextColor="#b0a8ba"
                autoCapitalize="words"
                autoComplete="name-family"
                textContentType="familyName"
                value={lastName}
                onChangeText={handleLastNameChange}
                onKeyPress={handleKeyPress}
                editable={!loading}
              />
              {fieldErrors.lastName ? (
                <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  fieldErrors.email && styles.inputError,
                  !loading && email && !fieldErrors.email && styles.inputValid,
                ]}
                placeholder="Enter your email"
                placeholderTextColor="#b0a8ba"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                onKeyPress={handleKeyPress}
                editable={!loading}
              />
              {fieldErrors.email ? (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    fieldErrors.password && styles.inputError,
                  ]}
                  placeholder="Create a password (min 6 characters)"
                  placeholderTextColor="#b0a8ba"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  value={password}
                  onChangeText={handlePasswordChange}
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
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : passwordStrength ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        passwordStrength === "weak" && styles.strengthWeak,
                        passwordStrength === "moderate" &&
                          styles.strengthModerate,
                        passwordStrength === "strong" && styles.strengthStrong,
                        passwordStrength === "very-strong" &&
                          styles.strengthVeryStrong,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.strengthText,
                      passwordStrength === "weak" && { color: "#ff6b6b" },
                      passwordStrength === "moderate" && { color: "#ffa500" },
                      (passwordStrength === "strong" ||
                        passwordStrength === "very-strong") && {
                        color: "#10a37f",
                      },
                    ]}
                  >
                    {passwordStrength === "weak" && "Weak"}
                    {passwordStrength === "moderate" && "Moderate"}
                    {passwordStrength === "strong" && "Strong"}
                    {passwordStrength === "very-strong" && "Very Strong"}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    fieldErrors.confirmPassword && styles.inputError,
                    !loading &&
                      confirmPassword &&
                      password === confirmPassword &&
                      styles.inputValid,
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#b0a8ba"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  onKeyPress={handleKeyPress}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                    size={22}
                    color="#6d6875"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword ? (
                <Text style={styles.fieldError}>
                  {fieldErrors.confirmPassword}
                </Text>
              ) : confirmPassword && password === confirmPassword ? (
                <Text style={styles.successText}>✓ Passwords match</Text>
              ) : null}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (loading || !isFormValid) && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.loadingText}>Creating account...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/login")}
                disabled={loading}
              >
                <Text style={styles.footerLink}>Login</Text>
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
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 50,
    height: 90,
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
  successText: {
    fontSize: 12,
    color: "#10a37f",
    marginTop: 4,
    marginLeft: 4,
  },
  inputWrapper: {
    marginBottom: 18,
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
  strengthContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthWeak: {
    width: "25%",
    backgroundColor: "#ff6b6b",
  },
  strengthModerate: {
    width: "50%",
    backgroundColor: "#ffa500",
  },
  strengthStrong: {
    width: "75%",
    backgroundColor: "#10a37f",
  },
  strengthVeryStrong: {
    width: "100%",
    backgroundColor: "#0d8a68",
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 80,
  },
  button: {
    backgroundColor: "#10a37f",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 28,
    alignItems: "center",
    shadowColor: "#10a37f",
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
    color: "#10a37f",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
