import axios from "axios";
import crypto, { sign } from "crypto";
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
import Medusa from "@medusajs/medusa-js"

require('dotenv').config();

class Client {
    public generateSignature(data: string): string {
        const hmac = crypto.createHmac('sha256', process.env.ESEWA_API_KEY);
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

    public initiate(): string {
        return this.generateTransactionUUID(10);
    }

    async checkPaymentStatus(transaction_uuid, total_amount) {
        console.log("Inside check payment status");

        const sanitizedTotalAmount = total_amount.toString().replace(/,/g, '');

        const params = {
            product_code: process.env.ESEWA_PRODUCT_CODE,
            total_amount: sanitizedTotalAmount,
            transaction_uuid,
        };

        const url = `${process.env.ESEWA_BASE_URL}/api/epay/transaction/status`;
        const fullUrl = `${url}?${new URLSearchParams(params).toString()}`;

        console.log("Constructed URL:", fullUrl);

        try {
            const response = await axios.get(url, { params });
            console.log("Check Payment Status With Esewa:\n", response.data);
            return response.data;
        } catch (error) {
            console.error("Error checking payment status with Esewa:", error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
                console.error("Response headers:", error.response.headers);
            } else if (error.request) {
                console.error("No response received:", error.request);
            } else {
                console.error("Error message:", error.message);
            }
            throw error;
        }
    }

    decodeBase64Response(encodedData: string): any {
        const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
        return JSON.parse(decodedData);
    }

    verifySignature(data: any): boolean {
        const { signature, ...fields } = data;
        const fieldNames = fields.signed_field_names.split(",");

        // Create the string to sign by joining the fields and values in the correct format
        const dataToSign = `transaction_code=${fields.transaction_code},status=${fields.status},total_amount=${fields.total_amount},transaction_uuid=${fields.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${fields.signed_field_names}`;
        const generatedSignature = this.generateSignature(dataToSign);

        // Logging for debugging
        console.log("Data to Sign:", dataToSign);
        console.log("Generated Signature:", generatedSignature);
        console.log("Provided Signature:", signature);
        console.log("Signature Match:", generatedSignature === signature);

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
        console.log("Capture Payment Is Called: \n", paymentSessionData.id);
        try {
            const transaction_uuid = paymentSessionData.id as string;
            const total_amount = paymentSessionData.total_amount as string;
            const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

            if (paymentStatus.status === "COMPLETE") {
                return {
                    ...paymentSessionData,
                    ...paymentStatus,
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
        console.log("Authorized Payment Is Called: \n", paymentSessionData.id);
        try {
            const transaction_uuid = paymentSessionData.id as string;
            const total_amount = paymentSessionData.total_amount as string;
            const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

            console.log("in authorize payment status is", paymentStatus);
            if (paymentStatus.status === "COMPLETE") {
                return {
                    status: PaymentSessionStatus.AUTHORIZED,
                    data: {
                        ...paymentSessionData,
                        ...paymentStatus,
                    },
                };
            } else {
                throw this.buildError("Failed to authorize payment", new Error(JSON.stringify(paymentStatus)));
            }
        } catch (e) {
            return this.buildError("Failed to authorize payment", e);
        }
    }

    async cancelPayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        console.log("Cancel Payment Is Called: \n", paymentSessionData.id);
        return this.buildError("Cannot cancel esewa payment", new Error("Contact Esewa to cancel payment"));
    }

    async initiatePayment(
        context: PaymentProcessorContext
    ): Promise<
        PaymentProcessorError | PaymentProcessorSessionResponse
    > {
        console.log("Initiate Payment Is Called: \n", context.resource_id);
        try {
            const medusa = new Medusa({ baseUrl: process.env.MEDUSA_BACKEND_URL, maxRetries: 3 })
            const cartId = context.resource_id;

            // Retrieve the cart using Medusa client
            const { cart } = await medusa.carts.retrieve(cartId)

            const transaction_uuid = this.client.initiate();
            const productCode = process.env.ESEWA_PRODUCT_CODE;
            const total_amount = cart.total.toString();

            const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${productCode}`;
            const signature = this.client.generateSignature(dataToSign);

            const formData = {
                amount: cart.subtotal.toString(),
                tax_amount: cart.tax_total.toString(),
                total_amount: total_amount,
                transaction_uuid: transaction_uuid,
                product_code: productCode,
                product_service_charge: "0",
                product_delivery_charge: cart.shipping_total.toString(),
                success_url: `${process.env.NEXT_PUBLIC_URL}/esewa/success`,
                failure_url: `${process.env.NEXT_PUBLIC_URL}/esewa/failure`,
                signed_field_names: "total_amount,transaction_uuid,product_code",
                signature: signature,
            }

            return {
                session_data: {
                    id: transaction_uuid,
                    total_amount: total_amount,
                    formData: formData,
                    formSubmitURL: process.env.ESEWA_PAYMENTFORMSUBMIT_URL,
                },
            }
        } catch (e) {
            return this.buildError("Failed to initiate payment", e);
        }
    }


    async deletePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        console.log("Delete Payment Is Called: \n", paymentSessionData.id);
        return this.buildError("Cannot delete esewa payment", new Error("Contact Esewa to delete payment"));
    }

    async getPaymentStatus(
        paymentSessionData: Record<string, unknown>
    ): Promise<PaymentSessionStatus> {
        console.log("GetPaymentStatus Is Called: \n", paymentSessionData.id);
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
        console.log("Refund Payment Is Called: \n", paymentSessionData.id);
        return this.buildError("Cannot refund esewa payment", new Error("Contact Esewa to refund payment"));
    }

    async retrievePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        console.log("Retrieve Payment Is Called: \n", paymentSessionData.id);
        const transaction_uuid = paymentSessionData.id as string;
        const total_amount = paymentSessionData.total_amount as number;

        try {
            const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);
            return {
                ...paymentSessionData,
                ...paymentStatus,
            }
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
        console.log("Update Payment Is Called: \n", context.resource_id);
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
        console.log("Update Payment Data Method Is Called: \n", sessionId);
        return;
    }

    // Handle esewa success redirect
    async handleSuccessCallback(query: any): Promise<PaymentProcessorError | { status: string }> {
        console.log("Handle Success Callback Is Called: \n", query);
        const encodedData = query.data;

        try {
            // Decode the base64 encoded response data
            const decodedData = this.client.decodeBase64Response(encodedData);

            // Verify the signature
            // if (!this.client.verifySignature(decodedData)) {
            //     console.log("Invalid Signature")
            //     return this.buildError("Invalid signature", new Error("Signature verification failed"));
            // }

            const { transaction_uuid, total_amount, status } = decodedData;
            console.log("Decoded Data in handleSuccessCallback: \n", decodedData);

            if (status === "COMPLETE") {
                const statusData = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

                if (statusData.status === "COMPLETE") {
                    return {
                        status: "complete",
                    };
                } else {
                    return {
                        status: "not_complete",
                    };
                }
            } else {
                return {
                    status: "not_complete",
                };
            }
        } catch (e) {
            return this.buildError("Failed to handle success callback", e);
        }
    }
}

export default EsewaPaymentService;
