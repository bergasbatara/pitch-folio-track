import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePurchases } from "./usePurchases";

describe("usePurchases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes purchase dates and computes total spend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "purchase-1",
            date: "2026-01-03T00:00:00.000Z",
            categoryId: "cat-1",
            itemName: "Paracetamol 500mg",
            supplier: "PT Farma Nusantara",
            quantity: 2000,
            unitCost: 18000,
            totalCost: 36000000,
            notes: null,
            productId: "product-1",
            productCode: "OB001",
            createdAt: "2026-01-03T00:00:00.000Z",
          },
        ],
      }),
    );

    const { result } = renderHook(() => usePurchases("company-1"));

    await waitFor(() => expect(result.current.purchases).toHaveLength(1));
    expect(result.current.purchases[0].date).toBe("2026-01-03");
    expect(result.current.getTotalSpend()).toBe(36000000);
  });
});
