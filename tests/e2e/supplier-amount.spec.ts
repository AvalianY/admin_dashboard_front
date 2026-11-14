import { expect, test } from "@playwright/test";
import { authenticate, mockApi } from "./mock-api";
import type { Supplier } from "../../src/types/api";

function amountCases(suppliers: Supplier[]) {
  Object.assign(suppliers[0], {
    amount: "1200.50",
    legacyMoney: { amount: "6952.53", currency: "BDT" },
  });
  Object.assign(suppliers[1], {
    amount: null,
    legacyMoney: { amount: "6952.53", currency: "BDT" },
  });
  Object.assign(suppliers[2], { amount: null, legacyMoney: null });
  Object.assign(suppliers[3], { amount: "0", legacyMoney: { amount: "6952.53", currency: "BDT" } });
  Object.assign(suppliers[4], { amount: null, legacyMoney: { amount: "0", currency: "BDT" } });
}
const footnote = /Some historical data|unknown or unconfirmed values|Unconfirmed values are shown/i;

for (const width of [320, 340, 360, 375, 390, 425]) {
  test(`supplier amounts stay numeric on one line and list footnotes are absent at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) problems.push(message.text());
    });
    const { suppliers } = await mockApi(page);
    amountCases(suppliers);
    const original = JSON.stringify(suppliers);
    await authenticate(page);
    await page.goto("/suppliers");
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(5);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole("slider").focus();
    await page.keyboard.press("End");
    const expected = ["1,200.50", "6,952.53", "—", "0", "0"];
    for (let index = 0; index < expected.length; index++) {
      const row = rows.nth(index);
      const amount = row.locator("td").nth(4);
      await expect(amount).toHaveText(expected[index]);
      await expect(amount).not.toContainText(/EUR|BDT|Legacy|[€$৳]/i);
      await expect(amount.locator("small,br")).toHaveCount(0);
      const text = amount.locator("span");
      await expect(text).toHaveCSS("white-space", "nowrap");
      await expect(text).toHaveCSS("font-size", "12px");
      await expect(text).toHaveCSS("font-weight", "500");
      await expect(text).toHaveCSS("line-height", "14px");
      await expect(amount).toHaveCSS("text-align", "left");
      const geometry = await amount.evaluate((cell) => {
        const span = cell.querySelector("span")!;
        const range = document.createRange();
        range.selectNodeContents(span);
        const style = getComputedStyle(cell);
        return {
          width: cell.getBoundingClientRect().width,
          textWidth: range.getBoundingClientRect().width,
          availableWidth:
            cell.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
          lines: range.getClientRects().length,
        };
      });
      expect(geometry.width).toBe(88);
      expect(geometry.textWidth).toBeLessThanOrEqual(geometry.availableWidth);
      expect(geometry.lines).toBe(1);
      expect((await row.boundingBox())!.height).toBe(74);
    }
    expect(JSON.stringify(suppliers)).toBe(original);
    for (const route of ["suppliers", "orders", "customers"]) {
      await page.goto(`/${route}`);
      await expect(page.locator("tbody tr")).toHaveCount(5);
      await expect(page.getByText(footnote)).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const shell = await page.locator("#root > div").boundingBox();
      expect(shell!.width).toBe(Math.min(width, 375));
      const panel = await page.locator("table").locator("..").boundingBox();
      expect(panel!.y).toBe(route === "orders" ? 184 : 244);
      expect(panel!.height).toBe(460);
      if (route !== "suppliers") {
        expect((await page.getByRole("navigation", { name: "Pagination" }).boundingBox())!.y).toBe(
          route === "orders" ? 664 : 724,
        );
      }
      expect((await page.getByRole("slider").boundingBox())!.y).toBe(784);
    }
    await page.getByRole("button", { name: "Customer 01", exact: true }).click();
    await expect(page.getByRole("dialog").getByText(footnote)).toHaveCount(0);
    await expect(page.getByRole("dialog").locator("h3 + p")).toHaveText("—");
    await page.keyboard.press("Escape");
    await page.goto("/dashboard");
    await expect(page.getByText(footnote)).toHaveCount(0);
    expect(problems).toEqual([]);
  });
}

test("displaying BDT never fills the EUR edit field or changes nullable PUT semantics", async ({
  page,
}) => {
  const { suppliers, requests } = await mockApi(page);
  amountCases(suppliers);
  await authenticate(page);
  await page.goto("/suppliers");
  await page.getByRole("button", { name: "Edit Supplier 2", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Ammount", { exact: true })).toHaveValue("");
  await dialog.getByLabel("Company", { exact: true }).fill("Updated synthetic company");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const write = requests.find((request) => request.method === "PUT");
  expect(write?.body).toMatchObject({ amount: null, company: "Updated synthetic company" });
  expect(write?.body).not.toHaveProperty("legacyMoney");
  expect(suppliers[1].legacyMoney).toEqual({ amount: "6952.53", currency: "BDT" });
});
