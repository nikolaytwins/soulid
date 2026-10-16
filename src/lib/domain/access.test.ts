import { describe, expect, it } from "vitest";
import { entitlementIsReadable } from "./access-gate";

describe("paid reading gate", () => {
  const free = new Set(["personality"]);

  it("opens a free sphere only when the product is free", () => {
    expect(entitlementIsReadable({ sphere: "personality", source: "free", purchase: null }, free)).toBe(true);
    expect(entitlementIsReadable({ sphere: "spirituality", source: "free", purchase: null }, free)).toBe(false);
  });

  it("opens a paid sphere only after a confirmed payment", () => {
    expect(
      entitlementIsReadable(
        { sphere: "spirituality", source: "purchase", purchase: { status: "pending", paidAt: null } },
        free
      )
    ).toBe(false);
    expect(
      entitlementIsReadable(
        { sphere: "spirituality", source: "purchase", purchase: { status: "paid", paidAt: null } },
        free
      )
    ).toBe(false);
    expect(
      entitlementIsReadable(
        {
          sphere: "spirituality",
          source: "purchase",
          purchase: { status: "paid", paidAt: new Date("2026-10-15T12:00:00Z") }
        },
        free
      )
    ).toBe(true);
  });

  it("opens bundle spheres from a paid bundle purchase", () => {
    expect(
      entitlementIsReadable(
        {
          sphere: "health",
          source: "bundle",
          purchase: { status: "paid", paidAt: new Date("2026-10-15T12:00:00Z") }
        },
        new Set()
      )
    ).toBe(true);
  });

  it("allows admin grants and rejects unknown sources", () => {
    expect(entitlementIsReadable({ sphere: "money", source: "admin", purchase: null }, new Set())).toBe(true);
    expect(entitlementIsReadable({ sphere: "money", source: "hack", purchase: null }, new Set())).toBe(false);
  });
});
