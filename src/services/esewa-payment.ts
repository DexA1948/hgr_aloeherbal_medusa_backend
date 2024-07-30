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

const shouldLog = process.env.ESEWA_LOGGING_TRUE === 'true';

class Client {
    public generateSignature(data: string): string {
        shouldLog && console.log(`generateSignature method has been called.\n`);
        shouldLog && console.log(`-> Inside generateSignature method we are getting data to create the signature as: \n`);
        shouldLog && console.log(data);
        const hmac = crypto.createHmac('sha256', process.env.ESEWA_API_KEY);
        hmac.update(data);
        const signature = hmac.digest('base64');
        shouldLog && console.log(`-> Inside generateSignature method we are returning the signature as: ${signature} \n`);
        return signature;
    }

    // private generateTransactionUUID(length) {
    //     shouldLog && console.log(`generateTransactionUUID method has been called. \n`);
    //     let result = '';
    //     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //     const charactersLength = characters.length;
    //     for (let i = 0; i < length; i++) {
    //         result += characters.charAt(Math.floor(Math.random() * charactersLength));
    //     }
    //     shouldLog && console.log(`-> Inside generateTransactionUUID method we are returning new UUID as: dexa1948${result} \n`);
    //     return 'dexa1948' + result;
    // }

    // public getNewTranscationUUID(): string {
    //     shouldLog && console.log(`getNewTranscationUUID method has been called. \n`);
    //     const newTranscationUUID = this.generateTransactionUUID(12);
    //     shouldLog && console.log(`-> Inside getNewTranscationUUID method we are returning new UUID as: ${newTranscationUUID} \n`);
    //     return newTranscationUUID;
    // }

    async checkPaymentStatus(transaction_uuid, total_amount) {
        shouldLog && console.log(`checkPaymentStatus method has been called for transaction_uuid: ${transaction_uuid}\n`);

        const sanitizedTotalAmount = total_amount.toString().replace(/,/g, '');

        const params = {
            product_code: process.env.ESEWA_PRODUCT_CODE,
            total_amount: sanitizedTotalAmount,
            transaction_uuid,
        };

        const url = `${process.env.ESEWA_BASE_URL}/api/epay/transaction/status`;
        const fullUrl = `${url}?${new URLSearchParams(params).toString()}`;

        shouldLog && console.log(`-> Inside checkPaymentStatus method, transaction status for eSewa is checked at URL: ${fullUrl} \n`);

        try {
            const response = await axios.get(url, { params });
            shouldLog && console.log(`-> Inside checkPaymentStatus method, we get response from eSewa as: \n`);
            shouldLog && console.log(response.data)
            return response.data;
        } catch (error) {
            shouldLog && console.log(`-> Inside checkPaymentStatus method, we encounter error while getting response from eSewa as: \n`);
            console.error(error.message);
            if (error.response) {
                console.error(`-> Inside checkPaymentStatus method, Here is more details about the error ecountered: \n`);
                console.error(`-> Inside checkPaymentStatus method, error.response.data is: `, error.response.data);
                console.error(`-> Inside checkPaymentStatus method, error.response.status is: `, error.response.status);
                console.error(`-> Inside checkPaymentStatus method, error.response.headers is: `, error.response.headers);
            } else if (error.request) {
                console.error(`-> Inside checkPaymentStatus method we haven't received any response, error.request is: \n`, error.request);
            } else {
                console.error(`-> Inside checkPaymentStatus method, error.message is: `, error.message);
            }
            throw error;
        }
    }

    decodeBase64Response(encodedData: string): any {
        shouldLog && console.log(`decodeBase64Response method has been called for encodedData: ${encodedData}\n`);
        const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
        shouldLog && console.log(`-> Inside decodeBase64Response method we are getting decoded data before calling JSON.parse as: ${decodedData} \n`);
        return JSON.parse(decodedData);
    }

