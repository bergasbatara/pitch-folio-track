import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOpeningBalanceItems } from "./useOpeningBalanceItems";

describe("useOpeningBalanceItems", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads opening balance items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "item-1",
            companyId: "company-1",
            kind: "liability",
            accountId: "acc-1",
            asOfDate: "2026-04-28",
            amount: 90000000,
            memo: "Utang Usaha",
            journalEntryId: "entry-1",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T00:00:00.000Z",
            account: { id: "acc-1", code: "2001", name: "Hutang Usaha", type: "liability" },
          },
        ],
      }),
    );

    const { result } = renderHook(() => useOpeningBalanceItems("company-1"));

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].memo).toBe("Utang Usaha");
  });

  it("prepends a newly added opening balance item", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "item-2",
          companyId: "company-1",
          kind: "equity",
          accountId: "acc-2",
          asOfDate: "2026-04-28",
          amount: 300000000,
          memo: "Modal",
          journalEntryId: "entry-2",
          createdAt: "2026-04-28T00:00:00.000Z",
          updatedAt: "2026-04-28T00:00:00.000Z",
          account: { id: "acc-2", code: "3001", name: "Modal", type: "equity" },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useOpeningBalanceItems("company-1"));
    await waitFor(() => expect(result.current.items).toHaveLength(0));

    await act(async () => {
      await result.current.addItem({
        kind: "equity",
        accountId: "acc-2",
        asOfDate: "2026-04-28",
        amount: 300000000,
        memo: "Modal",
      });
    });

    expect(result.current.items[0].id).toBe("item-2");
  });
});
