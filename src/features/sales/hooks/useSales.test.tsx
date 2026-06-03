import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSales } from "./useSales";

describe("useSales", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads sales and computes same-day revenue correctly", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-12T14:00:00.000Z"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "sale-1",
            productId: "product-1",
            productName: "Vitamin C",
            quantity: 250,
            pricePerUnit: 75000,
            totalPrice: 18750000,
            soldAt: "2026-01-12",
          },
          {
            id: "sale-2",
            productId: "product-2",
            productName: "Paracetamol",
            quantity: 10,
            pricePerUnit: 1000,
            totalPrice: 10000,
            soldAt: "2026-01-11",
          },
        ],
      }),
    );

    const { result } = renderHook(() => useSales("company-1"));

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.sales).toHaveLength(2);
    expect(result.current.totalRevenue).toBe(18760000);
    expect(result.current.todaysSales).toHaveLength(1);
    expect(result.current.todaysRevenue).toBe(18750000);

    vi.useRealTimers();
  });
});
