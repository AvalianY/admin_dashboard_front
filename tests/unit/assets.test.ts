import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "../../src/components/Icon";
import { icons, type IconName } from "../../src/components/icon-data";

describe("published SVG sprite contract", () => {
  const sprite = fs.readFileSync("public/icons.svg", "utf8");
  const ids = [...sprite.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  it("has unique IDs and no broken internal references", () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of sprite.matchAll(/(?:url\(#|href="#)([^)"\s]+)/g))
      expect(ids).toContain(match[1]);
    expect(sprite).not.toMatch(/<script|\bon\w+=|https?:\/\/(?!www\.w3\.org)/);
  });
  it("renders every public Icon reference to a real symbol and retains native dimensions", () => {
    for (const name of Object.keys(icons) as IconName[]) {
      const markup = renderToStaticMarkup(Icon({ name, size: 24 }));
      expect(markup).toContain(`href="/icons.svg#icon-${name}"`);
      expect(ids).toContain(`icon-${name}`);
      expect(markup).toContain(`width="${icons[name].width}"`);
      expect(markup).toContain(`height="${icons[name].height}"`);
      expect(sprite).toContain(`<symbol id="icon-${name}" viewBox="${icons[name].viewBox}"`);
    }
  });
});
