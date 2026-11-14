import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { authenticate, makeSession, mockApi, user } from "./mock-api";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (
      ["error", "warning"].includes(message.type()) &&
      !(
        message.location().url.includes("/api/") &&
        /^Failed to load resource: the server responded with a status of [45]\d\d/.test(
          message.text(),
        )
      )
    )
      throw new Error(message.text());
  });
});
for (const width of [320, 340, 360, 375])
  test(`all six mobile pages fit ${width}px; tables scroll locally`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 812 });
    await mockApi(page);
    await authenticate(page);
    for (const path of ["dashboard", "orders", "products", "suppliers", "customers"]) {
      const title = path === "customers" ? "Customers Data" : `All ${path}`;
      await page.goto(`/${path}`);
      await expect(
        page.getByRole("heading", { name: path === "dashboard" ? "Recent Customers" : title }),
      ).toBeVisible();
      await expect(page.getByRole("status", { name: "Loading…" })).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (path !== "dashboard") {
        const table = page.locator("table");
        await expect(table.locator("tbody tr")).toHaveCount(5);
        const scroll = page.getByLabel(`${title}, scroll horizontally to see all columns`, {
          exact: true,
        });
        const dimensions = await scroll.evaluate((element) => ({
          client: element.clientWidth,
          content: element.scrollWidth,
        }));
        expect(dimensions.client).toBe(width - 20);
        expect(dimensions.content).toBeGreaterThan(dimensions.client);
        await page.getByLabel(`Horizontal scroll for ${title}`, { exact: true }).focus();
        await page.keyboard.press("End");
        await expect
          .poll(() => scroll.evaluate((element) => element.scrollLeft))
          .toBe(dimensions.content - dimensions.client);
        await scroll.evaluate((element) => {
          element.scrollLeft = 0;
        });
      }
      if (width === 375)
        await page.screenshot({ path: info.outputPath(`${path}.png`), fullPage: true });
    }
    await page.evaluate(() => sessionStorage.clear());
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (width === 375)
      await page.screenshot({ path: info.outputPath("login.png"), fullPage: true });
  });
