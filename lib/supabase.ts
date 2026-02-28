import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase URL or ANON_KEY not configured. Database features will not work."
    );
    // Return a stub that doesn't validate the URL
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// For backward compatibility - stub object to avoid import errors during build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ error: null }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
};

export type Empire = {
  id: string;
  seed: string;
  result: string;
  lunar_phase: string;
  created_at: string;
  user_id: string;
};

export type User = {
  id: string;
  email: string;
  wallet_address: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  empire_id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  created_at: string;
};
