import { expect, test } from "@playwright/test";

// Happy path: browse -> add to cart -> checkout as guest -> pay on delivery -> confirmation.
// Pay on delivery is first-order only, so each run uses a fresh email address.
test("guest buys a plan with pay on delivery", async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`;

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/lose weight/i);
  await page.goto("/shop?tab=plans");
  await page.getByRole("link", { name: /Naija Lean 1400/ }).first().click();
  await expect(page).toHaveURL(/\/plans\/naija-lean-1400/);

  await page.getByRole("button", { name: "Add to Cart", exact: false }).first().click();
  await expect(page.getByText("Item added to cart")).toBeVisible();
  await page.getByRole("link", { name: "Checkout" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Customer");
  await page.getByLabel("Phone number (WhatsApp)").fill("08030000000");
  await page.getByLabel("Delivery address").fill("12 Admiralty");
  await page.getByRole("button", { name: "Review order" }).first().click();
  await expect(page.getByText("Please provide a more detailed address")).toBeVisible();

  await page.getByLabel("Delivery address").fill("12 Admiralty Way, Lekki Phase 1, opposite Circle Mall");
  await page.getByRole("button", { name: "Review order" }).first().click();

  await expect(page).toHaveURL(/\/checkout\/pay\?o=/);
  await page.getByText("Pay on delivery", { exact: true }).click();
  await page.getByRole("button", { name: "Place order" }).first().click();

  await expect(page).toHaveURL(/\/order\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Order confirmed");
  await expect(page.getByText(/CL-\d+/).first()).toBeVisible();
});
