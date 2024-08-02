// src/api/store/esewa/verify/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import EsewaPaymentService from "../../../../services/esewa-payment"

require('dotenv').config();

const shouldLog = process.env.ESEWA_LOGGING_TRUE === 'true';

interface CallbackResultInterface {
    esewaPaymentStatus: string;
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    shouldLog && console.log(`\n/store/esewa/verify/route.ts has been called. \n`);
    shouldLog && console.log(`-> Inside /store/esewa/verify/route.ts, we have received req: MedusaRequest as: \n`);
    // shouldLog && console.log(req);

    const esewaService: EsewaPaymentService = req.scope.resolve("esewaPaymentService")

    try {
        if (!req.body || typeof req.body !== 'object' || !('encodedData' in req.body)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { encodedData } = req.body;
        shouldLog && console.log(`-> Inside /store/esewa/verify/route.ts, we have received {encodedData} as: \n`);
        console.log(encodedData);

        // Use the handleSuccessCallback method to process the payment
        const callbackResult = await esewaService.handleSuccessCallback({ data: encodedData }) as CallbackResultInterface;
        const esewaPaymentStatus = callbackResult.esewaPaymentStatus;

        shouldLog && console.log(`-> Inside /store/esewa/verify/route.ts, we have received response from EsewaPaymentService's handleSuccessCallback as: \n`);
        shouldLog && console.log(callbackResult);

        if (esewaPaymentStatus === 'complete') {
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
        message: "Please use post to get verification response.",
    })
}
