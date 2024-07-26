import axios from "axios";
import crypto from "crypto";
import {
  AbstractPaymentProcessor,
  isPaymentProcessorError,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentProviderService,
  PaymentSessionStatus,
} from "@medusajs/medusa";
import { EOL } from "os";

require('dotenv').config();

class Client {
  private secretKey: string;
  private baseUrl: string;
  private productCode: string;

  constructor() {
    this.secretKey = process.env.ESEWA_API_KEY;; // eSewa secret key
    this.baseUrl = process.env.ESEWA_BASE_URL; // eSewa base URL
    this.productCode = process.env.ESEWA_PRODUCT_CODE; // eSewa base URL
  }

  private generateSignature(data: string): string {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(data);
    return hmac.digest('base64');
  }

  private generateTransactionUUID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return 'dexa1948' + result;
  }

  async initiate(): Promise<any> {
    return this.generateTransactionUUID(10);
  }

  async checkPaymentStatus(transaction_uuid: string, total_amount: number): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/api/epay/transaction/status`, {
      params: {
        product_code: this.productCode,
        transaction_uuid,
        total_amount,
      },
    });
    return response.data;
  }

  decodeBase64Response(encodedData: string): any {
    const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(decodedData);
  }

  verifySignature(data: any): boolean {
    const { signed_field_names, signature, ...fields } = data;
    const fieldNames = signed_field_names.split(",");

    // Create the string to sign by joining the fields and values in the correct format
    const dataToSign = fieldNames.map((field: string) => `${field}=${fields[field]}`).join(",");
    const generatedSignature = this.generateSignature(dataToSign);

    return generatedSignature === signature;
  }

}

class EsewaPaymentService extends AbstractPaymentProcessor {
  static identifier = "esewa-payment";
  protected paymentProviderService: PaymentProviderService;
  protected client: Client;

  constructor(container, options) {
    super(container);
    this.client = new Client();
    this.paymentProviderService = container.paymentProviderService;
  }

  protected buildError(
    message: string,
    e: PaymentProcessorError | Error
  ): PaymentProcessorError {
    return {
      error: message,
      code: "code" in e ? e.code : "",
      detail: isPaymentProcessorError(e)
        ? `${e.error}${EOL}${e.detail ?? ""}`
        : "detail" in e
          ? e.detail
          : e.message ?? "",
    };
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    try {
      const paymentId = paymentSessionData.id;
      const transaction_uuid = paymentSessionData.id as string;
      const total_amount = paymentSessionData.total_amount as number;
      const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

      if (paymentStatus.status === "COMPLETE") {
        return {
          id: paymentId,
          ...paymentStatus
        };
      } else {
        return this.buildError("Payment not complete", new Error(paymentStatus));
      }
    } catch (e) {
      return this.buildError("Failed to capture payment", e);
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    PaymentProcessorError |
    {
      status: PaymentSessionStatus;
      data: Record<string, unknown>;
    }
  > {
    try {
      const transaction_uuid = paymentSessionData.id as string;
      const total_amount = paymentSessionData.total_amount as number;
      const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

      if (paymentStatus === "COMPLETED") {
        return {
          status: PaymentSessionStatus.AUTHORIZED,
          data: {
            id: paymentSessionData.id,
            ref_id: paymentStatus.ref_id,
          },
        };
      } else if (paymentStatus === "PENDING") {
        return {
          status: PaymentSessionStatus.REQUIRES_MORE,
          data: {
            id: paymentSessionData.id,
          },
        };
      } else {
        return this.buildError("Failed to authorize payment", new Error(paymentStatus));
      }
    } catch (e) {
      return this.buildError("Failed to authorize payment", e);
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    return this.buildError("Cannot cancel esewa payment", new Error("Contact Esewa to cancel payment"));
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse
  > {
    try {
      const cart = context.context;
      const transaction_uuid = await this.client.initiate();

      const {total} = cart;

      // Return the session data including the form to be used on the storefront
      return {
        session_data: {
          id: transaction_uuid,
          total_amount: total,
        },
      };
    } catch (e) {
      return this.buildError("Failed to initiate payment", e);
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    return this.buildError("Cannot delete esewa payment", new Error("Contact Esewa to delete payment"));
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    const transaction_uuid = paymentSessionData.id as string;
    const total_amount = paymentSessionData.total_amount as number;

    try {
      const statusData = await this.client.checkPaymentStatus(transaction_uuid, total_amount);
      const statusMap: { [key: string]: PaymentSessionStatus } = {
        COMPLETE: PaymentSessionStatus.AUTHORIZED,
        PENDING: PaymentSessionStatus.PENDING,
        CANCELED: PaymentSessionStatus.CANCELED,
        AMBIGUOUS: PaymentSessionStatus.PENDING,
        NOT_FOUND: PaymentSessionStatus.CANCELED,
      };
      return statusMap[statusData.status] || PaymentSessionStatus.ERROR;
    } catch (e) {
      return PaymentSessionStatus.PENDING;
    }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    return this.buildError("Cannot refund esewa payment", new Error("Contact Esewa to refund payment"));
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    const transaction_uuid = paymentSessionData.id as string;
    const total_amount = paymentSessionData.total_amount as number;

    try {
      return await this.client.checkPaymentStatus(transaction_uuid, total_amount);
    } catch (e) {
      return this.buildError("Failed to retrieve payment", e);
    }
  }

  // doesn't change payment session
  // used to update payment info client like stripe and paypal
  // no need to update payment session in esewa because
  // we will only initiate communication with esewa
  // at last step and directly either finish or cancel payment
  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<
    void |
    PaymentProcessorError |
    PaymentProcessorSessionResponse
  > {
    return;
  }

  // Generally used to set new payment id not required here
  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<
    Record<string, unknown> |
    PaymentProcessorError
  > {
    return;
  }
}

export default EsewaPaymentService;
