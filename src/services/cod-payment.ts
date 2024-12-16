// import {
//   AbstractPaymentProcessor,
//   PaymentProcessorContext,
//   PaymentProcessorError,
//   PaymentProcessorSessionResponse,
//   PaymentSessionStatus,
// } from "@medusajs/medusa"
// import { EOL } from "os"
// import { MedusaError } from "@medusajs/utils"

// class CashOnDeliveryService extends AbstractPaymentProcessor {
//   static identifier = "cod-payment"

//   constructor(container, options) {
//     super(container)
//   }

//   async capturePayment(
//     paymentSessionData: Record<string, unknown>
//   ): Promise<Record<string, unknown> | PaymentProcessorError> {
//     return {
//       ...paymentSessionData,
//       status: PaymentSessionStatus.AUTHORIZED,
//     }
//   }

//   async authorizePayment(
//     paymentSessionData: Record<string, unknown>,
//     context: Record<string, unknown>
//   ): Promise<
//     | PaymentProcessorError
//     | { status: PaymentSessionStatus; data: Record<string, unknown> }
//   > {
//     try {
//       return {
//         status: PaymentSessionStatus.AUTHORIZED,
//         data: paymentSessionData,
//       }
//     } catch (error) {
//       throw new MedusaError(
//         MedusaError.Types.INVALID_DATA,
//         "Authorization failed"
//       )
//     }
//   }

//   async cancelPayment(
//     paymentSessionData: Record<string, unknown>
//   ): Promise<Record<string, unknown> | PaymentProcessorError> {
//     return {
//       ...paymentSessionData,
//       status: PaymentSessionStatus.CANCELED,
//     }
//   }

//   async initiatePayment(
//     context: PaymentProcessorContext
//   ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
//     try {
//       const { amount, currency_code, resource_id, customer } = context

//       return {
//         session_data: {
//           amount,
//           resource_id,
//           currency_code,
//           status: PaymentSessionStatus.AUTHORIZED,
//           customer_id: customer?.id,
//         },
//       }
//     } catch (error) {
//       throw new MedusaError(
//         MedusaError.Types.INVALID_DATA,
//         "Payment initiation failed"
//       )
//     }
//   }

//   async deletePayment(
//     paymentSessionData: Record<string, unknown>
//   ): Promise<Record<string, unknown> | PaymentProcessorError> {
//     return {
//       ...paymentSessionData,
//       status: PaymentSessionStatus.CANCELED,
//     }
//   }

//   async getPaymentStatus(
//     paymentSessionData: Record<string, unknown>
//   ): Promise<PaymentSessionStatus> {
//     return PaymentSessionStatus.AUTHORIZED
//   }

//   // In your manual payment provider
//   async refundPayment(
//     paymentSessionData: Record<string, unknown>,
//     refundAmount: number
//   ): Promise<Record<string, unknown> | PaymentProcessorError> {
//     return {
//       id: paymentSessionData.id,
//       refunded_amount: refundAmount,
//       status: "requires_action",
//       data: {
//         manual_refund_required: true,
//         provider: "manual"
//       }
//     }
//   }

//   async retrievePayment(
//     paymentSessionData: Record<string, unknown>
//   ): Promise<Record<string, unknown> | PaymentProcessorError> {
//     return paymentSessionData
//   }

//   async updatePayment(
//     context: PaymentProcessorContext
//   ): Promise<void | PaymentProcessorError | PaymentProcessorSessionResponse> {
//     try {
//       const { amount, currency_code, resource_id, customer } = context

//       return {
//         session_data: {
//           amount,
//           resource_id,
//           currency_code,
//           status: PaymentSessionStatus.AUTHORIZED,
//           customer_id: customer?.id,
//         },
//       }
//     } catch (error) {
//       throw new MedusaError(
//         MedusaError.Types.INVALID_DATA,
//         "Update payment failed"
//       )
//     }
//   }

//   async updatePaymentData(
//     sessionId: string,
//     data: Record<string, unknown>
//   ): Promise<Record<string, unknown> | PaymentProcessorError> {
//     try {
//       return {
//         ...data,
//         id: sessionId,
//       }
//     } catch (error) {
//       throw new MedusaError(
//         MedusaError.Types.INVALID_DATA,
//         "Update payment data failed"
//       )
//     }
//   }
// }

// export default CashOnDeliveryService