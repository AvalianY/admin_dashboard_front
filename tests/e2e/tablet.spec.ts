import { expect, test, type Page } from "@playwright/test";
import { authenticate, mockApi } from "./mock-api";

async function expectSemanticMarkup(page: Page) {
  expect(await page.locator("button button,button a,a button,a a").count()).toBe(0);
  expect(await page.locator('a[href="#"],div[onclick],span[onclick]').count()).toBe(0);
  expect(
    await page
      .locator("table")
      .evaluateAll((tables) =>
        tables.every(
          (table) =>
            !!table.querySelector("thead") &&
            !!table.querySelector("tbody") &&
            [...table.querySelectorAll("th")].every((th) => th.scope === "col"),
        ),
      ),
  ).toBe(true);
  const duplicateIds = await page.locator("[id]").evaluateAll((nodes) => {
    const ids = nodes.map((node) => node.id);
    return ids.length - new Set(ids).size;
  });
  expect(duplicateIds).toBe(0);
  expect(
    await page
      .locator("input")
      .evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node instanceof HTMLInputElement &&
            (!!node.labels?.length ||
              !!node.getAttribute("aria-label") ||
              !!node.getAttribute("aria-labelledby")),
        ),
      ),
  ).toBe(true);
}

// 1439px is the last Tablet width; 1440px is validated by the Desktop suite.
for (const width of [768, 820, 1024, 1280, 1439]) {
  test(`bounded tablet geometry, tables and keyboard navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1024 });
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) problems.push(message.text());
    });
    const { requests } = await mockApi(page, { finance: true });
    await authenticate(page);
    const left = (width - 768) / 2;
    for (const kind of ["dashboard", "orders", "products", "suppliers", "customers"]) {
      await page.goto(`/${kind}`);
      await expect(page.locator("tbody tr")).toHaveCount(5);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.locator("#root > div").boundingBox()).toMatchObject({
        x: left,
        width: 768,
      });
      expect(await page.locator("h1").boundingBox()).toMatchObject({
        x: left + 152,
        y: 15,
        height: 28,
      });
      expect(await page.locator("header img").boundingBox()).toMatchObject({
        x: left + 80,
        y: 20,
        width: 40,
        height: 40,
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await expectSemanticMarkup(page);
      const panel = page.locator("table").locator("..");
      if (kind === "dashboard") {
        expect((await page.locator("thead").boundingBox())!.height).toBe(58);
        expect(await panel.boundingBox()).toMatchObject({
          x: left + 32,
          y: 248,
          width: 704,
          height: 512,
        });
        expect(
          await page.getByRole("region", { name: "Income/Expenses" }).boundingBox(),
        ).toMatchObject({ x: left + 32, y: 780, width: 704, height: 512 });
        const cards = page.locator('section[aria-label="Overview"] button');
        for (let index = 0; index < 3; index++) {
          const card = cards.nth(index);
          const box = await card.boundingBox();
          expect(Math.abs(box!.width - (index === 2 ? 222 : 221))).toBeLessThan(1 / 64 + 0.001);
          expect(box!.height).toBe(108);
          await card.click();
          const dialog = page.getByRole("dialog");
          await expect(dialog.locator("strong")).toHaveText("0");
          expect((await dialog.boundingBox())!.width).toBe(536);
          await page.keyboard.press("Escape");
          await expect(card).toBeFocused();
        }
      } else {
        expect(await panel.boundingBox()).toMatchObject({
          x: left + 32,
          y: 194,
          width: kind === "customers" ? 1082 : 960,
          height: 502,
        });
        expect(await page.getByRole("search").boundingBox()).toMatchObject({
          x: left + 32,
          y: 130,
          width: 354,
          height: 44,
        });
        expect(await page.getByLabel("Search by name").boundingBox()).toMatchObject({
          width: 224,
          height: 44,
        });
        await expect(page.locator("thead th").first()).toHaveCSS("font-size", "14px");
        await expect(page.locator("tbody td").first()).toHaveCSS("font-size", "16px");
        const firstRow = await page.locator("tbody tr").first().boundingBox();
        expect(firstRow!.height).toBe(76);
        const viewport = page.locator('div[tabindex="0"]').first();
        const range = page.getByRole("slider");
        expect(await range.boundingBox()).toMatchObject({
          x: left + (kind === "orders" ? 32 : 40),
          y: kind === "orders" ? 982 : 994,
          width: kind === "orders" ? 704 : 688,
          height: 10,
        });
        await range.focus();
        await page.keyboard.press("End");
        if (kind === "suppliers" || kind === "orders") {
          const status = page
            .locator("tbody td")
            .filter({
              hasText:
                /^(Active|Deactive|Pending|Processing|Completed|Cancelled|Confirmed|Shipped|Delivered)$/,
            })
            .first()
            .locator("span");
          await expect(status).toHaveCSS("font-size", "14px");
        }
        await expect
          .poll(() => viewport.evaluate((node) => node.scrollLeft))
          .toBe(await viewport.evaluate((node) => node.scrollWidth - node.clientWidth));
        await page.keyboard.press("Home");
        await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBe(0);
      }
      await page.getByRole("button", { name: "Open menu" }).click();
      const menu = page.getByRole("dialog", { name: "Main menu" });
      expect(await menu.boundingBox()).toMatchObject({ x: left, y: 0, width: 84, height: 1024 });
      expect(
        await menu.getByRole("link", { name: "Dashboard", exact: true }).boundingBox(),
      ).toMatchObject({ x: left + 20, y: 100, width: 44, height: 44 });
      const next = menu.getByRole("link", { name: "Products", exact: true });
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(menu).toHaveCount(0);
      await expect(page).toHaveURL(/\/products$/);
    }
    await page.evaluate(() => sessionStorage.clear());
    await page.goto("/login");
    expect(await page.locator("h1").boundingBox()).toMatchObject({
      x: left + 32,
      y: 272,
      width: 614,
      height: 240,
    });
    expect(await page.getByLabel("Email address", { exact: true }).boundingBox()).toMatchObject({
      x: left + 32,
      y: 562,
      width: 323,
      height: 44,
    });
    expect(
      await page.getByRole("button", { name: "Log in", exact: true }).boundingBox(),
    ).toMatchObject({ x: left + 32, y: 704, width: 323, height: 44 });
    const images = await page
      .locator("img")
      .evaluateAll((nodes) =>
        nodes.filter((node) => node instanceof HTMLImageElement).map((image) => image.currentSrc),
      );
    expect(images.some((url) => url.endsWith("pill-tablet@2x.png"))).toBe(true);
    expect(images.some((url) => url.endsWith("elements-tablet.png"))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expectSemanticMarkup(page);
    expect(requests.filter((request) => !["GET"].includes(request.method))).toEqual([]);
    expect(problems).toEqual([]);
  });
}

test("tablet forms match approved geometry, labels and native modal focus", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const { requests } = await mockApi(page);
  await authenticate(page);
  for (const [kind, add, edit, title] of [
    ["products", "Add a new product", "Edit Product 01", "Edit product"],
    ["suppliers", "Add a new suppliers", "Edit Supplier 1", "Edit supplier"],
    ["customers", "Add Customers", "Edit Customer 01", "Edit data"],
  ]) {
    await page.goto(`/${kind}`);
    for (const trigger of [add, edit]) {
      const button = page.getByRole("button", { name: trigger, exact: true });
      await button.click();
      const dialog = page.getByRole("dialog");
      expect(await dialog.boundingBox()).toMatchObject({ x: 116, y: 316, width: 536, height: 392 });
      await expect(dialog.getByRole("heading")).toHaveAccessibleName(
        trigger === edit ? title : add,
      );
      await expect(
        dialog.getByRole("button", { name: trigger === edit ? "Save" : "Add", exact: true }),
      ).toBeVisible();
      const fields = dialog.locator("input,[role=combobox]");
      for (const field of await fields.all()) {
        const box = await field.boundingBox();
        expect(box!.width).toBe(224);
        expect(box!.height).toBe(44);
        expect([156, 388]).toContain(box!.x);
        expect([424, 482, 540]).toContain(box!.y);
      }
      if (kind === "products") {
        const category = dialog.getByRole("combobox", { name: "Category" });
        await category.click();
        expect(await dialog.getByRole("listbox").boundingBox()).toMatchObject({
          x: 388,
          y: 476,
          width: 224,
          height: 140,
        });
        await page.keyboard.press("Escape");
        await expect(dialog).toBeVisible();
        await dialog.getByLabel("Product Info", { exact: true }).focus();
        await page.keyboard.press("Tab");
        await expect(dialog.getByRole("combobox", { name: "Category" })).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(dialog.getByLabel("Stock", { exact: true })).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(dialog.getByLabel("Suppliers", { exact: true })).toBeFocused();
        expect(await dialog.getByLabel("Stock", { exact: true }).boundingBox()).toMatchObject({
          x: 156,
          y: 482,
        });
        expect(await dialog.getByLabel("Suppliers", { exact: true }).boundingBox()).toMatchObject({
          x: 388,
          y: 482,
        });
      }
      expect(
        await dialog.getByRole("button", { name: "Cancel", exact: true }).boundingBox(),
      ).toMatchObject({ x: 297, y: 624, width: 133, height: 44 });
      await expectSemanticMarkup(page);
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        // Chrome may transfer focus to browser chrome (activeElement=body), never to inert app controls.
        expect(
          await dialog.evaluate(
            (element) =>
              document.activeElement === document.body || element.contains(document.activeElement),
          ),
        ).toBe(true);
      }
      // Header now also contains a hidden Desktop logout button; target the Tablet control.
      const menuTrigger = page.getByRole("button", { name: "Open menu", exact: true });
      await menuTrigger.evaluate((button) => button.focus());
      await expect(menuTrigger).not.toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(button).toBeFocused();
    }
  }
  expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
});

test("resizing an open product form preserves values and switches reading order with the layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const { requests } = await mockApi(page);
  await authenticate(page);
  await page.goto("/products");
  await page.getByRole("button", { name: "Edit Product 01", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Product Info", { exact: true }).fill("Unsubmitted changes");
  await dialog.getByLabel("Price", { exact: true }).fill("12.123456789");
  const labels = dialog.locator("label");
  await expect(labels).toHaveText(["Product Info", "Category", "Stock", "Suppliers", "Price"]);
  await page.setViewportSize({ width: 767, height: 1024 });
  await expect(dialog.getByRole("heading")).toHaveAccessibleName("Edit data");
  await expect(dialog).toHaveCSS("width", "335px");
  await expect(labels).toHaveText(["Product Info", "Category", "Suppliers", "Stock", "Price"]);
  await expect(dialog.getByLabel("Product Info", { exact: true })).toHaveValue(
    "Unsubmitted changes",
  );
  await expect(dialog.getByLabel("Price", { exact: true })).toHaveValue("12.123456789");
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(dialog.getByRole("heading")).toHaveAccessibleName("Edit product");
  await expect(dialog).toHaveCSS("width", "536px");
  await expect(labels).toHaveText(["Product Info", "Category", "Stock", "Suppliers", "Price"]);
  await expect(dialog.getByLabel("Price", { exact: true })).toHaveValue("12.123456789");
  await page.keyboard.press("Escape");
  expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
});
