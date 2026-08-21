import { describe, expect, it } from "vitest";
import { STATIC_PAGE_PATHS, staticPageFromPath } from "../../utils/publicRoutes";

describe("landing page routes", () => {
  it.each(Object.entries(STATIC_PAGE_PATHS))(
    "maps %s to %s",
    (page, path) => {
      expect(staticPageFromPath(path)).toBe(page);
      expect(staticPageFromPath(`${path}/`)).toBe(page);
    },
  );

  it.each([
    ["/help", "help-center"],
    ["/contact-us", "contact"],
    ["/privacy-policy", "privacy-policy"],
    ["/terms-of-service", "terms-of-service"],
    ["/cookie-policy", "cookie-policy"],
  ])("supports the %s alias", (path, page) => {
    expect(staticPageFromPath(path)).toBe(page);
  });

  it("does not treat app routes as public landing pages", () => {
    expect(staticPageFromPath("/admin")).toBeNull();
    expect(staticPageFromPath("/reset-password")).toBeNull();
    expect(staticPageFromPath("/")).toBeNull();
  });
});
