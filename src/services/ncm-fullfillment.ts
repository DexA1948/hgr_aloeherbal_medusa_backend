import {
    AbstractFulfillmentService,
    Cart,
    Fulfillment,
    LineItem,
    Order
} from "@medusajs/medusa"
import {
    CreateReturnType
} from "@medusajs/medusa/dist/types/fulfillment-provider"
import OrderService from "@medusajs/medusa/dist/services/order"

require('dotenv').config();
const shouldLog = process.env.NCM_LOGGING_TRUE === 'true';
const logData = true;

class NcmFullfillmentService extends AbstractFulfillmentService {
    static identifier = "ncm-fullfillment"
    protected orderService_: OrderService;

    constructor(container: Record<string, unknown>) {
        super(container)
        this.orderService_ = container.orderService as OrderService
    }

    async getFulfillmentOptions(): Promise<any[]> {
        shouldLog && logData && console.log(`getFulfillmentOptions method has been called.\n`);
        return [
            {
                id: "ncm-fulfillment"
            },
            {
                id: "ncm-fulfillment-return"
            },
        ]
    }

    async validateFulfillmentData(
        optionData: Record<string, unknown>,
        data: Record<string, unknown>,
        cart: Cart
    ): Promise<Record<string, unknown>> {
        shouldLog && console.log(`validateFulfillmentData method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside validateFulfillmentData method we are getting optionData as: \n`);
        shouldLog && logData && console.log(optionData);
        shouldLog && logData && console.log(`-> Inside validateFulfillmentData method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        shouldLog && logData && console.log(`-> Inside validateFulfillmentData method we are getting cart as: \n`);
        shouldLog && logData && console.log(cart);

        // Allow both regular and return fulfillment
        if (optionData.id !== "ncm-fulfillment" && optionData.id !== "ncm-fulfillment-return") {
            throw new Error("invalid fulfillment option")
        }
        return {
            ...data,
        }
    }

    async validateOption(
        data: Record<string, unknown>
    ): Promise<boolean> {
        shouldLog && console.log(`validateOption method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside validateOption method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        return data.id === "ncm-fulfillment" || data.id === "ncm-fulfillment-return"
    }

    async canCalculate(
        data: Record<string, unknown>
    ): Promise<boolean> {
        shouldLog && console.log(`canCalculate method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside canCalculate method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        return true
    }

    async calculatePrice(
        optionData: Record<string, any>,
        data: Record<string, any>,
        cart: Cart
    ): Promise<number> {
        shouldLog && console.log(`calculatePrice method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside calculatePrice method we are getting optionData as: \n`);
        shouldLog && logData && console.log(optionData);
        shouldLog && logData && console.log(`-> Inside calculatePrice method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        shouldLog && logData && console.log(`-> Inside calculatePrice method we are getting cart as: \n`);
        shouldLog && logData && console.log(cart);

        // For returns, use the customer's address as origin
        const isReturn = optionData.id === "ncm-fulfillment-return";
        const destination = isReturn
            ? process.env.NCM_DEFAULT_CREATION || 'TINKUNE'  // Return destination is the store
            : cart.shipping_address?.postal_code;  // Regular shipping destination is customer

        if (!destination || destination.trim() === '') {
            throw new Error('Postal code is required for shipping rate calculation');
        }

        try {
            const baseUrl = process.env.NCM_BASE_URL || 'https://demo.nepalcanmove.com';
            const pickupType = isReturn ? 'Return' : (process.env.NCM_PICKUP_TYPE || 'Pickup/Collect');
            const origin = isReturn
                ? cart.shipping_address?.postal_code
                : (process.env.NCM_DEFAULT_CREATION || 'TINKUNE');

            const url = new URL(`${baseUrl}/api/v1/shipping-rate`);
            url.searchParams.append('creation', origin);
            url.searchParams.append('destination', destination);
            url.searchParams.append('type', pickupType);

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error('Failed to fetch shipping rate');
            }

            const rateData = await response.json();

            shouldLog && logData && console.log(`-> Inside calculatePrice method we are getting rateData from NCM as: \n`);
            shouldLog && logData && console.log(rateData);

            return rateData.charge * 100 || 30000;

        } catch (error) {
            console.error('Error calculating shipping rate:', error);
            throw error;
        }
    }

    async createFulfillment(
        data: Record<string, unknown>,
        items: LineItem[],
        order: Order,
        fulfillment: Fulfillment
    ) {
        shouldLog && console.log(`createFulfillment method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside createFulfillment method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        shouldLog && logData && console.log(`-> Inside createFulfillment method we are getting items as: \n`);
        shouldLog && logData && console.log(items);
        shouldLog && logData && console.log(`-> Inside createFulfillment method we are getting order as: \n`);
        shouldLog && logData && console.log(order);
        shouldLog && logData && console.log(`-> Inside createFulfillment method we are getting fulfillment as: \n`);
        shouldLog && logData && console.log(fulfillment);

        try {
            const baseUrl = process.env.NCM_BASE_URL || 'https://demo.nepalcanmove.com';
            const apiToken = process.env.NCM_API_KEY;

            if (!apiToken) {
                throw new Error('NCM API token is not configured');
            }

            const fullAddress = [
                order.shipping_address.address_1,
                order.shipping_address.company,
                order.shipping_address.city,
                order.shipping_address.province,
                order.shipping_address.postal_code
            ]
                .filter(Boolean)  // Remove null/undefined/empty values
                .join(', ');

            shouldLog && logData && console.log(`-> Inside createFulfillment method we are making fullAddress NCM as: \n`);
            shouldLog && logData && console.log(fullAddress);

            const packageDescription = items
                .map(item => `${item.title} x${item.quantity}`)
                .join(', ');

            shouldLog && logData && console.log(`-> Inside createFulfillment method we are making packageDescription NCM as: \n`);
            shouldLog && logData && console.log(packageDescription);

            const requestBody = {
                name: order.shipping_address.first_name + ' ' + order.shipping_address.last_name,
                phone: order.shipping_address.phone,
                phone2: '',
                cod_charge: order.payments[0].provider_id == "manual" ? order.total/100 : '0',
                address: fullAddress,
                fbranch: process.env.NCM_DEFAULT_CREATION || 'TINKUNE',
                branch: order.shipping_address.postal_code,
                package: packageDescription,
                vref_id: order.id.slice(-7),
                instruction: order.shipping_address.address_2 || ''
            };

            shouldLog && logData && console.log(`-> Inside createFulfillment method we are making requestBody NCM as: \n`);
            shouldLog && logData && console.log(requestBody);

            const response = await fetch(`${baseUrl}/api/v1/order/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`Failed to create NCM order: ${errorData?.message || response.statusText}`);
            }

            const ncmResponse = await response.json();

            shouldLog && logData && console.log(`-> Inside createFulfillment method we are getting ncmResponse from NCM as: \n`);
            shouldLog && logData && console.log(ncmResponse);

            return {
                id: ncmResponse.orderid || 'ncm-fulfillment',
                ...ncmResponse
            };

        } catch (error) {
            console.error('Error creating NCM fulfillment:', error);
            throw error;
        }
    }

    // Do nothing here
    // NCM doesnt have api for this
    async cancelFulfillment(
        fulfillment: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log(`cancelFulfillment method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside cancelFulfillment method we are getting fulfillment as: \n`);
        shouldLog && logData && console.log(fulfillment);
        return {}
    }

    // we have changed this using claude.ai
    // for cod price and calculations please check
    // async createReturn(
    //     returnOrder: CreateReturnType
    // ): Promise<Record<string, unknown>> {
    //     shouldLog && console.log(`createReturn method has been called.\n`);
    //     shouldLog && logData && console.log(`-> Inside createReturn method we are getting returnOrder as: \n`);
    //     shouldLog && logData && console.log(returnOrder);

    //     try {
    //         // Fetch complete order details first
    //         const order = await this.orderService_.retrieve(returnOrder.order_id, {
    //             relations: ['shipping_address'],
    //         });

    //         shouldLog && logData && console.log(`-> Inside createReturn method, retrieved order details: \n`);
    //         shouldLog && logData && console.log(order);

    //         if (!order.shipping_address) {
    //             throw new Error('Order shipping address is required for return shipping');
    //         }

    //         const baseUrl = process.env.NCM_BASE_URL || 'https://demo.nepalcanmove.com';
    //         const apiToken = process.env.NCM_API_KEY;

    //         if (!apiToken) {
    //             throw new Error('NCM API token is not configured');
    //         }

    //         const fullAddress = [
    //             order.shipping_address.address_1,
    //             order.shipping_address.company,
    //             order.shipping_address.city,
    //             order.shipping_address.province,
    //             order.shipping_address.postal_code
    //         ]
    //             .filter(Boolean)
    //             .join(', ');

    //         const packageDescription = returnOrder.items
    //             .map(item => `${item.item.title} x${item.quantity}`)
    //             .join(', ');

    //         const requestBody = {
    //             name: order.shipping_address.first_name + ' ' + order.shipping_address.last_name,
    //             phone: order.shipping_address.phone,
    //             phone2: '',
    //             cod_charge: '0',
    //             address: fullAddress,
    //             fbranch: order.shipping_address.postal_code,  // Customer location as origin
    //             branch: process.env.NCM_DEFAULT_CREATION || 'TINKUNE',  // Store location as destination
    //             package: `RETURN: ${packageDescription}`,
    //             vref_id: `RET-${order.id.slice(-7)}`,
    //             instruction: order.shipping_address.address_2 || 'Return Order'
    //         };

    //         shouldLog && logData && console.log(`-> Inside createReturn method we are making requestBody for NCM as: \n`);
    //         shouldLog && logData && console.log(requestBody);

    //         const response = await fetch(`${baseUrl}/api/v1/order/create`, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Token ${apiToken}`,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(requestBody)
    //         });

    //         if (!response.ok) {
    //             const errorData = await response.json().catch(() => null);
    //             throw new Error(`Failed to create NCM return order: ${errorData?.message || response.statusText}`);
    //         }

    //         const ncmResponse = await response.json();

    //         shouldLog && logData && console.log(`-> Inside createReturn method we are getting ncmResponse from NCM as: \n`);
    //         shouldLog && logData && console.log(ncmResponse);

    //         return {
    //             id: ncmResponse.orderid || 'ncm-fulfillment-return',
    //             ...ncmResponse,
    //             is_return: true
    //         };

    //     } catch (error) {
    //         console.error('Error creating NCM return:', error);
    //         throw error;
    //     }
    // }

    async createReturn(
        returnOrder: CreateReturnType
    ): Promise<Record<string, unknown>> {
        shouldLog && console.log(`createReturn method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside createReturn method we are getting returnOrder as: \n`);
        shouldLog && logData && console.log(returnOrder);
    
        try {
            // Fetch complete order details first
            const order = await this.orderService_.retrieve(returnOrder.order_id, {
                relations: ['fulfillments'],
            });
    
            // Find NCM fulfillment
            const ncmFulfillment = order.fulfillments?.find(
                f => f.provider_id === "ncm-fullfillment" && f.data?.orderid
            );
    
            if (!ncmFulfillment?.data?.orderid) {
                throw new Error('NCM order ID not found');
            }
    
            const baseUrl = process.env.NCM_BASE_URL || 'https://demo.nepalcanmove.com';
            const apiToken = process.env.NCM_API_KEY;
    
            if (!apiToken) {
                throw new Error('NCM API token is not configured');
            }
    
            // Create return comment
            const returnItems = returnOrder.items
                .map(item => `${item.item.title} x${item.quantity}`)
                .join(', ');
    
            const commentText = `Return requested for: ${returnItems}`;
    
            const response = await fetch(`${baseUrl}/api/v1/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderid: ncmFulfillment.data.orderid,
                    comments: commentText
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`Failed to create NCM return comment: ${errorData?.message || response.statusText}`);
            }
    
            const commentResponse = await response.json();
    
            shouldLog && logData && console.log(`-> Inside createReturn method, posted comment response from NCM: \n`);
            shouldLog && logData && console.log(commentResponse);
    
            // Return original NCM order data plus return flag
            return {
                ...ncmFulfillment.data,
                is_return: true
            };
    
        } catch (error) {
            console.error('Error creating NCM return comment:', error);
            throw error;
        }
    }
    
    // Do nothing here
    // NCM doesnt have api for this
    async getFulfillmentDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log(`getFulfillmentDocuments method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside getFulfillmentDocuments method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async getReturnDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log(`getReturnDocuments method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside getReturnDocuments method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async getShipmentDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        shouldLog && console.log(`getShipmentDocuments method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside getShipmentDocuments method we are getting data as: \n`);
        shouldLog && logData && console.log(data);
        return {}
    }

    // Do nothing here
    // NCM doesnt have api for this
    async retrieveDocuments(
        fulfillmentData: Record<string, unknown>,
        documentType: "invoice" | "label"
    ): Promise<any> {
        shouldLog && console.log(`retrieveDocuments method has been called.\n`);
        shouldLog && logData && console.log(`-> Inside retrieveDocuments method we are getting fulfillmentData as: \n`);
        shouldLog && logData && console.log(fulfillmentData);
        shouldLog && logData && console.log(`-> Inside retrieveDocuments method we are getting documentType as: \n`);
        shouldLog && logData && console.log(documentType);
        return {}
    }
}

export default NcmFullfillmentService