// src/admin/widgets/order-export-widget.tsx
import React, { useState } from "react"
import {
    Button,
    Text,
    Container,
    Tooltip,
} from "@medusajs/ui"
import { ArrowUpTray } from "@medusajs/icons"

const OrderExportWidget = () => {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL || "/api"
            window.location.href = `${baseUrl}/admin/orders/export`
        } catch (error) {
            console.error("Failed to export orders:", error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Container>
            <div className="flex items-center justify-between">
                <Text className="text-ui-fg-subtle">
                    For a detailed view of orders, please export using this channel:
                </Text>
                <Tooltip content="Export Orders">
                    <Button
                        variant="secondary"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        <ArrowUpTray className="mr-2" />
                        {isExporting ? "Exporting..." : "Export Orders"}
                    </Button>
                </Tooltip>
            </div>
        </Container>
    )
}

export const config = {
    zone: "order.list.before",
}

export default OrderExportWidget