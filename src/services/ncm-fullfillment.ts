import { AbstractFulfillmentService, Cart, Fulfillment, LineItem, Order } from "@medusajs/medusa"
import { CreateReturnType } from "@medusajs/medusa/dist/types/fulfillment-provider"

require('dotenv').config();
const shouldLog = process.env.NCM_LOGGING_TRUE === 'true';
const logData = true;

class NcmFullfillmentService extends AbstractFulfillmentService {
    static identifier = "ncm-fullfillment"

    constructor(container) {
        super(container)
    }

    async getFulfillmentOptions(): Promise<any[]> {
        shouldLog && logData && console.log (`getFulfillmentOptions method has been called.\n`);
        return [
            {
                id: "ncm-fulfillment",
            },
        ]
    }

    async validateFulfillmentData(
        optionData: Record<string, unknown>,
        data: Record<string, unknown>,
        cart: Cart
    ): Promise<Record<string, unknown>> {
        shouldLog && console.log (`validateFulfillmentData method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside validateFulfillmentData method we are getting optionData as: \n`);
        shouldLog && logData && console.log (optionData);
        shouldLog && logData && console.log (`-> Inside validateFulfillmentData method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        shouldLog && logData && console.log (`-> Inside validateFulfillmentData method we are getting cart as: \n`);
        shouldLog && logData && console.log (cart);
        if (optionData.id !== "ncm-fulfillment") {
            throw new Error("invalid data")
        }
        return {
            ...data,
        }
    }

    async validateOption(
        data: Record<string, unknown>
    ): Promise<boolean> {
        shouldLog && console.log (`validateOption method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside validateOption method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        return data.id == "ncm-fulfillment"
    }

    async canCalculate(
        data: Record<string, unknown>
    ): Promise<boolean> {
        shouldLog && console.log (`canCalculate method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside canCalculate method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        return true
    }

    async calculatePrice(
        optionData: Record<string, unknown>,
        data: Record<string, unknown>,
        cart: Cart
    ): Promise<number> {
        shouldLog && console.log (`calculatePrice method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside calculatePrice method we are getting optionData as: \n`);
        shouldLog && logData && console.log (optionData);
        shouldLog && logData && console.log (`-> Inside calculatePrice method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        shouldLog && logData && console.log (`-> Inside calculatePrice method we are getting cart as: \n`);
        shouldLog && logData && console.log (cart);
        return 300
    }

    async createFulfillment(
        data: Record<string, unknown>,
        items: LineItem[],
        order: Order,
        fulfillment: Fulfillment
    ) {
        shouldLog && console.log (`createFulfillment method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside createFulfillment method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        shouldLog && logData && console.log (`-> Inside createFulfillment method we are getting items as: \n`);
        shouldLog && logData && console.log (items);
        shouldLog && logData && console.log (`-> Inside createFulfillment method we are getting order as: \n`);
        shouldLog && logData && console.log (order);
        shouldLog && logData && console.log (`-> Inside createFulfillment method we are getting fulfillment as: \n`);
        shouldLog && logData && console.log (fulfillment);
        return { id: "ncm-fulfillment" }
    }

    // Do nothing here
    // NCM doesnt have api for this
    async cancelFulfillment(
        fulfillment: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log (`cancelFulfillment method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside cancelFulfillment method we are getting fulfillment as: \n`);
        shouldLog && logData && console.log (fulfillment);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async createReturn(
        returnOrder: CreateReturnType
    ): Promise<Record<string, unknown>> {
        shouldLog && console.log (`createReturn method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside createReturn method we are getting returnOrder as: \n`);
        shouldLog && logData && console.log (returnOrder);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async getFulfillmentDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log (`getFulfillmentDocuments method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside getFulfillmentDocuments method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async getReturnDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log (`getReturnDocuments method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside getReturnDocuments method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async getShipmentDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log (`getShipmentDocuments method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside getShipmentDocuments method we are getting data as: \n`);
        shouldLog && logData && console.log (data);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async retrieveDocuments(
        fulfillmentData: Record<string, unknown>,
        documentType: "invoice" | "label"
    ): Promise<any> {
        shouldLog && console.log (`retrieveDocuments method has been called.\n`);
        shouldLog && logData && console.log (`-> Inside retrieveDocuments method we are getting fulfillmentData as: \n`);
        shouldLog && logData && console.log (fulfillmentData);
        shouldLog && logData && console.log (`-> Inside retrieveDocuments method we are getting documentType as: \n`);
        shouldLog && logData && console.log (documentType);
        return {}
    }
}

export default NcmFullfillmentService