//File: src\api\admin\ncm\route.ts

import type {
    MedusaRequest,
    MedusaResponse
} from "@medusajs/medusa"
import NCMService from "../../../services/ncm"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const ncmService: NCMService = req.scope.resolve("ncmService")
    // console.log("You are in api/admin/ncm/route.ts");

    try {
        const comments = await ncmService.getBulkComments()
        res.status(200).json({ comments })
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to fetch NCM comments"
        })
    }
}