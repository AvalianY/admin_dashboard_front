import { expect, test } from "@playwright/test";
import { authenticate, makeProducts, mockApi } from "./mock-api";

const information =
  /Some historical data|Unconfirmed values|unknown or unconfirmed|No confirmed operation dates|available records do not confirm|History cannot be confirmed|No confirmed operations|No operations for today/i;

for (const width of [320, 340, 360, 375, 390, 425]) {
  test(`Dashboard and dialogs show approved values without historical captions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) problems.push(message.text());
    });
    const { requests } = await mockApi(page);
    // Partial metadata must not bring back the former Products footnote either.
    await page.route("**/api/products?*", (route) =>
      route.fulfill({
        json: {
          data: { items: makeProducts(), categories: ["Medicine"] },
          meta: { completeness: "partial", missingData: ["products.createdAt"] },
        },
      }),
    );
    await authenticate(page);
    const response = page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/api/dashboard" && r.status() === 200,
    );
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: /All products: 60/ })).toBeVisible();
    const wire = await (await response).json();
    expect(wire.data.last30Days).toEqual({ products: null, suppliers: null, customers: 0 });
    expect(wire.meta.completeness).toBe("partial");
    await expect(page.locator('section[aria-label="Overview"] strong')).toHaveText([
      "60",
      "5",
      "88",
    ]);
    await expect(page.getByText(information)).toHaveCount(0);
    const finance = page.getByRole("region", { name: "Income/Expenses" });
    await expect(finance.getByText("—", { exact: true })).toHaveCount(1);
    await expect(finance.locator("li")).toHaveCount(0);
    const readCount = requests.filter((r) => r.path === "/dashboard").length;
    for (const name of [/All products: 60/, /All suppliers: 5/, /All Customers: 88/]) {
      const trigger = page.getByRole("button", { name });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Last 30 days" });
      await expect(dialog.locator("strong")).toHaveText("0");
      await expect(dialog.getByText(information)).toHaveCount(0);
      await expect(dialog.locator("p")).toHaveCount(1);
      await expect(dialog.locator("p")).toHaveText("January 1, 2030 – January 30, 2030 (UTC)");
      await expect(dialog.locator("p:empty,div:empty")).toHaveCount(0);
      const box = await dialog.boundingBox();
      expect(box!.width).toBe(Math.min(width, 375) - 40);
      expect(box!.x).toBe((width - box!.width) / 2);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    expect(requests.filter((r) => r.path === "/dashboard").length).toBe(readCount);
    for (const route of ["orders", "products", "suppliers", "customers"]) {
      await page.goto(`/${route}`);
      await expect(page.locator("tbody tr")).toHaveCount(5);
      await expect(page.getByText(information)).toHaveCount(0);
      expect((await page.locator("#root > div").boundingBox())!.width).toBe(Math.min(width, 375));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (width === 375) {
        const triggers =
          route === "products"
            ? ["Add a new product", "Edit Product 01", "Delete Product 01"]
            : route === "suppliers"
              ? ["Add a new suppliers", "Edit Supplier 1"]
              : route === "customers"
                ? ["Add Customers", "Edit Customer 01", "Customer 01"]
                : [];
        for (const name of triggers) {
          await page.getByRole("button", { name, exact: true }).click();
          await expect(page.getByRole("dialog").getByText(information)).toHaveCount(0);
          await page.keyboard.press("Escape");
        }
      }
    }
    await page.evaluate(() => sessionStorage.clear());
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
    await expect(page.getByText(information)).toHaveCount(0);
    expect(problems).toEqual([]);
  });
}

test("actual nonzero statistics and confirmed financial records are preserved", async ({
  page,
}) => {
  await mockApi(page, {
    finance: true,
    dashboard: { last30Days: { products: 7, suppliers: 2, customers: 9 } },
  });
  await authenticate(page);
  await page.goto("/dashboard");
  for (const [name, value] of [
    ["All products", "7"],
    ["All suppliers", "2"],
    ["All Customers", "9"],
  ]) {
    await page.getByRole("button", { name: new RegExp(name + ":") }).click();
    await expect(page.getByRole("dialog").locator("strong")).toHaveText(value);
    await page.keyboard.press("Escape");
  }
  await expect(page.getByRole("region", { name: "Income/Expenses" }).locator("li")).toHaveCount(6);
  await expect(page.getByText(information)).toHaveCount(0);
});

test("unknown Customers stays unknown; absent financial records have no explanatory copy", async ({
  page,
}) => {
  await mockApi(page, {
    dashboard: {
      last30Days: { products: null, suppliers: null, customers: null },
      incomeExpensesToday: [],
    },
  });
  await authenticate(page);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /All Customers: 88/ }).click();
  await expect(page.getByRole("dialog").locator("strong")).toHaveText("—");
  await expect(page.getByRole("dialog").getByText(information)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Income/Expenses" }).getByText("—", { exact: true }),
  ).toHaveCount(1);
});