test("route protection, login validation, secure storage, restore and server logout", async ({
  page,
}) => {
  const { requests } = await mockApi(page);
  await page.goto("/products");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText("Email is required.", { exact: true })).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  const password = randomUUID();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => sessionStorage.getItem("epharmacy.session"))).not.toContain(
    password,
  );
  expect(await page.evaluate(() => Object.keys(localStorage))).toHaveLength(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Recent Customers" })).toBeVisible();
  expect(
    requests.filter((request) => request.path === "/user/user-info").length,
  ).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    requests.some((request) => request.method === "GET" && request.path === "/user/logout"),
  ).toBe(true);
  expect(await page.evaluate(() => sessionStorage.getItem("epharmacy.session"))).toBeNull();
});
test("401 invalidates a restored session, expired sessions never request protected data", async ({
  page,
}) => {
  await mockApi(page);
  await authenticate(page);
  await page.route("**/api/user/user-info", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: "UNAUTHORIZED", message: "Session expired" } },
    }),
  );
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem("epharmacy.session"))).toBeNull();
  const expired = { ...makeSession(), expiresAt: new Date(Date.now() - 1000).toISOString() };
  await page.evaluate(
    (value) => sessionStorage.setItem("epharmacy.session", JSON.stringify(value)),
    expired,
  );
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login$/);
});
test("navigation, compatibility aliases, menu Escape and focus return", async ({ page }, info) => {
  await mockApi(page);
  await authenticate(page);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/dashboard$/);
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Main menu" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("menu.png") });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/dasboard");
  await expect(page).toHaveURL(/\/dashboard$/);
});
test("Dashboard separates totals and last30Days, preserves unknown finance and actual period", async ({
  page,
}) => {
  await mockApi(page);
  await authenticate(page);
  await page.goto("/dashboard");
  const products = page.getByRole("button", { name: /All products: 60/ });
  await products.click();
  const dialog = page.getByRole("dialog", { name: "Last 30 days" });
  await expect(dialog.locator("strong")).toHaveText("0");
  await expect(dialog).toContainText("January 1, 2030 – January 30, 2030 (UTC)");
  await page.keyboard.press("Escape");
  await expect(products).toBeFocused();
  await page.getByRole("button", { name: /All Customers: 88/ }).click();
  await expect(page.getByRole("dialog").locator("strong")).toHaveText("0");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Income/Expenses" }).getByText("—", { exact: true }),
  ).toBeVisible();
});
test("supported server filtering/sorting precedes client pagination and resets page", async ({
  page,
}) => {
  const { requests } = await mockApi(page);
  await authenticate(page);
  await page.goto("/products");
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Product 06");
  expect(
    requests
      .filter((request) => request.path === "/products")
      .every((request) => !("page" in request.query)),
  ).toBe(true);
  await page.getByLabel("Search by name").fill("Product 1");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Product 10");
  await expect(page.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "Product Info", exact: true }).click();
  await expect
    .poll(() => requests.filter((request) => request.path === "/products").at(-1)?.query)
    .toMatchObject({ name: "Product 1", sortBy: "name", sortOrder: "asc" });
  await page.getByLabel("Search by name").fill("no matching record");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.getByText("No results found.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Pagination" })).toHaveCount(0);
});
test("product create/edit/delete work only against intercepted synthetic API", async ({
  page,
}, info) => {
  const { requests } = await mockApi(page);
  await authenticate(page);
  await page.goto("/products");
  const add = page.getByRole("button", { name: "Add a new product", exact: true });
  await add.click();
  const dialog = page.getByRole("dialog");
  const tablet = (page.viewportSize()?.width ?? 375) >= 768;
  await expect(dialog).toHaveCSS("width", tablet ? "536px" : "335px");
  await expect(dialog).toHaveCSS("height", tablet ? "392px" : "484px");
  await dialog.getByRole("heading").click();
  await page.screenshot({ path: info.outputPath("product-add.png") });
  await dialog.getByLabel("Product Info", { exact: true }).fill("Created Product");
  await dialog.getByRole("combobox", { name: "Category" }).click();
  await dialog.getByRole("option", { name: "Medicine", exact: true }).click();
  await dialog.getByLabel("Suppliers", { exact: true }).fill("Synthetic Company");
  await dialog.getByLabel("Stock", { exact: true }).fill("0");
  await dialog.getByLabel("Price", { exact: true }).fill("123.123456789");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    requests.find((request) => request.method === "POST" && request.path === "/products")?.body,
  ).toEqual({
    name: "Created Product",
    category: "Medicine",
    suppliers: "Synthetic Company",
    stock: 0,
    price: "123.123456789",
  });
  await page.getByRole("button", { name: "Edit Created Product", exact: true }).click();
  await dialog.getByRole("heading").click();
  await page.screenshot({ path: info.outputPath("product-edit.png") });
  await dialog.getByLabel("Stock", { exact: true }).fill("7");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(requests.some((request) => request.method === "PUT" && request.body?.stock === 7)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Delete Created Product", exact: true }).click();
  await expect(dialog).toContainText("Created Product");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((request) => request.method === "DELETE")).toHaveLength(0);
  await page.getByRole("button", { name: "Delete Created Product", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(requests.filter((request) => request.method === "DELETE")).toHaveLength(1);
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /All products: 60/ })).toBeVisible();
});
test("supplier forms, nullable EUR, viewport-specific edit label and native date", async ({
  page,
}, info) => {
  const { requests } = await mockApi(page);
  await authenticate(page);
  await page.goto("/suppliers");
  await page.getByRole("button", { name: "Add a new suppliers", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const tablet = (page.viewportSize()?.width ?? 375) >= 768;
  await expect(dialog).toHaveCSS("height", tablet ? "392px" : "542px");
  await dialog.getByRole("heading").click();
  await page.screenshot({ path: info.outputPath("supplier-add.png") });
  await dialog.getByLabel("Suppliers Info", { exact: true }).fill("New Supplier");
  await dialog.getByLabel("Address", { exact: true }).fill("New Street");
  await dialog.getByLabel("Company", { exact: true }).fill("New Co");
  await dialog.getByLabel("Delivery date", { exact: true }).fill("2030-02-01");
  await dialog.getByLabel("Ammount", { exact: true }).fill("5.25");
  await dialog.getByRole("combobox", { name: "Status" }).click();
  await dialog.getByRole("option", { name: "Active", exact: true }).click();
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    requests.find((request) => request.method === "POST" && request.path === "/suppliers")?.body,
  ).toMatchObject({ amount: "5.25", deliveryDate: "2030-02-01" });
  await page.getByRole("button", { name: "Edit Supplier 1", exact: true }).click();
  await dialog.getByRole("heading").click();
  await page.screenshot({ path: info.outputPath("supplier-edit.png") });
  await expect(dialog.getByLabel("Ammount", { exact: true })).toHaveValue("");
  await dialog.getByLabel("Company", { exact: true }).fill("Updated Company");
  await dialog.getByRole("button", { name: tablet ? "Save" : "Add", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(requests.find((request) => request.method === "PUT")?.body).toMatchObject({
    amount: null,
    company: "Updated Company",
  });
  expect(requests.find((request) => request.method === "PUT")?.body).not.toHaveProperty(
    "legacyMoney",
  );
});
test("Customers use server pages of five; create whitelist, details/history and minimal PATCH", async ({
  page,
}) => {
  const { requests } = await mockApi(page);
  await authenticate(page);
  await page.goto("/customers");
  await expect
    .poll(() => requests.find((request) => request.path === "/customers")?.query)
    .toEqual({ page: "1", limit: "5" });
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Customer 06");
  await page.getByRole("button", { name: "Add Customers", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Customer Info", { exact: true }).fill("New Customer");
  await dialog.getByLabel("Email address", { exact: true }).fill("new@example.test");
  await dialog.getByLabel("Address", { exact: true }).fill("Street");
  await dialog.getByLabel("Phone", { exact: true }).fill("local 12");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    requests.find((request) => request.method === "POST" && request.path === "/customers")?.body,
  ).toEqual({
    name: "New Customer",
    email: "new@example.test",
    address: "Street",
    phone: "local 12",
    country: null,
  });
  await expect(page.locator("tbody tr").first()).toContainText("New Customer");
  await page.getByRole("button", { name: "New Customer", exact: true }).click();
  await expect(dialog.locator("h3 + p")).toHaveText("—");
  await dialog.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByLabel("Phone", { exact: true }).fill("changed 13");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(requests.find((request) => request.method === "PATCH")?.body).toEqual({
    phone: "changed 13",
  });
  await page.getByRole("button", { name: "Customer 02", exact: true }).click();
  await expect(dialog).toContainText("Product 01 × 3");
  await page.keyboard.press("Escape");
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /All Customers: 89/ })).toBeVisible();
});
test("modal keyboard, reduced viewport, Escape/cancel and preserved legacy category", async ({
  page,
}) => {
  await mockApi(page);
  await authenticate(page);
  await page.setViewportSize({ width: 320, height: 440 });
  await page.goto("/products");
  await page.getByRole("button", { name: "Edit Product 02", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Product Info", { exact: true })).toBeFocused();
  const dimensions = await dialog.boundingBox();
  expect(dimensions!.width).toBe(280);
  expect(dimensions!.height).toBeLessThanOrEqual(400);
  const combo = dialog.getByRole("combobox", { name: "Category" });
  await combo.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(combo).toContainText("Heart");
  await combo.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit Product 02", exact: true })).toBeFocused();
});
test("loading, error retry, server field errors, 409 and duplicate-submit prevention", async ({
  page,
}) => {
  const { requests } = await mockApi(page);
  await authenticate(page);
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/products?*", async (route) => {
    await held;
    await route.fallback();
  });
  await page.goto("/products");
  await expect(
    page
      .getByRole("region", { name: "All products", exact: true })
      .getByRole("status", { name: "Loading…" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter", exact: true })).toBeDisabled();
  release!();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page.route("**/api/products?*", (route) =>
    route.fulfill({
      status: 500,
      json: { error: { code: "INTERNAL_ERROR", message: "The request could not be completed." } },
    }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("The request could not be completed.");
  await page.unroute("**/api/products?*");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page.getByRole("button", { name: "Edit Product 01", exact: true }).click();
  const dialog = page.getByRole("dialog");
  let writes = 0;
  await page.route("**/api/products/*", async (route) => {
    writes++;
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 400,
      json: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: [{ path: "price", message: "Amount is not exactly representable." }],
        },
      },
    });
  });
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
  await expect(dialog.getByText("Amount is not exactly representable.")).toBeVisible();
  expect(writes).toBe(1);
  await page.route("**/api/products/*", (route) =>
    route.fulfill({
      status: 409,
      json: { error: { code: "CONFLICT", message: "Record changed. Reload before saving." } },
    }),
  );
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Reload current data", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Reload current data", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    requests.filter((request) => ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)),
  ).toHaveLength(0);
});
