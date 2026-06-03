import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAccounts } from "./useAccounts";

describe("useAccounts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps accounts sorted by code after adding", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "a2", code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit", isSystem: false, createdAt: "", updatedAt: "" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "a1", code: "1001", name: "Kas", type: "asset", normalBalance: "debit", isSystem: false, createdAt: "", updatedAt: "" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAccounts("company-1"));
    await waitFor(() => expect(result.current.accounts).toHaveLength(1));

    await act(async () => {
      await result.current.addAccount({ code: "1001", name: "Kas", type: "asset", normalBalance: "debit" });
    });

    expect(result.current.accounts.map((a) => a.code)).toEqual(["1001", "2001"]);
  });
});
