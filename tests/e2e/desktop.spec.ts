import { expect, test, type Page } from "@playwright/test";
import { authenticate, mockApi } from "./mock-api";

async function semantics(page: Page) {
  expect(
    await page
      .locator("button button,button a,a button,a a,div[onclick],span[onclick],a[href='#']")
      .count(),
  ).toBe(0);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  expect(
    await page
      .locator("[id]")
      .evaluateAll((nodes) => new Set(nodes.map((n) => n.id)).size === nodes.length),
  ).toBe(true);
  expect(
    await page
      .locator("table")
      .evaluateAll((tables) =>
        tables.every(
          (t) =>
            t.querySelector("thead") &&
            t.querySelector("tbody") &&
            [...t.querySelectorAll("th")].every((th) => th.scope === "col"),
        ),
      ),
  ).toBe(true);
  expect(
    await page
      .locator("input")
      .evaluateAll((nodes) =>
        nodes.every(
          (n) =>
            n instanceof HTMLInputElement &&
            (!!n.labels?.length ||
              !!n.getAttribute("aria-label") ||
              !!n.getAttribute("aria-labelledby")),
        ),
      ),
  ).toBe(true);
}

const columns: Record<string, number[]> = {
  orders: [285, 218, 191, 232, 184, 170],
  products: [296, 230, 199, 226, 163, 166],
  suppliers: [211, 188, 166, 215, 162, 189, 149],
  customers: [280, 299, 213, 263, 225],
};

for (const width of [1440, 1441, 1536, 1600, 1920]) {
  test(`Desktop source geometry, bounded shell and all columns at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(e.message));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) problems.push(m.text());
    });
    const { requests } = await mockApi(page, { finance: true });
    await authenticate(page);
    const left = (width - 1440) / 2;
    for (const kind of ["dashboard", "orders", "products", "suppliers", "customers"]) {
      await page.goto(`/${kind}`);
      await expect(page.locator("tbody tr")).toHaveCount(5);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.locator("#root > div").boundingBox()).toMatchObject({
        x: left,
        width: 1440,
      });
      expect(await page.locator("h1").boundingBox()).toMatchObject({
        x: left + 120,
        y: 15,
        height: 28,
      });
      expect(await page.locator("header img").boundingBox()).toMatchObject({
        x: left + 20,
        y: 18,
        width: 40,
        height: 40,
      });
      expect(await page.locator("aside").boundingBox()).toMatchObject({
        x: left,
        y: 80,
        width: 80,
        height: 720,
      });
      await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
      expect(await page.getByRole("button", { name: "Log out" }).boundingBox()).toMatchObject({
        x: left + 1356,
        y: 18,
        width: 44,
        height: 44,
      });
      const links = page.locator("aside nav a");
      for (let i = 0; i < 5; i++)
        expect(await links.nth(i).boundingBox()).toMatchObject({
          x: left + 18,
          y: 119 + i * 58,
          width: 44,
          height: 44,
        });
      await expect(page.locator("aside a[aria-current=page]")).toHaveAttribute("href", `/${kind}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await semantics(page);
      const panel = page.locator("table").locator("..");
      if (kind === "dashboard") {
        expect(await panel.boundingBox()).toMatchObject({
          x: left + 120,
          y: 248,
          width: 630,
          height: 512,
        });
        expect(
          await page.getByRole("region", { name: "Income/Expenses" }).boundingBox(),
        ).toMatchObject({ x: left + 770, y: 248, width: 630, height: 512 });
        expect(
          await page
            .getByRole("region", { name: "Income/Expenses" })
            .locator("p")
            .first()
            .boundingBox(),
        ).toMatchObject({ y: 312, height: 58 });
        const cards = page.locator('section[aria-label="Overview"] button');
        for (let i = 0; i < 3; i++) {
          expect(await cards.nth(i).boundingBox()).toMatchObject({
            x: left + 120 + 260 * i,
            y: 100,
            width: 240,
            height: 108,
          });
          await cards.nth(i).click();
          const dialog = page.getByRole("dialog", { name: "Last 30 days" });
          await expect(dialog.locator("strong")).toHaveText("0");
          expect((await dialog.boundingBox())!.width).toBe(536);
          await expect(dialog).not.toContainText(/historical|unconfirmed|confirm this value/i);
          await page.keyboard.press("Escape");
          await expect(cards.nth(i)).toBeFocused();
        }
      } else {
        expect(await panel.boundingBox()).toMatchObject({
          x: left + 120,
          y: 219,
          width: 1280,
          height: 502,
        });
        expect(await page.getByRole("search").boundingBox()).toMatchObject({
          x: left + 120,
          y: 155,
          width: 354,
          height: 44,
        });
        await expect(page.getByRole("slider")).toBeHidden();
        if (kind === "products") {
          expect(
            await page
              .getByRole("button", { name: "Add a new product", exact: true })
              .boundingBox(),
          ).toMatchObject({ x: left + 1223, y: 157, width: 177, height: 42 });
          expect(
            await page
              .getByRole("button", { name: "Add a new product", exact: true })
              .locator(":scope > span")
              .boundingBox(),
          ).toMatchObject({ x: left + 1223, y: 157, width: 42, height: 42 });
        }
        const viewport = page.locator('div[tabindex="0"]').first();
        expect(await viewport.evaluate((n) => n.scrollWidth - n.clientWidth)).toBe(0);
        const actual = await page
          .locator("col")
          .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().width));
        actual.forEach((value, i) =>
          expect(Math.abs(value - columns[kind][i])).toBeLessThanOrEqual(1 / 64),
        );
        expect((await page.locator("tbody tr").first().boundingBox())!.height).toBe(76);
        await expect(page.locator("tbody td").first()).toHaveCSS("font-size", "16px");
        if (kind === "suppliers") {
          await expect(page.locator("tbody tr").first().locator("td").nth(4)).toHaveText(
            "1,250.50",
          );
          await expect(page.locator("tbody tr").nth(1).locator("td").nth(4)).toHaveText("100.00");
        }
        await expect(page.locator("main")).not.toContainText(/historical|unconfirmed|Legacy:/i);
        if (kind === "customers") {
          await expect(page.locator("thead th")).toHaveCount(5);
          const cell = page.locator("tbody tr").first().locator("td").first();
          await expect(
            cell.getByRole("button", { name: "Edit Customer 01", exact: true }),
          ).toBeVisible();
          await cell.getByRole("button", { name: "Customer 01", exact: true }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.keyboard.press("Escape");
        }
      }
      const next = page.locator("aside").getByRole("link", { name: "Products", exact: true });
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/products$/);
    }
    await page.evaluate(() => sessionStorage.clear());
    await page.goto("/login");
    expect(await page.locator("h1").boundingBox()).toMatchObject({
      x: left + 100,
      y: 298,
      width: 614,
      height: 240,
    });
    expect(await page.getByLabel("Email address", { exact: true }).boundingBox()).toMatchObject({
      x: left + 864,
      y: 307,
      width: 323,
      height: 44,
    });
    expect(await page.getByLabel("Password", { exact: true }).boundingBox()).toMatchObject({
      x: left + 864,
      y: 365,
      width: 323,
      height: 44,
    });
    expect(
      await page.getByRole("button", { name: "Log in", exact: true }).boundingBox(),
    ).toMatchObject({ x: left + 864, y: 449, width: 323, height: 44 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await semantics(page);
    expect(requests.filter((r) => r.method !== "GET")).toEqual([]);
    expect(problems).toEqual([]);
  });
}

