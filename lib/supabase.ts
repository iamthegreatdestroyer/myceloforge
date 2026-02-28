import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or ANON_KEY not configured. Database features will not work."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

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
