import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePayables, useReceivables } from "./useReceivables";

describe("useReceivables / usePayables", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads receivables and computes outstanding totals", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "rec-1",
            customerName: "PT Sehat Makmur",
            description: "Invoice A",
            amount: 30000000,
            paidAmount: 5000000,
            dueDate: "2026-07-01",
            status: "partial",
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
          {
            id: "rec-2",
            customerName: "PT Sehat Makmur",
            description: "Invoice B",
            amount: 10000000,
            paidAmount: 10000000,
            dueDate: "2026-07-10",
            status: "paid",
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
        ],
      }),
    );

    const { result } = renderHook(() => useReceivables("company-1"));

    await waitFor(() => expect(result.current.receivables).toHaveLength(2));
    expect(result.current.getTotalReceivables()).toBe(25000000);
    expect(result.current.getPendingReceivables()).toHaveLength(1);
  });

  it("records a payable payment by sending the updated paid amount", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "pay-1",
            supplierName: "PT Farma Nusantara",
            description: "Hutang dagang",
            amount: 64935000,
            paidAmount: 1000000,
            dueDate: "2026-02-01",
            status: "partial",
            createdAt: "2026-01-03T00:00:00.000Z",
            updatedAt: "2026-01-03T00:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pay-1",
          supplierName: "PT Farma Nusantara",
          description: "Hutang dagang",
          amount: 64935000,
          paidAmount: 3500000,
          dueDate: "2026-02-01",
          status: "partial",
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePayables("company-1"));

    await waitFor(() => expect(result.current.payables).toHaveLength(1));

    await act(async () => {
      await result.current.recordPayment("pay-1", 2500000);
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/companies/company-1/payables/pay-1"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ paidAmount: 3500000 }),
      }),
    );
  });
});
