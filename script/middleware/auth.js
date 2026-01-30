/**
 * Authentication Middleware
 * Handles route protection and session management
 */

import { supabase } from "../../supabaseClient";

/**
 * Check if user is authenticated
 * @returns {Promise<object>} - Auth state with user and session
 */
export const checkAuth = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Auth check error:", error);
      return { authenticated: false, user: null, session: null, error };
    }

    if (!session) {
      return { authenticated: false, user: null, session: null };
    }

    // Verify session is not expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && now >= session.expires_at) {
      return { authenticated: false, user: null, session: null };
    }

    return {
      authenticated: true,
      user: session.user,
      session,
    };
  } catch (error) {
    console.error("Auth check failed:", error);
    return { authenticated: false, user: null, session: null, error };
  }
};

/**
 * Refresh user session if needed
 * @returns {Promise<object>} - Refreshed session or error
 */
export const refreshSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Session refresh error:", error);
      return { success: false, session: null, error };
    }

    return { success: true, session, error: null };
  } catch (error) {
    console.error("Session refresh failed:", error);
    return { success: false, session: null, error };
  }
};

/**
 * Sign out user and clear session
 * @returns {Promise<object>} - Sign out result
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Sign out failed:", error);
    return { success: false, error };
  }
};

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function for auth state changes
 * @returns {object} - Subscription object
 */
export const onAuthStateChange = (callback) => {
  const { data: subscription } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );

  return subscription;
};

/**
 * Get current user profile
 * @returns {Promise<object>} - User profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, profile: null, error };
    }

    return {
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        createdAt: user.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error("Get user profile failed:", error);
    return { success: false, profile: null, error };
  }
};

/**
 * Check if session needs refresh (within 5 minutes of expiry)
 * @param {object} session - Current session
 * @returns {boolean} - True if refresh needed
 */
export const shouldRefreshSession = (session) => {
  if (!session || !session.expires_at) return false;

  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;

  return session.expires_at - now < fiveMinutes;
};