test("Desktop forms reproduce the four source frames and retain keyboard/modal semantics", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  const { requests } = await mockApi(page);
  await authenticate(page);
  for (const [kind, add, edit] of [
    ["products", "Add a new product", "Edit Product 01"],
    ["suppliers", "Add a new suppliers", "Edit Supplier 1"],
    ["customers", "Add Customers", "Edit Customer 01"],
  ]) {
    await page.goto(`/${kind}`);
    for (const trigger of [add, edit]) {
      const opener = page.getByRole("button", { name: trigger, exact: true });
      await opener.click();
      const dialog = page.getByRole("dialog");
      const height = kind === "products" && trigger === add ? 412 : 392;
      const y = (800 - height) / 2 + (kind === "suppliers" ? 4 : 0);
      expect(await dialog.boundingBox()).toMatchObject({ x: 452, y, width: 536, height });
      for (const field of await dialog.locator("input,[role=combobox]").all()) {
        const b = (await field.boundingBox())!;
        expect(b.width).toBe(224);
        expect(b.height).toBe(44);
        expect([492, 724]).toContain(b.x);
        expect([y + 108, y + 166, y + 224]).toContain(b.y);
      }
      expect(
        await dialog.getByRole("button", { name: "Cancel", exact: true }).boundingBox(),
      ).toMatchObject({ x: 633, y: y + 308, width: 133, height: 44 });
      if (kind === "products") {
        await dialog.getByRole("combobox", { name: "Category" }).click();
        expect(await dialog.getByRole("listbox").boundingBox()).toMatchObject({
          x: 724,
          y: y + 160,
          width: 224,
          height: 140,
        });
        await page.keyboard.press("Escape");
        await expect(dialog).toBeVisible();
      }
      await semantics(page);
      await page.getByRole("button", { name: "Log out" }).evaluate((e) => e.focus());
      await expect(page.getByRole("button", { name: "Log out" })).not.toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  }
  expect(requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("1439/1440 switch closes the menu and preserves an unsubmitted form", async ({ page }) => {
  await page.setViewportSize({ width: 1439, height: 1024 });
  const { requests } = await mockApi(page);
  await authenticate(page);
  await page.goto("/products");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.setViewportSize({ width: 1440, height: 800 });
  await expect(page.getByRole("dialog", { name: "Main menu" })).toHaveCount(0);
  await expect(page.locator("aside")).toBeVisible();
  await page.getByRole("button", { name: "Edit Product 01", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Product Info", { exact: true }).fill("Unsubmitted Desktop changes");
  await page.setViewportSize({ width: 1439, height: 1024 });
  await expect(page.locator("aside")).toBeHidden();
  await expect(dialog.getByLabel("Product Info", { exact: true })).toHaveValue(
    "Unsubmitted Desktop changes",
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(dialog.getByLabel("Product Info", { exact: true })).toHaveValue(
    "Unsubmitted Desktop changes",
  );
  expect((await dialog.boundingBox())!.x).toBe(692);
  await page.keyboard.press("Escape");
  expect(requests.filter((r) => r.method !== "GET")).toEqual([]);
});
