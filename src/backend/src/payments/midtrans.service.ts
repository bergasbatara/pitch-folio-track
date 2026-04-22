import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type CustomerDetails = {
  first_name?: string;
  email?: string;
  phone?: string;
};

interface ChargeCardRequest {
  payment_type: "credit_card";
  transaction_details: { order_id: string; gross_amount: number };
  credit_card: { token_id: string; authentication: boolean };
  customer_details?: CustomerDetails;
}

interface ChargeQrisRequest {
  payment_type: "qris";
  transaction_details: { order_id: string; gross_amount: number };
  qris?: { acquirer?: string };
  customer_details?: CustomerDetails;
}

interface ChargeGopayRequest {
  payment_type: "gopay";
  transaction_details: { order_id: string; gross_amount: number };
  gopay?: {
    enable_callback?: boolean;
    callback_url?: string;
    account_id?: string;
    payment_option_token?: string;
  };
  customer_details?: CustomerDetails;
}

export interface MidtransAction {
  name: string;
  method: string;
  url: string;
}

export interface ChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  redirect_url?: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  masked_card?: string;
  bank?: string;
  card_type?: string;
  // QRIS / GoPay
  actions?: MidtransAction[];
  qr_string?: string;
  acquirer?: string;
  expiry_time?: string;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly serverKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.serverKey = this.config.get<string>("MIDTRANS_SERVER_KEY", "");
    if (!this.serverKey) {
      // Fail fast so it's obvious why payments "don't connect".
      throw new Error("MIDTRANS_SERVER_KEY is not set");
    }
    const env = (this.config.get<string>("MIDTRANS_ENV") ?? "").trim().toLowerCase();
    const forcedSandbox = env === "sandbox";
    const forcedProd = env === "production" || env === "prod";
    const heuristicSandbox = this.serverKey.startsWith("SB-");
    const useSandbox = forcedSandbox || (!forcedProd && heuristicSandbox);
    this.baseUrl = useSandbox ? "https://api.sandbox.midtrans.com" : "https://api.midtrans.com";

    const rawTimeout = Number(this.config.get<string>("MIDTRANS_TIMEOUT_MS") ?? "15000");
    this.timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 15000;
  }

  private async postCharge(
    body: ChargeCardRequest | ChargeQrisRequest | ChargeGopayRequest,
    orderId: string,
  ): Promise<ChargeResponse> {
    const authString = Buffer.from(`${this.serverKey}:`).toString("base64");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/v2/charge`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        throw new Error(`Midtrans charge timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const data = (await response.json()) as ChargeResponse & { validation_messages?: string[] };
    if (!response.ok) {
      this.logger.warn(
        `Midtrans charge failed: http=${response.status} status_code=${data.status_code} msg=${data.status_message}`,
      );
      throw new Error(data.status_message || `Midtrans charge failed (HTTP ${response.status})`);
    }
    this.logger.log(
      `Charge ${orderId} [${body.payment_type}]: status_code=${data.status_code} tx_status=${data.transaction_status}`,
    );
    return data;
  }

  async chargeCard(params: {
    tokenId: string;
    orderId: string;
    grossAmount: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<ChargeResponse> {
    const body: ChargeCardRequest = {
      payment_type: "credit_card",
      transaction_details: { order_id: params.orderId, gross_amount: params.grossAmount },
      credit_card: { token_id: params.tokenId, authentication: true },
    };
    if (params.customerName || params.customerEmail) {
      body.customer_details = {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      };
    }
    return this.postCharge(body, params.orderId);
  }

  async chargeQris(params: {
    orderId: string;
    grossAmount: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<ChargeResponse> {
    const body: ChargeQrisRequest = {
      payment_type: "qris",
      transaction_details: { order_id: params.orderId, gross_amount: params.grossAmount },
      qris: { acquirer: "gopay" },
    };
    if (params.customerName || params.customerEmail) {
      body.customer_details = {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      };
    }
    return this.postCharge(body, params.orderId);
  }

  async chargeGopay(params: {
    orderId: string;
    grossAmount: number;
    callbackUrl?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<ChargeResponse> {
    const body: ChargeGopayRequest = {
      payment_type: "gopay",
      transaction_details: { order_id: params.orderId, gross_amount: params.grossAmount },
      gopay: {
        enable_callback: true,
        callback_url: params.callbackUrl,
      },
    };
    if (params.customerName || params.customerEmail) {
      body.customer_details = {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      };
    }
    return this.postCharge(body, params.orderId);
  }

  async getStatus(orderId: string): Promise<ChargeResponse> {
    const authString = Buffer.from(`${this.serverKey}:`).toString("base64");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/v2/${orderId}/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${authString}`,
        },
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        throw new Error(`Midtrans status timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
    const data = (await response.json()) as ChargeResponse;
    if (!response.ok) {
      this.logger.warn(
        `Midtrans status failed: http=${response.status} status_code=${data.status_code} msg=${data.status_message}`,
      );
      throw new Error(data.status_message || `Midtrans status failed (HTTP ${response.status})`);
    }
    this.logger.log(
      `Status ${orderId}: status_code=${data.status_code} tx_status=${data.transaction_status} fraud=${data.fraud_status ?? "-"}`,
    );
    return data;
  }
}
