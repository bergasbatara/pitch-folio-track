import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Payment from "./Payment";

const navigateMock = vi.fn();
const searchParamsState = { plan: "professional" as string | null };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(searchParamsState.plan ? { plan: searchParamsState.plan } : {})],
  };
});

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/features/onboarding", () => ({
  useCompanyProfile: () => ({
    company: { id: "company-1" },
  }),
}));

vi.mock("../hooks/useSubscription", () => ({
  useSubscription: () => ({
    plans: [
      {
        id: "professional",
        name: "Professional",
        price: 499000,
        currency: "IDR",
        period: "monthly",
        features: ["Audit"],
      },
    ],
  }),
}));

vi.mock("../components/QrisPayment", () => ({
  QrisPayment: () => <div>QRIS mock</div>,
}));

vi.mock("../components/GopayPayment", () => ({
  GopayPayment: () => <div>GoPay mock</div>,
}));

describe("Payment page", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    window.MidtransNew3ds = {
      getCardToken: vi.fn(),
      authenticate: vi.fn(),
    };
  });

  it("renders the selected plan checkout summary", () => {
    searchParamsState.plan = "professional";

    render(<Payment />);

    expect(screen.getByText("Pembayaran")).toBeInTheDocument();
    expect(screen.getAllByText("Professional").length).toBeGreaterThan(0);
    expect(screen.getByText("Bayar Rp 499.000")).toBeInTheDocument();
  });

  it("shows a not found state when the plan query does not match available plans", () => {
    searchParamsState.plan = "missing";

    render(<Payment />);

    expect(screen.getByText("Paket tidak ditemukan.")).toBeInTheDocument();
  });
});
