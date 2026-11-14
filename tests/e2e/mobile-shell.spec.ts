import { expect, test, type Locator } from "@playwright/test";
import { authenticate, mockApi } from "./mock-api";

const widths = [320, 340, 360, 375, 376, 390, 425, 500, 600, 767, 768, 1440];

async function expectCenteredDialog(dialog: Locator, shellX: number, shellWidth: number) {
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.width).toBe(Math.min(shellWidth - 40, 335));
  expect(box!.x).toBeCloseTo(shellX + (shellWidth - box!.width) / 2, 3);
}

for (const width of widths) {
  test(`mobile composition and overlays keep their approved dimensions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    const consoleProblems: string[] = [];
    page.on("pageerror", (error) => consoleProblems.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) consoleProblems.push(message.text());
    });
    await mockApi(page);
    await authenticate(page);
    const shellWidth = Math.min(width, 375);
    const shellX = (width - shellWidth) / 2;
    for (const route of ["dashboard", "orders", "products", "suppliers", "customers", "login"]) {
      if (route === "login") await page.evaluate(() => sessionStorage.clear());
      await page.goto(`/${route}`);
      if (route !== "login") await expect(page.locator("tbody tr")).toHaveCount(5);
      await page.evaluate(() => document.fonts.ready);
      const shell = page.locator("#root > div");
      await expect(shell).toHaveCount(1);
      const box = await shell.boundingBox();
      expect(box!.width).toBe(shellWidth);
      expect(box!.x).toBe(shellX);
      const main = page.locator("main");
      const mainBox = await main.boundingBox();
      expect(mainBox!.width).toBe(shellWidth);
      expect(mainBox!.x).toBe(shellX);
      await expect(main).toHaveCSS("padding-left", "20px");
      await expect(main).toHaveCSS("padding-right", "20px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (route === "login") {
        const email = await page.getByLabel("Email address", { exact: true }).boundingBox();
        expect(email!.x).toBe(shellX + 20);
        expect(email!.width).toBe(shellWidth - 40);
        expect(email!.height).toBe(44);
        await expect(page.locator("h1")).toHaveCSS("font-size", "28px");
        const pill = await page.locator('img[src="/images/pill@2x.png"]').boundingBox();
        expect(pill!.width).toBe(95);
        expect(pill!.height).toBe(93);
        continue;
      }
      const header = await page.locator("header").boundingBox();
      expect(header).toMatchObject({ x: shellX, width: shellWidth, height: 80 });
      const logo = await page.locator("header img").boundingBox();
      expect(logo).toMatchObject({ x: shellX + 72, y: 24, width: 32, height: 32 });
      await expect(page.locator("h1")).toHaveCSS("font-size", "20px");
      if (route === "dashboard") {
        const cards = page.locator('section[aria-label="Overview"] button');
        const card = await cards.first().boundingBox();
        // Fractional grid tracks are quantized by Chrome to 1/64 CSS px.
        expect(Math.abs(card!.width - ((shellWidth - 60) * 158) / 315)).toBeLessThanOrEqual(1 / 64);
        expect(card!.height).toBe(98);
        await cards.first().click();
        await expectCenteredDialog(page.getByRole("dialog"), shellX, shellWidth);
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Open menu" }).click();
        const menu = page.getByRole("dialog", { name: "Main menu" });
        expect(await menu.boundingBox()).toMatchObject({ x: shellX, y: 0, width: 78, height: 812 });
        expect(await menu.getByRole("button", { name: "Close menu" }).boundingBox()).toMatchObject({
          x: shellX + 32,
          y: 20,
          width: 32,
          height: 32,
        });
        expect(
          await menu.getByRole("link", { name: "Dashboard", exact: true }).boundingBox(),
        ).toMatchObject({ x: shellX + 20, y: 92, width: 38, height: 38 });
        await page.keyboard.press("Escape");
        await page.getByRole("link", { name: "Skip to content" }).focus();
        expect((await page.getByRole("link", { name: "Skip to content" }).boundingBox())!.x).toBe(
          shellX + 20,
        );
      } else {
        const search = await page.getByRole("search").boundingBox();
        expect(search).toMatchObject({ x: shellX + 20, width: shellWidth - 40, height: 44 });
        expect(
          (await page.getByRole("button", { name: "Filter", exact: true }).boundingBox())!.width,
        ).toBe(112);
        expect((await page.getByLabel("Search by name").boundingBox())!.width).toBe(
          shellWidth - 160,
        );
        const tableViewport = page.getByLabel(
          `${route === "customers" ? "Customers Data" : `All ${route}`}, scroll horizontally to see all columns`,
          { exact: true },
        );
        expect((await tableViewport.boundingBox())!.width).toBe(shellWidth - 20);
        const panel = await page.locator("table").locator("..").boundingBox();
        expect(panel!.width).toBe(
          { orders: 671, products: 511, suppliers: 678, customers: 770 }[route],
        );
        expect(panel!.height).toBe(460);
        const range = page.getByRole("slider");
        expect((await range.boundingBox())!.width).toBe(shellWidth - 40);
        await range.focus();
        await page.keyboard.press("End");
        await expect
          .poll(() => tableViewport.evaluate((e) => e.scrollLeft))
          .toBe(await tableViewport.evaluate((e) => e.scrollWidth - e.clientWidth));
        if (route === "customers") {
          await page.getByRole("button", { name: "Customer 01", exact: true }).click();
          await expectCenteredDialog(page.getByRole("dialog"), shellX, shellWidth);
          await page.keyboard.press("Escape");
        }
      }
    }
    expect(consoleProblems).toEqual([]);
  });
}

test("fixed navigation follows the centered shell when a desktop scrollbar reserves space", async ({
  page,
}) => {
  await page.setViewportSize({ width: 767, height: 812 });
  await mockApi(page);
  await authenticate(page);
  await page.goto("/dashboard");
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page.evaluate(() => {
    document.documentElement.style.scrollbarGutter = "stable";
  });
  const shell = await page.locator("#root > div").boundingBox();
  await page.getByRole("button", { name: "Open menu" }).click();
  expect((await page.getByRole("dialog", { name: "Main menu" }).boundingBox())!.x).toBe(shell!.x);
});
