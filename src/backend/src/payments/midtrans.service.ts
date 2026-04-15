import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface ChargeRequest {
  payment_type: "credit_card";
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  credit_card: {
    token_id: string;
    authentication: boolean;
  };
  customer_details?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
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
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly serverKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.serverKey = this.config.get<string>("MIDTRANS_SERVER_KEY", "");
    if (!this.serverKey) {
      // Fail fast so it's obvious why payments "don't connect".
      throw new Error("MIDTRANS_SERVER_KEY is not set");
    }
    const isSandbox = !this.serverKey.startsWith("Mid-server-");
    this.baseUrl = isSandbox
      ? "https://api.sandbox.midtrans.com"
      : "https://api.midtrans.com";
  }

  async chargeCard(params: {
    tokenId: string;
    orderId: string;
    grossAmount: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<ChargeResponse> {
    const body: ChargeRequest = {
      payment_type: "credit_card",
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      credit_card: {
        token_id: params.tokenId,
        authentication: true,
      },
    };

    if (params.customerName || params.customerEmail) {
      body.customer_details = {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      };
    }

    const authString = Buffer.from(`${this.serverKey}:`).toString("base64");

    const response = await fetch(`${this.baseUrl}/v2/charge`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as ChargeResponse & { validation_messages?: string[] };
    if (!response.ok) {
      this.logger.warn(
        `Midtrans charge failed: http=${response.status} status_code=${data.status_code} msg=${data.status_message}`,
      );
      // Bubble up a readable error to the controller/UI.
      throw new Error(data.status_message || `Midtrans charge failed (HTTP ${response.status})`);
    }
    this.logger.log(
      `Charge ${params.orderId}: status_code=${data.status_code} tx_status=${data.transaction_status}`,
    );
    return data;
  }

  async getStatus(orderId: string): Promise<ChargeResponse> {
    const authString = Buffer.from(`${this.serverKey}:`).toString("base64");
    const response = await fetch(`${this.baseUrl}/v2/${orderId}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
    });
    const data = (await response.json()) as ChargeResponse;
    if (!response.ok) {
      this.logger.warn(
        `Midtrans status failed: http=${response.status} status_code=${data.status_code} msg=${data.status_message}`,
      );
      throw new Error(data.status_message || `Midtrans status failed (HTTP ${response.status})`);
    }
    return data;
  }
}
