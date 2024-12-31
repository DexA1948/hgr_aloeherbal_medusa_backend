import React, { useEffect, useState } from "react"
import type { WidgetConfig, DiscountDetailsWidgetProps } from "@medusajs/admin"
import { useAdminOrders } from "medusa-react"
import {
    Container,
    Text,
    Heading,
    Badge,
    IconBadge,
} from "@medusajs/ui"
import { CashSolid } from "@medusajs/icons"

const DiscountSalesWidget = ({ discount }: DiscountDetailsWidgetProps) => {
    const [totalSales, setTotalSales] = useState(0)
    const [totalOrders, setTotalOrders] = useState(0)

    const {
        orders = [],
        isLoading,
        count,
    } = useAdminOrders({
        limit: 50,
        offset: 0,
        expand: "discounts",
    })

    useEffect(() => {
        if (!orders) return

        // Filter orders that used this discount
        const ordersWithDiscount = orders.filter((order) =>
            order.discounts?.some(d => d.id === discount.id)
        )

        // Calculate total sales from filtered orders
        const sales = ordersWithDiscount.reduce((acc, order) => {
            return acc + (order.total || 0)
        }, 0)

        setTotalSales(sales)
        setTotalOrders(ordersWithDiscount.length)
    }, [orders, discount.id])

    if (isLoading) {
        return (
            <Container>
                <Text>Loading sales data...</Text>
            </Container>
        )
    }

    return (
        <Container className="p-4">
            <div className="flex flex-col gap-y-4">
                <div className="flex items-center gap-x-2">
                    <IconBadge>
                        <CashSolid />
                    </IconBadge>
                    <Heading>Discount Usage</Heading>
                </div>

                <div className="flex flex-col gap-y-2">
                    <div className="flex items-center justify-between">
                        <Text>Total Order Value</Text>
                        <Text className="font-semibold">
                            {(totalSales / 100).toFixed(2)} {discount.regions?.[0]?.currency_code?.toUpperCase()}
                        </Text>
                    </div>

                    <div className="flex items-center justify-between">
                        <Text>Orders Using Discount</Text>
                        <Badge>
                            {totalOrders} order{totalOrders !== 1 ? "s" : ""}
                        </Badge>
                    </div>

                    {count > 50 && (
                        <Text className="text-ui-fg-subtle text-sm">
                            Showing data from first 50 orders. Total orders: {count}
                        </Text>
                    )}
                </div>
            </div>
        </Container>
    )
}

export const config: WidgetConfig = {
    zone: "discount.details.after",
}

export default DiscountSalesWidget