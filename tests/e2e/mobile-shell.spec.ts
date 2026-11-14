import { expect, test, type Locator } from "@playwright/test";
import { authenticate, mockApi } from "./mock-api";

// Frontend!A5 starts Desktop at 1440px; its geometry is covered in desktop.spec.ts.
const widths = [320, 340, 360, 375, 376, 390, 425, 500, 600, 767, 768, 1439];

async function expectCenteredDialog(dialog: Locator, shellX: number, shellWidth: number) {
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.width).toBe(shellWidth >= 768 ? 536 : Math.min(shellWidth - 40, 335));
  expect(box!.x).toBeCloseTo(shellX + (shellWidth - box!.width) / 2, 3);
}

for (const width of widths) {
  test(`responsive composition and overlays keep their approved dimensions at ${width}px`, async ({
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
    const tablet = width >= 768;
    const shellWidth = Math.min(width, tablet ? 768 : 375);
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
      await expect(main).toHaveCSS("padding-left", tablet ? "32px" : "20px");
      await expect(main).toHaveCSS("padding-right", tablet ? "32px" : "20px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (route === "login") {
        const email = await page.getByLabel("Email address", { exact: true }).boundingBox();
        expect(email!.x).toBe(shellX + (tablet ? 32 : 20));
        expect(email!.width).toBe(tablet ? 323 : shellWidth - 40);
        expect(email!.height).toBe(44);
        await expect(page.locator("h1")).toHaveCSS("font-size", tablet ? "54px" : "28px");
        const pill = await page.locator('img[src="/images/pill@2x.png"]').boundingBox();
        expect(pill!.width).toBe(tablet ? 179 : 95);
        expect(pill!.height).toBe(tablet ? 175 : 93);
        continue;
      }
      const header = await page.locator("header").boundingBox();
      expect(header).toMatchObject({ x: shellX, width: shellWidth, height: 80 });
      const logo = await page.locator("header img").boundingBox();
      expect(logo).toMatchObject(
        tablet
          ? { x: shellX + 80, y: 20, width: 40, height: 40 }
          : { x: shellX + 72, y: 24, width: 32, height: 32 },
      );
      await expect(page.locator("h1")).toHaveCSS("font-size", tablet ? "24px" : "20px");
      if (route === "dashboard") {
        const cards = page.locator('section[aria-label="Overview"] button');
        const card = await cards.first().boundingBox();
        // Fractional grid tracks are quantized by Chrome to 1/64 CSS px.
        expect(
          Math.abs(card!.width - (tablet ? 221 : ((shellWidth - 60) * 158) / 315)),
        ).toBeLessThanOrEqual(1 / 64);
        expect(card!.height).toBe(tablet ? 108 : 98);
        await cards.first().click();
        await expectCenteredDialog(page.getByRole("dialog"), shellX, shellWidth);
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Open menu" }).click();
        const menu = page.getByRole("dialog", { name: "Main menu" });
        expect(await menu.boundingBox()).toMatchObject({
          x: shellX,
          y: 0,
          width: tablet ? 84 : 78,
          height: 812,
        });
        expect(await menu.getByRole("button", { name: "Close menu" }).boundingBox()).toMatchObject({
          x: shellX + (tablet ? 38 : 32),
          y: 20,
          width: 32,
          height: 32,
        });
        expect(
          await menu.getByRole("link", { name: "Dashboard", exact: true }).boundingBox(),
        ).toMatchObject({
          x: shellX + 20,
          y: tablet ? 100 : 92,
          width: tablet ? 44 : 38,
          height: tablet ? 44 : 38,
        });
        await page.keyboard.press("Escape");
        await page.getByRole("link", { name: "Skip to content" }).focus();
        expect((await page.getByRole("link", { name: "Skip to content" }).boundingBox())!.x).toBe(
          shellX + (tablet ? 32 : 20),
        );
      } else {
        const search = await page.getByRole("search").boundingBox();
        expect(search).toMatchObject({
          x: shellX + (tablet ? 32 : 20),
          width: tablet ? 354 : shellWidth - 40,
          height: 44,
        });
        expect(
          (await page.getByRole("button", { name: "Filter", exact: true }).boundingBox())!.width,
        ).toBe(tablet ? 116 : 112);
        expect((await page.getByLabel("Search by name").boundingBox())!.width).toBe(
          tablet ? 224 : shellWidth - 160,
        );
        const tableViewport = page.getByLabel(
          `${route === "customers" ? "Customers Data" : `All ${route}`}, scroll horizontally to see all columns`,
          { exact: true },
        );
        expect((await tableViewport.boundingBox())!.width).toBe(shellWidth - (tablet ? 32 : 20));
        const panel = await page.locator("table").locator("..").boundingBox();
        expect(panel!.width).toBe(
          (tablet
            ? { orders: 960, products: 960, suppliers: 960, customers: 1082 }
            : { orders: 671, products: 511, suppliers: 678, customers: 770 })[route],
        );
        expect(panel!.height).toBe(tablet ? 502 : 460);
        const range = page.getByRole("slider");
        expect((await range.boundingBox())!.width).toBe(
          tablet ? (route === "orders" ? 704 : 688) : shellWidth - 40,
        );
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
