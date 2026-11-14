import { expect, test } from "@playwright/test";
import { authenticate, mockApi } from "./mock-api";

for (const width of [320, 340, 360, 375, 376, 390, 425, 500, 600, 767, 768, 1440])
  test(`all record forms remain usable at ${width}px and keyboard-height viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 440 });
    await mockApi(page);
    await authenticate(page);
    const shellWidth = Math.min(width, 375);
    for (const [kind, add, edit] of [
      ["products", "Add a new product", "Edit Product 01"],
      ["suppliers", "Add a new suppliers", "Edit Supplier 1"],
      ["customers", "Add Customers", "Edit Customer 01"],
    ]) {
      await page.goto(`/${kind}`);
      for (const trigger of [add, edit]) {
        await page.getByRole("button", { name: trigger, exact: true }).click();
        const dialog = page.getByRole("dialog");
        const box = await dialog.boundingBox();
        expect(box!.x).toBe((width - shellWidth) / 2 + 20);
        expect(box!.width).toBe(shellWidth - 40);
        expect(box!.height).toBeLessThanOrEqual(400);
        expect(await dialog.evaluate((element) => element.scrollWidth)).toBe(shellWidth - 40);
        for (const input of await dialog.locator("input,[role=combobox]").all()) {
          await input.scrollIntoViewIfNeeded();
          await expect(input).toBeVisible();
          const inputBox = await input.boundingBox();
          expect(inputBox!.height).toBe(44);
          expect(inputBox!.width).toBe(shellWidth - 80);
        }
        const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
        await cancel.scrollIntoViewIfNeeded();
        await cancel.focus();
        await expect(cancel).toBeFocused();
        await cancel.click();
        await expect(dialog).toHaveCount(0);
      }
    }
  });
