import { createClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.",
  );
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: Create a helper function for signing in
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// Optional: Create a helper function for signing up with user metadata
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
  },
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: metadata?.firstName || "",
        last_name: metadata?.lastName || "",
        full_name:
          metadata?.firstName && metadata?.lastName
            ? `${metadata.firstName} ${metadata.lastName}`
            : "",
        display_name:
          metadata?.displayName || metadata?.firstName || email.split("@")[0],
      },
    },
  });
  return { data, error };
};

// Update user profile metadata
export const updateUserMetadata = async (metadata: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
}) => {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: metadata.firstName,
      last_name: metadata.lastName,
      full_name:
        metadata.firstName && metadata.lastName
          ? `${metadata.firstName} ${metadata.lastName}`
          : undefined,
      display_name: metadata.displayName,
      avatar_url: metadata.avatarUrl,
      phone_number: metadata.phoneNumber,
      bio: metadata.bio,
    },
  });
  return { data, error };
};

// Get user profile from custom table
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
};

// Update user profile in custom table
export const updateUserProfile = async (
  userId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    bio?: string;
  },
) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      first_name: updates.firstName,
      last_name: updates.lastName,
      display_name: updates.displayName,
      avatar_url: updates.avatarUrl,
      phone_number: updates.phoneNumber,
      date_of_birth: updates.dateOfBirth,
      bio: updates.bio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  return { data, error };
};

// Log user login activity
export const logUserLogin = async (userId: string) => {
  const { error } = await supabase.rpc("update_last_login", {
    user_uuid: userId,
  });
  return { error };
};

// Optional: Create a helper function for signing out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Optional: Get current user session
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};
