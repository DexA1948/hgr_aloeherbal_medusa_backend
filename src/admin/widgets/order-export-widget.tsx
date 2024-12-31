// src/admin/widgets/order-export-widget.tsx
import React, { useState } from "react"
import {
    useAdminOrders,
} from "medusa-react"
import {
    Button,
    Container,
    IconButton,
    Tooltip,
} from "@medusajs/ui"
import {
    ArrowDownTray,
} from "@medusajs/icons"
import { exportOrders } from "../helpers/order-export"

const OrderExportWidget = () => {
    const [isExporting, setIsExporting] = useState(false)
    const { orders = [] } = useAdminOrders({
        limit: 1000,
        offset: 0,
        expand: "customer,shipping_address,billing_address,items,items.variant,items.variant.product,payments"
    })

    const handleExport = async () => {
        setIsExporting(true)
        try {
            await exportOrders(orders)
        } catch (error) {
            console.error("Failed to export orders:", error)
        }
        setIsExporting(false)
    }

    return (
        <Container>
            <div className="flex items-center gap-2">
                <Tooltip content="Export Orders">
                    <Button
                        variant="secondary"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        <ArrowDownTray className="mr-2" />
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