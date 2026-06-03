import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Subscription from "./Subscription";

const navigateMock = vi.fn();
const toastMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/shared/hooks/useErrorToast", () => ({
  useErrorToast: vi.fn(),
}));

vi.mock("@/features/onboarding", () => ({
  useCompanyProfile: () => ({
    company: { id: "company-1" },
    error: null,
  }),
}));

vi.mock("../hooks/useSubscription", () => ({
  useSubscription: () => ({
    plans: [
      { id: "business", name: "Business", price: 299000, currency: "IDR", period: "monthly", features: ["A"] },
      { id: "professional", name: "Professional", price: 499000, currency: "IDR", period: "monthly", features: ["B"], recommended: true },
    ],
    subscription: {
      planId: "professional",
      status: "active",
      startDate: "2026-05-01",
      endDate: "2026-06-01",
    },
    getCurrentPlan: () => ({
      id: "professional",
      name: "Professional",
      price: 499000,
      currency: "IDR",
      period: "monthly",
      features: ["B"],
      recommended: true,
    }),
    isSubscribed: () => true,
    error: null,
  }),
}));

describe("Subscription page", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    toastMock.mockReset();
  });

  it("shows renewal actions for the current plan", () => {
    render(<Subscription />);

    expect(screen.getByText("Perpanjang Paket")).toBeInTheDocument();
    expect(screen.getByText("Perpanjang Paket Ini")).toBeInTheDocument();
    expect(screen.getByText(/Berlaku sampai/i)).toBeInTheDocument();
  });

  it("navigates to the payment page when renewing the current plan", () => {
    render(<Subscription />);

    fireEvent.click(screen.getByText("Perpanjang Paket Ini"));

    expect(navigateMock).toHaveBeenCalledWith("/pembayaran?plan=professional");
  });
});
