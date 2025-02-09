// src/api/admin/ncm/order/[id]/route.ts
import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import NCMService from "../../../../../services/ncm"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<MedusaResponse> {
    const ncmService: NCMService = req.scope.resolve("ncmService")
    const { id } = req.params

    try {
        const orderDetails = await ncmService.getOrder(id)
        return res.status(200).json(orderDetails)
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to fetch NCM order details"
        })
    }
}