    verifySignature(data: any): boolean {
        shouldLog && console.log(`verifySignature method has been called. \n`);
        shouldLog && console.log(`-> Inside verifySignature method we are getting data to verify the signature as: \n`);
        shouldLog && console.log(data);
        
        const { signature, ...fields } = data;
        const fieldNames = fields.signed_field_names.split(",");

        // Create the string to sign by joining the fields and values in the correct format
        const dataToSign = `transaction_code=${fields.transaction_code},status=${fields.status},total_amount=${fields.total_amount},transaction_uuid=${fields.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${fields.signed_field_names}`;
        const generatedSignature = this.generateSignature(dataToSign);

        // Logging for debugging
        shouldLog && console.log(`-> Inside verifySignature, More logs for debugging: \n`);
        shouldLog && console.log(`-> Inside verifySignature, we have created signing data 'dataToSign' variable as: ${dataToSign}\n`);
        shouldLog && console.log(`-> Inside verifySignature, we have received signature 'generatedSignature' variable as: ${generatedSignature}\n`);
        shouldLog && console.log(`-> Inside verifySignature, the signature we receieved from eSewa is: ${signature}\n`);
        shouldLog && console.log(`-> Inside verifySignature, the check generatedSignature === signature is: ${generatedSignature === signature}\n`);

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
        shouldLog && console.log(`\nEsewaPaymentService's capturePayment method has been called for transaction_uuid i.e: paymentSessionData.id : ${paymentSessionData.id}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's capturePayment, paymentSessionData receieved is: \n`);
        shouldLog && console.log(paymentSessionData);

        try {
            const transaction_uuid = paymentSessionData.id as string;
            const total_amount = paymentSessionData.total_amount as string;
            const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

            if (paymentStatus.status === "COMPLETE") {
                const returnObj = {
                    ...paymentSessionData,
                    ...paymentStatus,
                    lastEditToData: "capturePayment",
                };

                shouldLog && console.log(`-> Inside EsewaPaymentService's capturePayment, since paymentStatus check return complete, what we are returning is: \n`);
                shouldLog && console.log(returnObj);

                return returnObj;
            } else {
                throw this.buildError("In EsewaPaymentService's capturePayment method, Failed while trying to get payment status ", new Error(JSON.stringify(paymentStatus)));
            }
        } catch (e) {
            return this.buildError("In EsewaPaymentService's capturePayment method, Failed to capture payment", e);
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
        shouldLog && console.log(`\nEsewaPaymentService's authorizePayment method has been called for transaction_uuid i.e: paymentSessionData.id : ${paymentSessionData.id}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's authorizePayment, paymentSessionData receieved is: \n`);
        shouldLog && console.log(paymentSessionData);
        shouldLog && console.log(`-> Inside EsewaPaymentService's authorizePayment, 'context' variable receieved is: \n`);
        shouldLog && console.log(context);

        try {
            const transaction_uuid = paymentSessionData.id as string;
            const total_amount = paymentSessionData.total_amount as string;
            const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

            if (paymentStatus.status === "COMPLETE") {
                const returnObj = {
                    status: PaymentSessionStatus.AUTHORIZED,
                    data: {
                        ...paymentSessionData,
                        ...paymentStatus,
                        lastEditToData: "authorizePayment",
                    },
                };

                shouldLog && console.log(`-> Inside EsewaPaymentService's authorizePayment, since paymentStatus check return complete, what we are returning is: \n`);
                shouldLog && console.log(returnObj);

                return returnObj;
            } else {
                throw this.buildError("In EsewaPaymentService's authorizePayment method, Failed while trying to get payment status ", new Error(JSON.stringify(paymentStatus)));
            }
        } catch (e) {
            return this.buildError("In EsewaPaymentService's authorizePayment method, Failed to authorize payment", e);
        }
    }

    async cancelPayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        shouldLog && console.log(`\nEsewaPaymentService's cancelPayment method has been called for transaction_uuid i.e: paymentSessionData.id : ${paymentSessionData.id}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's cancelPayment, paymentSessionData receieved is: \n`);
        shouldLog && console.log(paymentSessionData);

        return this.buildError("In EsewaPaymentService's cancelPayment method, Failed to cancel payment", new Error("Contact Esewa to cancel payment"));
    }

