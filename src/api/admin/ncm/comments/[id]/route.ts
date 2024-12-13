// src/api/admin/ncm/comments/[id]/route.ts
import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import NCMService from "../../../../../services/ncm"

interface CommentRequestBody {
    comments: string
}

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<MedusaResponse> {
    const ncmService: NCMService = req.scope.resolve("ncmService")
    const { id } = req.params

    try {
        const comments = await ncmService.getOrderComments(id)
        return res.status(200).json(comments)
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to fetch NCM comments"
        })
    }
}

export async function POST(
    req: MedusaRequest<CommentRequestBody>,
    res: MedusaResponse
): Promise<MedusaResponse> {
    const ncmService: NCMService = req.scope.resolve("ncmService")
    const { id } = req.params
    const { comments } = req.body as CommentRequestBody

    if (!comments) {
        return res.status(400).json({
            message: "Comment text is required"
        })
    }

    try {
        await ncmService.createComment(id, comments)
        return res.status(200).json({
            message: "Comment created successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to create comment"
        })
    }
}