// File: src/services/ncm-fullfillment.ts

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
import { MedusaError } from "@medusajs/utils"

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
        try {
            shouldLog && console.log(`getFulfillmentOptions method has been called.\n`);
            return [
                {
                    id: "ncm-fulfillment"
                },
                {
                    id: "ncm-fulfillment-return"
                },
            ]
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside getFulfillmentOptions method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while getting fulfillment options",
                "NCM_GET_OPTIONS_ERROR",
                error.message
            )
        }
    }

    async validateFulfillmentData(
        optionData: Record<string, unknown>,
        data: Record<string, unknown>,
        cart: Cart
    ): Promise<Record<string, unknown>> {
        try {
            shouldLog && console.log(`validateFulfillmentData method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside validateFulfillmentData method we are getting optionData as: \n`);
            shouldLog && logData && console.log(optionData);
            shouldLog && logData && console.log(`-> Inside validateFulfillmentData method we are getting data as: \n`);
            shouldLog && logData && console.log(data);
            shouldLog && logData && console.log(`-> Inside validateFulfillmentData method we are getting cart as: \n`);
            shouldLog && logData && console.log(cart);

            // Basic fulfillment option validation
            if (optionData.id !== "ncm-fulfillment" && optionData.id !== "ncm-fulfillment-return") {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Invalid fulfillment option",
                    "NCM_INVALID_OPTION"
                )
            }

            // Postal code validation - throw error directly, don't wrap it
            // if (optionData.id === "ncm-fulfillment" && !cart?.shipping_address?.postal_code) {
            //     throw new MedusaError(
            //         MedusaError.Types.INVALID_DATA,
            //         "Shipping postal code is required",
            //         "NCM_MISSING_POSTAL_CODE"
            //     )
            // }

            // If all validations pass, return the data
            return {
                ...data,
            }

        } catch (error) {
            shouldLog && logData && console.log(`-> Inside validateFulfillmentData method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An unexpected error occurred during validation",
                "NCM_VALIDATION_ERROR",
                error.message
            )
        }
    }

    async validateOption(
        data: Record<string, unknown>
    ): Promise<boolean> {
        try {
            shouldLog && console.log(`validateOption method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside validateOption method we are getting data as: \n`);
            shouldLog && logData && console.log(data);

            if (!data.id) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Fulfillment option ID is required",
                    "NCM_MISSING_OPTION_ID"
                )
            }

            return data.id === "ncm-fulfillment" || data.id === "ncm-fulfillment-return"
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside validateOption method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "An error occurred while validating option",
                "NCM_VALIDATE_OPTION_ERROR",
                error.message
            )
        }
    }

    async canCalculate(
        data: Record<string, unknown>
    ): Promise<boolean> {
        try {
            shouldLog && console.log(`canCalculate method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside canCalculate method we are getting data as: \n`);
            shouldLog && logData && console.log(data);
            return true
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside canCalculate method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred in rate calculation check",
                "NCM_CALCULATE_CHECK_ERROR",
                error.message
            )
        }
    }

    async calculatePrice(
        optionData: Record<string, any>,
        data: Record<string, any>,
        cart: Cart
    ): Promise<number> {
        try {
            shouldLog && console.log(`calculatePrice method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside calculatePrice method we are getting optionData as: \n`);
            shouldLog && logData && console.log(optionData);
            shouldLog && logData && console.log(`-> Inside calculatePrice method we are getting data as: \n`);
            shouldLog && logData && console.log(data);
            shouldLog && logData && console.log(`-> Inside calculatePrice method we are getting cart as: \n`);
            shouldLog && logData && console.log(cart);

            const isReturn = optionData.id === "ncm-fulfillment-return";
            const destination = isReturn
                ? process.env.NCM_DEFAULT_CREATION || 'TINKUNE'
                : cart.shipping_address?.postal_code;

            if (!destination) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Postal code is required for shipping rate calculation",
                    "NCM_MISSING_POSTAL_CODE"
                )
            }

            const baseUrl = process.env.NCM_BASE_URL;
            if (!baseUrl) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "NCM base URL is not configured",
                    "NCM_MISSING_CONFIG"
                )
            }

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
                throw new MedusaError(
                    MedusaError.Types.UNEXPECTED_STATE,
                    "Failed to fetch shipping rate from NCM",
                    "NCM_RATE_FETCH_ERROR"
                )
            }

            const rateData = await response.json();
            shouldLog && logData && console.log(`Rate data:`, rateData);

            return rateData.charge * 100 || 30000;

        } catch (error) {
            shouldLog && logData && console.log(`-> Inside calculatePrice method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while calculating price",
                "NCM_CALCULATE_ERROR",
                error.message
            )
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
            const baseUrl = process.env.NCM_BASE_URL;
            const apiToken = process.env.NCM_API_KEY;

            if (!apiToken) {
                throw new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    'NCM API token is not configured',
                    'NCM_MISSING_API_KEY'
                )
            }

            if (order.payments[0].provider_id == "esewa-payment" && order.payment_status == "awaiting") {
                throw new MedusaError(
                    MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
                    'For eSewa orders, payment must be captured before creating fulfillment',
                    'NCM_PAYMENT_PENDING'
                )
            }

            const fullAddress = [
                order.shipping_address.address_1,
                order.shipping_address.company,
                order.shipping_address.city,
                order.shipping_address.province,
                order.shipping_address.postal_code
            ]
                .filter(Boolean)
                .join(', ');

            // Function to create package description
            const createPackageDescription = (items: LineItem[]): string => {
                // Helper function to abbreviate product names
                const getProductAbbreviation = (title: string): string => {
                    return title
                        .split(' ')
                        .map(word => word.slice(0, 2))
                        .map(letters => letters.charAt(0).toUpperCase() + letters.charAt(1).toLowerCase())
                        .join('');
                };

                // Example: items = [
                //   { title: "Face Wash", quantity: 1 },
                //   { title: "Sunscreen", quantity: 2 }
                // ]

                // First attempt: Create description with full titles
                // Result: "Face Wash x1, Sunscreen x2"
                const fullTitleDescription = items
                    .map(item => `${item.title} x${item.quantity}`)
                    .join(', ');

                // If full titles version is under 100 chars, use it
                if (fullTitleDescription.length <= 100) {
                    return fullTitleDescription;
                }

                // If full titles too long, create abbreviated version
                // Example: turns "Face Wash" into "FaWa", "Sunscreen" into "Su"
                // Result: "FaWa x1, Su x2"
                const abbreviatedDescription = items
                    .map(item => `${getProductAbbreviation(item.title)} x${item.quantity}`)
                    .join(', ');

                // If even abbreviated version is too long, truncate it
                if (abbreviatedDescription.length > 100) {
                    return abbreviatedDescription.slice(0, 90) + '... more';
                }

                return abbreviatedDescription;
            };

            const packageDescription = createPackageDescription(items);

            // Function to clean and validate phone numbers
            const cleanAndValidatePhone = (phone: string, fieldName: string): string => {
                if (!phone) return '';
                const cleaned = phone.replace(/^\+977-?/, '');

                // Check if the cleaned number is exactly 10 digits
                if (cleaned !== '' && !/^\d{10}$/.test(cleaned)) {
                    throw new MedusaError(
                        MedusaError.Types.INVALID_DATA,
                        `Invalid ${fieldName}: must be exactly 10 digits after removing +977 prefix`,
                        'NCM_INVALID_PHONE'
                    );
                }

                return cleaned;
            };

            const mainPhone = cleanAndValidatePhone(order.shipping_address.phone, 'phone number');

            const requestBody = {
                name: order.shipping_address.first_name + ' ' + order.shipping_address.last_name,
                phone: mainPhone,
                phone2: '',
                cod_charge: order.payments[0].provider_id == "manual" ? order.total / 100 : '0',
                address: fullAddress,
                fbranch: process.env.NCM_DEFAULT_CREATION || 'TINKUNE',
                branch: order.shipping_address.postal_code,
                package: packageDescription,
                vref_id: order.id.slice(-7),
                instruction: order.shipping_address.address_2 || ''
            };

            shouldLog && logData && console.log(`-> Inside createFulfillment method we are creating requestBody as: \n`);
            console.log('Request body: ', requestBody);

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
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    `Failed to create NCM order: ${errorData?.message || response.statusText}`,
                    'NCM_CREATE_ERROR'
                )
            }

            const ncmResponse = await response.json();

            return {
                id: ncmResponse.orderid || 'ncm-fulfillment',
                ...ncmResponse
            };

        } catch (error) {
            shouldLog && logData && console.log(`-> Inside createFulfillment method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                error.message || "An unknown error occurred while creating NCM fulfillment",
                "NCM_CREATE_ERROR"
            )
        }
    }

    async cancelFulfillment(
        fulfillment: Record<string, unknown>
    ): Promise<any> {
        try {
            shouldLog && console.log(`cancelFulfillment method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside cancelFulfillment method we are getting fulfillment as: \n`);
            shouldLog && logData && console.log(fulfillment);

            throw new MedusaError(
                MedusaError.Types.NOT_ALLOWED,
                "NCM fulfillments cannot be cancelled through the API",
                "NCM_CANCEL_NOT_SUPPORTED"
            )
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside cancelFulfillment method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while canceling fulfillment",
                "NCM_CANCEL_ERROR",
                error.message
            )
        }
    }

    async createReturn(
        returnOrder: CreateReturnType
    ): Promise<Record<string, unknown>> {
        try {
            shouldLog && console.log(`createReturn method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside createReturn method we are getting returnOrder as: \n`);
            shouldLog && logData && console.log(returnOrder);

            // Get order_id either directly or from swap
            const orderId = returnOrder.order_id || returnOrder.swap?.order_id;

            if (!orderId) {
                throw new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    "Order ID not found in return or swap",
                    "NCM_ORDER_NOT_FOUND"
                )
            }

            const order = await this.orderService_.retrieve(orderId, {
                relations: ['fulfillments'],
            });

            const ncmFulfillment = order.fulfillments?.find(
                f => f.provider_id === "ncm-fullfillment" && f.data?.orderid
            );

            if (!ncmFulfillment?.data?.orderid) {
                throw new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    "NCM order ID not found",
                    "NCM_ORDER_NOT_FOUND"
                )
            }

            const baseUrl = process.env.NCM_BASE_URL;
            const apiToken = process.env.NCM_API_KEY;

            if (!apiToken) {
                throw new MedusaError(
                    MedusaError.Types.NOT_FOUND,
                    "NCM API token is not configured",
                    "NCM_MISSING_API_KEY"
                )
            }

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
                throw new MedusaError(
                    MedusaError.Types.UNEXPECTED_STATE, "Failed to create NCM return comment",
                    "NCM_RETURN_COMMENT_ERROR"
                )
            }

            return {
                ...ncmFulfillment.data,
                is_return: true
            };

        } catch (error) {
            shouldLog && logData && console.log(`-> Inside createReturn method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while creating return",
                "NCM_RETURN_ERROR",
                error.message
            )
        }
    }

    async getFulfillmentDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        try {
            shouldLog && console.log(`getFulfillmentDocuments method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside getFulfillmentDocuments method we are getting data as: \n`);
            shouldLog && logData && console.log(data);

            throw new MedusaError(
                MedusaError.Types.NOT_ALLOWED,
                "Document retrieval is not supported by NCM",
                "NCM_DOCUMENTS_NOT_SUPPORTED"
            )
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside getFulfillmentDocuments method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while getting fulfillment documents",
                "NCM_GET_DOCUMENTS_ERROR",
                error.message
            )
        }
    }

    async getReturnDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        try {
            shouldLog && console.log(`getReturnDocuments method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside getReturnDocuments method we are getting data as: \n`);
            shouldLog && logData && console.log(data);

            throw new MedusaError(
                MedusaError.Types.NOT_ALLOWED,
                "Return document retrieval is not supported by NCM",
                "NCM_RETURN_DOCUMENTS_NOT_SUPPORTED"
            )
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside getReturnDocuments method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while getting return documents",
                "NCM_GET_RETURN_DOCUMENTS_ERROR",
                error.message
            )
        }
    }

    async getShipmentDocuments(
        data: Record<string, unknown>
    ): Promise<any> {
        try {
            shouldLog && console.log(`getShipmentDocuments method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside getShipmentDocuments method we are getting data as: \n`);
            shouldLog && logData && console.log(data);

            throw new MedusaError(
                MedusaError.Types.NOT_ALLOWED,
                "Shipment document retrieval is not supported by NCM",
                "NCM_SHIPMENT_DOCUMENTS_NOT_SUPPORTED"
            )
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside getShipmentDocuments method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while getting shipment documents",
                "NCM_GET_SHIPMENT_DOCUMENTS_ERROR",
                error.message
            )
        }
    }

    async retrieveDocuments(
        fulfillmentData: Record<string, unknown>,
        documentType: "invoice" | "label"
    ): Promise<any> {
        try {
            shouldLog && console.log(`retrieveDocuments method has been called.\n`);
            shouldLog && logData && console.log(`-> Inside retrieveDocuments method we are getting fulfillmentData as: \n`);
            shouldLog && logData && console.log(fulfillmentData);
            shouldLog && logData && console.log(`-> Inside retrieveDocuments method we are getting documentType as: \n`);
            shouldLog && logData && console.log(documentType);

            throw new MedusaError(
                MedusaError.Types.NOT_ALLOWED,
                "Document retrieval is not supported by NCM",
                "NCM_RETRIEVE_DOCUMENTS_NOT_SUPPORTED"
            )
        } catch (error) {
            shouldLog && logData && console.log(`-> Inside retrieveDocuments method we are catching error as: \n`);
            shouldLog && logData && console.log(error);

            // If it has MedusaError properties, treat it as a MedusaError
            if (error.type && error.code && error.date) {
                throw error
            }

            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "An error occurred while retrieving documents",
                "NCM_RETRIEVE_DOCUMENTS_ERROR",
                error.message
            )
        }
    }
}

export default NcmFullfillmentService