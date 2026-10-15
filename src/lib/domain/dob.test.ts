import { describe, expect, it } from "vitest";
import { formatDob } from "./dob";

describe("formatDob", () => {
  it("keeps Arabic dates in day/month/year written order", () => {
    expect(formatDob("1992-03-05", "ar")).toBe("05/03/1992");
  });

  it("uses dots for Russian and English", () => {
    expect(formatDob("1992-03-05", "ru")).toBe("05.03.1992");
    expect(formatDob("1992-03-05", "en")).toBe("05.03.1992");
  });
});
