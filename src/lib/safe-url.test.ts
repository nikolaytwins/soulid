import { describe, expect, it } from "vitest";
import { escapeHtml, safeNextPath, safeSameOriginUrl } from "./safe-url";

describe("safeNextPath", () => {
  it("allows in-app relative paths", () => {
    expect(safeNextPath("/ru/star/abc", "/ru/account")).toBe("/ru/star/abc");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("https://evil.test", "/ru/account")).toBe("/ru/account");
    expect(safeNextPath("//evil.test", "/ru/account")).toBe("/ru/account");
    expect(safeNextPath("/\\evil.test", "/ru/account")).toBe("/ru/account");
    expect(safeNextPath("javascript:alert(1)", "/ru/account")).toBe("/ru/account");
  });
});

describe("safeSameOriginUrl", () => {
  it("keeps same-origin returns", () => {
    expect(safeSameOriginUrl("http://localhost:3000/ru/star/1?paid=1", "http://localhost:3000")).toBe(
      "http://localhost:3000/ru/star/1?paid=1"
    );
  });

  it("rejects other origins", () => {
    expect(safeSameOriginUrl("https://evil.test/phish", "http://localhost:3000")).toBe("http://localhost:3000/");
  });
});

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<img src=x onerror=alert(1) foo="y">`)).toContain("&lt;img");
  });
});
