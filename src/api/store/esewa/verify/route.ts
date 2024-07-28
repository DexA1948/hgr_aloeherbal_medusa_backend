// src/api/store/esewa/verify/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import EsewaPaymentService from "../../../../services/esewa-payment"

interface CallbackResultInterface {
    status: string;
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const esewaService: EsewaPaymentService = req.scope.resolve("esewaPaymentService")

    try {
        if (!req.body || typeof req.body !== 'object' || !('encodedData' in req.body)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { encodedData } = req.body;

        // Use the handleSuccessCallback method to process the payment
        const callbackResult = await esewaService.handleSuccessCallback({ data: encodedData }) as CallbackResultInterface;
        const status = callbackResult.status;
        console.log("Esewa Callback Result:\n",callbackResult);
        console.log("Esewa Callback Status:\n",status);
        if (status === 'complete') {
            res.status(200).json({ ...callbackResult, })
        } else {
            res.status(400).json({ ...callbackResult })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const GET = (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    res.json({
        message: "[GET] Hello world!",
    })
}