    async initiatePayment(
        context: PaymentProcessorContext
    ): Promise<
        PaymentProcessorError | PaymentProcessorSessionResponse
    > {
        shouldLog && console.log(`\nEsewaPaymentService's initiatePayment method has been called for cart_id i.e: PaymentProcessorContext.resource_id : ${context.resource_id}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's initiatePayment, PaymentProcessorContext receieved is: \n`);
        shouldLog && console.log(context);

        try {
            const medusa = new Medusa({ baseUrl: process.env.MEDUSA_BACKEND_URL, maxRetries: 3 })
            const cartId = context.resource_id;

            // Retrieve the cart using Medusa client
            const { cart } = await medusa.carts.retrieve(cartId)
            shouldLog && console.log(`-> Inside EsewaPaymentService's initiatePayment, cart receieved using 'medusa.carts.retrieve(cartId)' is: \n`);
            shouldLog && console.log(cart);

            const transaction_uuid =  context.resource_id;
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

            const returnObj = {
                session_data: {
                    id: transaction_uuid,
                    total_amount: total_amount,
                    formData: formData,
                    formSubmitURL: process.env.ESEWA_PAYMENTFORMSUBMIT_URL,
                    lastEditToData: "initiatePayment",
                },
            };

            shouldLog && console.log(`-> Inside EsewaPaymentService's initiatePayment, since formData creation is complete, what we are returning is: \n`);
            shouldLog && console.log(returnObj);

            return returnObj;
        } catch (e) {
            return this.buildError("In EsewaPaymentService's initiatePayment method, Failed to initiate payment", e);
        }
    }


    async deletePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        shouldLog && console.log(`\nEsewaPaymentService's deletePayment method has been called for transaction_uuid i.e: paymentSessionData.id : ${paymentSessionData.id}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's deletePayment, paymentSessionData receieved is: \n`);
        shouldLog && console.log(paymentSessionData);

