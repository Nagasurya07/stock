import { supabase } from "../../supabaseClient";

/**
 * Signs out the current user and (optionally) redirects to the index page.
 *
 * @param {object} options
 * @param {import("expo-router").Router | undefined} options.router - Optional router instance to navigate after signout.
 * @returns {Promise<{ success: boolean; error?: Error | null; redirected?: boolean }>} Result of the signout attempt.
 */
export const signOutAndRedirect = async ({ router } = {}) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Signout error:", error);
      return { success: false, error, redirected: false };
    }

    // Navigate home if a router is provided (Expo Router)
    if (router && typeof router.replace === "function") {
      router.replace("/");
      return { success: true, error: null, redirected: true };
    }

    return { success: true, error: null, redirected: false };
  } catch (err) {
    console.error("Signout failed:", err);
    return { success: false, error: err, redirected: false };
  }
};

/**
 * Convenience helper to use without a router. Keeps API parity with other middleware helpers.
 */
export const signOutUser = async () => {
  const result = await signOutAndRedirect();
  return { success: result.success, error: result.error };
};

/**
 * Example usage inside a component:
 *
 * import { useRouter } from "expo-router";
 * import { signOutAndRedirect } from "@/script/middleware/signout";
 *
 * const router = useRouter();
 * await signOutAndRedirect({ router });
 */
