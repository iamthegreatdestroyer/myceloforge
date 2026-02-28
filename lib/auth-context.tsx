"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { getSupabase } from "./supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check auth session (only in browser)
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Check for connected wallet in localStorage
      const savedWallet = localStorage.getItem("walletAddress");
      if (savedWallet) {
        setWalletAddress(savedWallet);
      }

      return () => {
        data?.subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Auth initialization error:", error);
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setWalletAddress(null);
    localStorage.removeItem("walletAddress");
  };

  const connectWallet = async () => {
    try {
      // Phantom wallet connection logic
      const w = window as typeof window & {
        phantom?: { solana?: { connect: () => Promise<{ publicKey: { toString: () => string } }> } };
      };
      if ("phantom" in w && w.phantom && "solana" in w.phantom && w.phantom.solana) {
        const wallet = w.phantom.solana;
        const response = await wallet.connect();
        const walletAddr = response.publicKey.toString();
        setWalletAddress(walletAddr);
        localStorage.setItem("walletAddress", walletAddr);
      } else {
        throw new Error("Phantom wallet not installed");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        walletAddress,
        connectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

declare global {
  interface Window {
    phantom?: {
      solana?: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        isConnected: boolean;
      };
    };
  }
}
