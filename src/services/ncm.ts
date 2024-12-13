//src/services/ncm.ts
import {
    TransactionBaseService,
} from "@medusajs/medusa"
import {
    NCMBulkCommentsResponse,
    NCMOrderDetails,
    NCMOrderStatus,
    NCMComment
} from "../types/ncm"

class NCMService extends TransactionBaseService {
    protected readonly NCM_API_URL: string
    protected readonly NCM_API_KEY: string

    constructor(container) {
        super(container)
        this.NCM_API_URL = process.env.NCM_API_URL || "https://demo.nepalcanmove.com/api/v1"
        this.NCM_API_KEY = process.env.NCM_API_KEY || ""
    }

    async getBulkComments(): Promise<NCMBulkCommentsResponse> {
        if (!this.NCM_API_KEY) {
            throw new Error("NCM API key is not configured")
        }

        try {
            const response = await fetch(`${this.NCM_API_URL}/order/getbulkcomments`, {
                headers: {
                    Authorization: `Token ${this.NCM_API_KEY}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`NCM API error: ${response.statusText}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(`Failed to fetch NCM comments: ${error.message}`)
        }
    }

    async getOrder(id: string): Promise<NCMOrderDetails> {
        if (!this.NCM_API_KEY) {
            throw new Error("NCM API key is not configured")
        }

        try {
            const response = await fetch(`${this.NCM_API_URL}/order?id=${id}`, {
                headers: {
                    Authorization: `Token ${this.NCM_API_KEY}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`NCM API error: ${response.statusText}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(`Failed to fetch NCM order: ${error.message}`)
        }
    }

    async getOrderComments(id: string): Promise<NCMComment[]> {
        if (!this.NCM_API_KEY) {
            throw new Error("NCM API key is not configured")
        }

        try {
            const response = await fetch(`${this.NCM_API_URL}/order/comment?id=${id}`, {
                headers: {
                    Authorization: `Token ${this.NCM_API_KEY}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`NCM API error: ${response.statusText}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(`Failed to fetch NCM comments: ${error.message}`)
        }
    }

    async getOrderStatus(id: string): Promise<NCMOrderStatus[]> {
        if (!this.NCM_API_KEY) {
            throw new Error("NCM API key is not configured")
        }

        try {
            const response = await fetch(`${this.NCM_API_URL}/order/status?id=${id}`, {
                headers: {
                    Authorization: `Token ${this.NCM_API_KEY}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`NCM API error: ${response.statusText}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(`Failed to fetch NCM status: ${error.message}`)
        }
    }

    async createComment(orderId: string, comment: string): Promise<void> {
        if (!this.NCM_API_KEY) {
            throw new Error("NCM API key is not configured")
        }

        try {
            const response = await fetch(`${this.NCM_API_URL}/comment`, {
                method: 'POST',
                headers: {
                    Authorization: `Token ${this.NCM_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderid: orderId,
                    comments: comment
                })
            })

            if (!response.ok) {
                throw new Error(`NCM API error: ${response.statusText}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(`Failed to create NCM comment: ${error.message}`)
        }
    }
}

export default NCMService