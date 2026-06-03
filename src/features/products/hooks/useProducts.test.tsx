import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProducts } from "./useProducts";

describe("useProducts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("trims product code and prepends created product", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "product-1",
          code: "OB001",
          name: "Paracetamol",
          type: "barang",
          unit: "box",
          buyPrice: 18000,
          price: 25000,
          stock: 2000,
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useProducts("company-1"));
    await waitFor(() => expect(result.current.products).toHaveLength(0));

    await act(async () => {
      await result.current.addProduct({
        code: "  OB001  ",
        name: "Paracetamol",
        type: "barang",
        unit: "box",
        buyPrice: 18000,
        price: 25000,
        stock: 2000,
      });
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/companies/company-1/products"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          code: "OB001",
          name: "Paracetamol",
          type: "barang",
          unit: "box",
          buyPrice: 18000,
          price: 25000,
          stock: 2000,
        }),
      }),
    );
    expect(result.current.products[0].code).toBe("OB001");
  });
});
