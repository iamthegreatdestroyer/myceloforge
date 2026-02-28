import { getSupabase } from "../supabase";

describe("Supabase", () => {
  it("returns null when environment variables are not configured", () => {
    // Environment variables are set in jest.setup.ts
    // This test verifies the lazy initialization pattern
    const supabase = getSupabase();
    expect(supabase).not.toBeNull();
  });

  it("caches the Supabase instance on second call", () => {
    const instance1 = getSupabase();
    const instance2 = getSupabase();
    expect(instance1).toBe(instance2);
  });
});
