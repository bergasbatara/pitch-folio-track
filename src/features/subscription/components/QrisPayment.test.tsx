import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QrisPayment } from "./QrisPayment";

const toastMock = vi.fn();
let pollCallback: (() => Promise<void>) | undefined;

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

describe("QrisPayment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toastMock.mockReset();
    pollCallback = undefined;
    document.cookie = "csrf_token=test-token; path=/";
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      pollCallback = callback as () => Promise<void>;
      return 1 as unknown as number;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a QRIS charge and completes after a successful polling result", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: "order-1",
          statusCode: "201",
          transactionStatus: "pending",
          qrString: "qr-payload",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactionStatus: "settlement" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <QrisPayment
        companyId="company-1"
        planId="professional"
        planName="Professional"
        grossAmount={499000}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate QR Code" }));

    expect(await screen.findByTestId("qr-code")).toHaveTextContent("qr-payload");
    expect(pollCallback).toBeTypeOf("function");

    await act(async () => {
      await pollCallback?.();
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Pembayaran Berhasil" }),
    );
  });

  it("shows a destructive toast when QRIS charge creation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "QRIS charge gagal" }),
      }),
    );

    render(
      <QrisPayment
        companyId="company-1"
        planId="professional"
        planName="Professional"
        grossAmount={499000}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate QR Code" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Gagal membuat QRIS",
          variant: "destructive",
        }),
      );
    });
  });
});
