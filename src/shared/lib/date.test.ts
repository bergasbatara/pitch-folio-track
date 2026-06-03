import { describe, expect, it } from "vitest";
import { formatDateId, parseApiDateToLocalDate } from "./date";

describe("date helpers", () => {
  it("keeps yyyy-mm-dd values on the same calendar day", () => {
    expect(formatDateId("2026-01-12")).toContain("12");
  });

  it("parses ISO timestamps using the local calendar date", () => {
    const date = parseApiDateToLocalDate("2026-01-12T00:00:00.000Z");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(12);
  });
});
