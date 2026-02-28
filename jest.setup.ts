import "@testing-library/jest-dom";

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
process.env.RYZANSTEIN_API_URL = "http://localhost:8000";
process.env.QDRANT_URL = "http://localhost:6333";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
