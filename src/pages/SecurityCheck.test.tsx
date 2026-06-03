import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SecurityCheck from "./SecurityCheck";

const companyState = {
  company: { id: "company-1" as string } | null,
};

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/features/onboarding", () => ({
  useCompanyProfile: () => companyState,
}));

describe("SecurityCheck", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    companyState.company = { id: "company-1" };
    document.cookie = "csrf_token=initial-token; path=/";
  });

  it("shows a passing audit result when audit logs are returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: "audit-1" }, { id: "audit-2" }],
      }),
    );

    render(<SecurityCheck />);

    fireEvent.click(screen.getByText("Cek Audit Logs"));

    await waitFor(() => {
      expect(screen.getByText("Lulus: 2 log ditemukan.")).toBeInTheDocument();
    });
  });

  it("shows a passing rate-limit result once a 429 appears", async () => {
    const fetchMock = vi.fn();
    for (const status of [401, 401, 401, 401, 401, 401, 429]) {
      fetchMock.mockResolvedValueOnce({ status });
    }
    vi.stubGlobal("fetch", fetchMock);

    render(<SecurityCheck />);

    fireEvent.click(screen.getByText("Jalankan Test"));

    await waitFor(() => {
      expect(screen.getByText(/Lulus: 429 muncul/i)).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });

  it("blocks the audit test when the company is unavailable", async () => {
    companyState.company = null;

    render(<SecurityCheck />);

    fireEvent.click(screen.getByText("Cek Audit Logs"));

    expect(screen.getByText("Gagal: company belum tersedia.")).toBeInTheDocument();
  });
});
