/**
 * Signup Utility Functions
 * Optimized signup logic with comprehensive validation
 */

/**
 * Validates name fields (first name, last name)
 * @param {string} name - The name to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {object} - Validation result
 */
export const validateName = (name, fieldName = "Name") => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      message: `${fieldName} is required`,
    };
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 2 characters`,
    };
  }

  if (name.trim().length > 50) {
    return {
      isValid: false,
      message: `${fieldName} must be less than 50 characters`,
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return {
      isValid: false,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {object} - Validation result
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      message: "Email is required",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      message: "Please enter a valid email address",
    };
  }

  // Check for common typos in email domains
  const commonDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
  ];
  const emailDomain = email.split("@")[1]?.toLowerCase();
  const typos = {
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "yahooo.com": "yahoo.com",
    "hotmial.com": "hotmail.com",
  };

  if (typos[emailDomain]) {
    return {
      isValid: true,
      message: `Did you mean ${email.split("@")[0]}@${typos[emailDomain]}?`,
      suggestion: `${email.split("@")[0]}@${typos[emailDomain]}`,
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * Validates password with strength checking
 * @param {string} password - The password to validate
 * @returns {object} - Validation result with strength indicator
 */
export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return {
      isValid: false,
      message: "Password is required",
      strength: "none",
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters",
      strength: "weak",
    };
  }

  // Check password strength
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaMet = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;

  let strength = "weak";
  let message = "Password is weak";

  if (password.length >= 12 && criteriaMet >= 4) {
    strength = "very-strong";
    message = "Password is very strong";
  } else if (password.length >= 10 && criteriaMet >= 3) {
    strength = "strong";
    message = "Password is strong";
  } else if (password.length >= 8 && criteriaMet >= 2) {
    strength = "moderate";
    message = "Password is moderate";
  } else {
    message =
      "Add uppercase, numbers, and special characters for stronger password";
  }

  return {
    isValid: true,
    message,
    strength,
    requirements: {
      length: password.length >= 8,
      uppercase: hasUpperCase,
      lowercase: hasLowerCase,
      numbers: hasNumbers,
      specialChar: hasSpecialChar,
    },
  };
};

/**
 * Validates password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} - Validation result
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return {
      isValid: false,
      message: "Please confirm your password",
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: "Passwords do not match",
    };
  }

  return {
    isValid: true,
    message: "Passwords match",
  };
};

/**
 * Validates all signup form fields
 * @param {object} formData - Form data object
 * @returns {object} - Validation result for all fields
 */
export const validateSignupForm = (formData) => {
  const { firstName, lastName, email, password, confirmPassword } = formData;

  const errors = {};

  // Validate first name
  const firstNameValidation = validateName(firstName, "First name");
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.message;
  }

  // Validate last name
  const lastNameValidation = validateName(lastName, "Last name");
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.message;
  }

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  // Validate password match
  const matchValidation = validatePasswordMatch(password, confirmPassword);
  if (!matchValidation.isValid) {
    errors.confirmPassword = matchValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    emailSuggestion: emailValidation.suggestion,
  };
};

/**
 * Formats user data for Supabase metadata
 * @param {object} userData - User data from form
 * @returns {object} - Formatted metadata object
 */
export const formatUserMetadata = (userData) => {
  const { firstName, lastName } = userData;

  return {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    full_name: `${firstName.trim()} ${lastName.trim()}`,
    display_name: `${firstName.trim()} ${lastName.trim()}`,
  };
};

/**
 * Sanitizes form inputs
 * @param {object} formData - Raw form data
 * @returns {object} - Sanitized form data
 */
export const sanitizeSignupData = (formData) => {
  return {
    firstName: formData.firstName?.trim() || "",
    lastName: formData.lastName?.trim() || "",
    email: formData.email?.trim().toLowerCase() || "",
    password: formData.password || "", // Don't trim passwords
    confirmPassword: formData.confirmPassword || "", // Don't trim passwords
  };
};

/**
 * Calculates form completion percentage
 * @param {object} formData - Form data
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateFormCompletion = (formData) => {
  const fields = [
    "firstName",
    "lastName",
    "email",
    "password",
    "confirmPassword",
  ];
  const completed = fields.filter(
    (field) => formData[field]?.trim().length > 0,
  ).length;
  return Math.round((completed / fields.length) * 100);
};

/**
 * Checks if form is ready to submit
 * @param {object} formData - Form data
 * @returns {boolean} - True if all fields are filled
 */
export const isFormComplete = (formData) => {
  return calculateFormCompletion(formData) === 100;
};
