// src/api/admin/ncm/status/[id]/route.ts
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
      const statuses = await ncmService.getOrderStatus(id)
      return res.status(200).json(statuses)
    } catch (error) {
      return res.status(500).json({
        message: error.message || "Failed to fetch NCM status"
      })
    }
  }