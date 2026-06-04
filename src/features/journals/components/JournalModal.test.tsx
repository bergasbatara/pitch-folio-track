import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JournalModal } from "./JournalModal";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>,
}));

describe("JournalModal", () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    accounts: [
      {
        id: "acc-1",
        code: "1001",
        name: "Kas",
        type: "asset" as const,
        normalBalance: "debit" as const,
        isSystem: false,
        createdAt: "2026-04-28T00:00:00.000Z",
        updatedAt: "2026-04-28T00:00:00.000Z",
      },
    ],
  };

  it("shows draft messaging when debit and credit are imbalanced", () => {
    render(
      <JournalModal
        {...baseProps}
        entry={{
          id: "entry-1",
          date: "2026-04-28",
          memo: "Draft",
          status: "draft",
          createdAt: "2026-04-28T00:00:00.000Z",
          updatedAt: "2026-04-28T00:00:00.000Z",
          lines: [
            {
              id: "line-1",
              accountId: "acc-1",
              debit: 90000000,
              credit: 0,
              account: { id: "acc-1", code: "1001", name: "Kas" },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Akan disimpan sebagai Draft/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Baris Kredit Penyeimbang/i)).toBeInTheDocument();
  });

  it("shows posted messaging when debit and credit are balanced", () => {
    render(
      <JournalModal
        {...baseProps}
        entry={{
          id: "entry-1",
          date: "2026-04-28",
          memo: "Balanced",
          status: "posted",
          createdAt: "2026-04-28T00:00:00.000Z",
          updatedAt: "2026-04-28T00:00:00.000Z",
          lines: [
            {
              id: "line-1",
              accountId: "acc-1",
              debit: 5000,
              credit: 0,
              account: { id: "acc-1", code: "1001", name: "Kas" },
            },
            {
              id: "line-2",
              accountId: "acc-1",
              debit: 0,
              credit: 5000,
              account: { id: "acc-1", code: "1001", name: "Kas" },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Seimbang — akan diposting/i)).toBeInTheDocument();
  });
});
