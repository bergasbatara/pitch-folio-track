import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTaxCodes } from "./useTaxCodes";

describe("useTaxCodes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a tax code optimistically and replaces it with the server result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "tax-1", name: "PPN", code: "PPN", rate: 11, description: "Pajak Pertambahan Nilai", createdAt: "2026-01-01T00:00:00.000Z" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTaxCodes("company-1"));
    await waitFor(() => expect(result.current.taxCodes).toHaveLength(0));

    await act(async () => {
      await result.current.addTaxCode({ name: "PPN", code: "PPN", rate: 11, description: "Pajak Pertambahan Nilai" });
    });

    expect(result.current.taxCodes[0].id).toBe("tax-1");
  });
});
