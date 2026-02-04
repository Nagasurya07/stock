/**
 * Login Utility Functions
 * Optimized authentication logic for better code organization
 */

/**
 * Validates email format using regex
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters",
    };
  }

  if (password.length < 8) {
    return {
      isValid: true,
      message: "Password is weak. Consider using 8+ characters",
      strength: "weak",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore =
    [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean)
      .length;

  if (strengthScore >= 3) {
    return {
      isValid: true,
      message: "Password is strong",
      strength: "strong",
    };
  }

  if (strengthScore >= 2) {
    return {
      isValid: true,
      message: "Password is moderate",
      strength: "moderate",
    };
  }

  return {
    isValid: true,
    message: "Password is weak. Add uppercase, numbers, or special characters",
    strength: "weak",
  };
};

/**
 * Sanitizes user input by trimming whitespace
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim();
};

/**
 * Formats authentication errors for user-friendly messages
 * @param {object} error - The Supabase auth error
 * @returns {string} - User-friendly error message
 */
export const formatAuthError = (error) => {
  if (!error) return "An unexpected error occurred";

  const errorMessage = error.message || error.toString();

  // Map common Supabase errors to user-friendly messages
  const errorMap = {
    "Invalid login credentials": "Invalid email or password. Please try again.",
    "Email not confirmed":
      "Please verify your email before logging in. Check your inbox.",
    "User already registered": "This email is already registered. Please login.",
    "Password should be at least 6 characters":
      "Password must be at least 6 characters long.",
    "Signups not allowed": "Account creation is temporarily disabled.",
    "Email rate limit exceeded":
      "Too many attempts. Please try again in a few minutes.",
    "too many requests": "Too many login attempts. Please try again later.",
  };

  // Find matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Return original message if no match found
  return errorMessage;
};

/**
 * Checks if user session is valid
 * @param {object} session - The Supabase session object
 * @returns {boolean} - True if session is valid
 */
export const isSessionValid = (session) => {
  if (!session || !session.access_token) return false;

  // Check if session has expired
  const expiresAt = session.expires_at;
  if (expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    return now < expiresAt;
  }

  return true;
};

/**
 * Gets user display name from user object
 * @param {object} user - The Supabase user object
 * @returns {string} - User display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return "Guest";

  if (user.user_metadata) {
    const { first_name, last_name, full_name } = user.user_metadata;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    if (full_name) return full_name;
  }

  // Fallback to email
  if (user.email) {
    return user.email.split("@")[0];
  }

  return "User";
};

/**
 * Delays execution for rate limiting or UX improvements
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry mechanism for failed auth requests
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delayMs - Delay between retries
 * @returns {Promise} - Result of the function
 */
export const retryAuth = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await delay(delayMs * (i + 1)); // Exponential backoff
      }
    }
  }

  throw lastError;
};