        return this.buildError("In EsewaPaymentService's deletePayment method, Failed to delete payment", new Error("Contact Esewa to delete payment"));
    }

    async getPaymentStatus(
        paymentSessionData: Record<string, unknown>
    ): Promise<PaymentSessionStatus> {
        shouldLog && console.log(`\nEsewaPaymentService's getPaymentStatus method has been called for transaction_uuid i.e: paymentSessionData.id : ${paymentSessionData.id}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's getPaymentStatus, paymentSessionData receieved is: \n`);
        shouldLog && console.log(paymentSessionData);

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
        shouldLog && console.log(`\nEsewaPaymentService's refundPayment method has been called for transaction_uuid i.e: paymentSessionData.id : ${paymentSessionData.id} and refundAmount: ${refundAmount}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's refundPayment, paymentSessionData receieved is: \n`);
        shouldLog && console.log(paymentSessionData);

        return this.buildError("In EsewaPaymentService's refundPayment method, Failed to refund payment", new Error("Contact Esewa to refund payment"));
    }

    async retrievePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        shouldLog && console.log(`\nEsewaPaymentService's retrievePayment method has been called for transaction_uuid i.e: paymentSessionData.id : ${paymentSessionData.id}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's retrievePayment, paymentSessionData receieved is: \n`);
        shouldLog && console.log(paymentSessionData);

        const transaction_uuid = paymentSessionData.id as string;
        const total_amount = paymentSessionData.total_amount as number;

        try {
            const paymentStatus = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

            const returnObj = {
                ...paymentSessionData,
                ...paymentStatus,
                lastEditToData: "retrievePayment",
            };

            shouldLog && console.log(`-> Inside EsewaPaymentService's retrievePayment, since payment status check is complete, what we are returning is: \n`);
            shouldLog && console.log(returnObj);

            return returnObj;
        } catch (e) {
            return this.buildError("In EsewaPaymentService's retrievePayment method, Failed to retrieve payment", e);
        }
    }

    // doesn't change payment session
    // used to update payment info client like stripe and paypal
    // no need to update payment session in esewa because
    // we will only initiate communication with esewa
    // at last step and directly either finish or cancel payment
    // 7/30/2024 this is called when cart is updated so we update the form data
    async updatePayment(
        context: PaymentProcessorContext
    ): Promise<
        void |
        PaymentProcessorError |
        PaymentProcessorSessionResponse
    > {
        shouldLog && console.log(`\nEsewaPaymentService's updatePayment method has been called for cart_id i.e: PaymentProcessorContext.resource_id : ${context.resource_id} \n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's updatePayment, PaymentProcessorContext receieved is: \n`);
        shouldLog && console.log(context);

        try {
            const medusa = new Medusa({ baseUrl: process.env.MEDUSA_BACKEND_URL, maxRetries: 3 })
            const cartId = context.resource_id;

            // Retrieve the cart using Medusa client
            const { cart } = await medusa.carts.retrieve(cartId)

            shouldLog && console.log(`-> Inside EsewaPaymentService's updatePayment, we are getting new transaction_uuid. \n`);
            const transaction_uuid =  context.resource_id;
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

            const returnObj = {
                session_data: {
                    id: transaction_uuid,
                    total_amount: total_amount,
                    formData: formData,
                    formSubmitURL: process.env.ESEWA_PAYMENTFORMSUBMIT_URL,
                    lastEditToData: "updatePayment",
                },
            };

            shouldLog && console.log(`-> Inside EsewaPaymentService's updatePayment, since formData creation is complete, what we are returning is: \n`);
            shouldLog && console.log(returnObj);

            return returnObj;
        } catch (e) {
            return this.buildError("In EsewaPaymentService's updatePayment method, Failed to update payment", e);
        }
    }

    // Generally used to set new payment id not required here
    async updatePaymentData(
        sessionId: string,
        data: Record<string, unknown>
    ): Promise<
        Record<string, unknown> |
        PaymentProcessorError
    > {
        shouldLog && console.log(`\nEsewaPaymentService's updatePaymentData method has been called for sessionId: ${sessionId}\n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's updatePaymentData, we also receive data along with sessionId. Data is: \n`);
        shouldLog && console.log(data);

        const paymentSession = await this.paymentProviderService.retrieveSession(sessionId)
        const returnObj = {
            id: data.transaction_uuid,
            ...paymentSession.data,
            lastEditToData: "updatePaymentData",
        };

        shouldLog && console.log(`-> Inside EsewaPaymentService's updatePaymentData, what we are returning is: \n`);
        shouldLog && console.log(returnObj);

        return returnObj;
    }

    // Handle esewa success redirect
    async handleSuccessCallback(query: any): Promise<PaymentProcessorError | { status: string }> {
        shouldLog && console.log(`\nEsewaPaymentService's handleSuccessCallback method has been called.: \n`);
        shouldLog && console.log(`-> Inside EsewaPaymentService's handleSuccessCallback, we also receive encodedData or 'query' variable as: \n`);
        shouldLog && console.log(query);

        const encodedData = query.data;

        try {
            // Decode the base64 encoded response data
            const decodedData = this.client.decodeBase64Response(encodedData);
            shouldLog && console.log(`-> Inside EsewaPaymentService's handleSuccessCallback, the decodedData from encodedData is: \n`);
            shouldLog && console.log(decodedData);

            // Verify the signature
            // if (!this.client.verifySignature(decodedData)) {
            //     shouldLog && console.log("Invalid Signature")
            //     return this.buildError("Invalid signature", new Error("Signature verification failed"));
            // }

            const { transaction_uuid, total_amount, status } = decodedData;

            if (status === "COMPLETE") {
                const statusData = await this.client.checkPaymentStatus(transaction_uuid, total_amount);

                if (statusData.status === "COMPLETE") {
                    shouldLog && console.log(`-> Inside EsewaPaymentService's handleSuccessCallback, since status check is complete what we are returning is: \n`);
                    shouldLog && console.log({ status: "complete" });

                    return {
                        status: "complete",
                    };
                } else {
                    shouldLog && console.log(`-> Inside EsewaPaymentService's handleSuccessCallback, since status check is not complete what we are returning is: \n`);
                    shouldLog && console.log({ status: "not_complete" });

                    return {
                        status: "not_complete",
                    };
                }
            } else {
                shouldLog && console.log(`-> Inside EsewaPaymentService's updatePaymentData, since callback doesn't show complete we return: \n`);
                shouldLog && console.log({ status: "not_complete" });

                return {
                    status: "not_complete",
                };
            }
        } catch (e) {
            return this.buildError("In EsewaPaymentService's handleSuccessCallback method, Failed to handle callback", e);
        }
    }
}

export default EsewaPaymentService;
