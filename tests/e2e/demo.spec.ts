import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { authenticate, makeSession, mockApi, user } from "./mock-api";
import type { User } from "../../src/types/api";

const demo: User = { ...user, name: "Demo User", email: "demo@e-pharmacy.example", role: "demo" };
for (const width of [320, 340, 360, 375, 390, 425, 768, 1439, 1440, 1920]) {
  test(`demo reads all pages while mutation controls stay unavailable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width >= 768 ? 1024 : 812 });
    const { requests } = await mockApi(page, { user: demo });
    // A forged cached role must be replaced by the actual profile on restoration.
    await authenticate(page, makeSession({ ...demo, role: "admin" }));
    for (const kind of ["dashboard", "orders", "products", "suppliers", "customers"]) {
      await page.goto(`/${kind}`);
      await expect(page.locator("tbody tr")).toHaveCount(5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      for (const button of await page.getByRole("button", { name: /^(Add|Edit|Delete)(\s|$)/ }).all())
        await expect(button).toBeDisabled();
      if (kind === "dashboard") {
        await page.getByRole("button", { name: /All products: 60/ }).click();
        await expect(page.getByRole("dialog").locator("strong")).toHaveText("0");
        await page.keyboard.press("Escape");
      }
      if (kind === "customers") {
        await page.getByRole("button", { name: "Customer 02", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Customer details" });
        await expect(dialog).toContainText("Product 01 × 3");
        await expect(dialog.getByRole("button", { name: "Edit", exact: true })).toBeDisabled();
        await dialog.getByRole("button", { name: "Close", exact: true }).click();
      }
    }
    expect(
      await page.evaluate(() => JSON.parse(sessionStorage.getItem("epharmacy.session")!).user.role),
    ).toBe("demo");
    expect(requests.filter((r) => r.method !== "GET")).toEqual([]);
  });
}

test("demo logs in normally, searches/sorts/paginates, navigates and logs out", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  const { requests } = await mockApi(page, { user: demo });
  await page.goto("/login");
  const password = randomUUID();
  await page.getByLabel("Email address", { exact: true }).fill(demo.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => sessionStorage.getItem("epharmacy.session"))).not.toContain(
    password,
  );
  await page.locator("aside").getByRole("link", { name: "Products", exact: true }).click();
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Product 06");
  await page.getByLabel("Search by name").fill("Product 1");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Product 10");
  await page.getByRole("button", { name: "Product Info", exact: true }).click();
  await expect
    .poll(() => requests.filter((r) => r.path === "/products").at(-1)?.query)
    .toMatchObject({ name: "Product 1", sortBy: "name", sortOrder: "asc" });
  await page.locator("aside").getByRole("link", { name: "Customers", exact: true }).click();
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Customer 06");
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem("epharmacy.session"))).toBeNull();
  expect(requests.filter((r) => r.method !== "GET").map((r) => r.path)).toEqual(["/user/login"]);
  expect(requests.find((r) => r.path === "/user/login")!.body).not.toHaveProperty("role");
});

test("an unconfigured role has no edit controls; role 403 is handled without clearing the session", async ({
  page,
}) => {
  const { requests } = await mockApi(page, { user: { ...demo, role: null } });
  await authenticate(page);
  await page.route("**/api/products?*", (route) =>
    route.fulfill({
      status: 403,
      json: {
        error: {
          code: "ROLE_NOT_CONFIGURED",
          message: "Business access is not configured for this account",
        },
      },
    }),
  );
  await page.goto("/products");
  await expect(page.getByRole("alert")).toContainText("Business access is not configured");
  await expect(page.getByRole("button", { name: "Add a new product", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => sessionStorage.getItem("epharmacy.session"))).not.toBeNull();
  expect(requests.filter((r) => r.method !== "GET")).toEqual([]);
});
