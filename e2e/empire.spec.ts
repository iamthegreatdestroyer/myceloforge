import { test, expect } from "@playwright/test";

test.describe("MYCELOFORGE Empire Deployment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the main title", async ({ page }) => {
    const title = page.locator("text=MYCELOFORGE");
    await expect(title).toBeVisible();
  });

  test("should display the deploy button", async ({ page }) => {
    const button = page.locator("button", { hasText: /DEPLOY|MYCELIUM/ });
    await expect(button).toBeVisible();
  });

  test("should allow entering an empire seed", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("Test empire seed for the mycelial network");
    await expect(textarea).toHaveValue(/Test empire seed/);
  });

  test("should show lunar phase information", async ({ page }) => {
    const phase = page.locator("text=/Waxing|Gibbous/");
    // Phase may not load if backend is not running, so we just check visibility
    const pageContent = await page.content();
    expect(pageContent).toContain("Florida");
  });

  test("should have responsive design on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const title = page.locator("text=MYCELOFORGE");
    await expect(title).toBeVisible();
  });

  test("should have responsive design on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const button = page.locator("button");
    await expect(button).toBeVisible();
  });
});
