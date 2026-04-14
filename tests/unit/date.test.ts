import { describe, it, expect } from "vitest";
import { getWeekStart } from "@/server/lib/date";

describe("getWeekStart", () => {
  it("returns Monday for a Wednesday", () => {
    const wed = new Date("2025-01-08"); // Wednesday
    expect(getWeekStart(wed)).toBe("2025-01-06"); // Monday
  });

  it("returns the same Monday for Monday", () => {
    const mon = new Date("2025-01-06");
    expect(getWeekStart(mon)).toBe("2025-01-06");
  });

  it("returns Monday for Sunday", () => {
    const sun = new Date("2025-01-12"); // Sunday
    expect(getWeekStart(sun)).toBe("2025-01-06"); // previous Monday
  });

  it("handles month boundaries", () => {
    const wed = new Date("2025-02-05"); // Wednesday
    expect(getWeekStart(wed)).toBe("2025-02-03"); // Monday
  });

  it("handles year boundaries", () => {
    const thu = new Date("2025-01-02"); // Thursday
    expect(getWeekStart(thu)).toBe("2024-12-30"); // previous Monday
  });

  it("returns a valid YYYY-MM-DD string", () => {
    const result = getWeekStart(new Date());
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
