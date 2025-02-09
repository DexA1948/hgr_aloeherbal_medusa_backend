import React, { useEffect, useState } from "react"
import type { WidgetConfig, DiscountDetailsWidgetProps } from "@medusajs/admin"
import { useAdminOrders } from "medusa-react"
import { Container, Text, Heading } from "@medusajs/ui"
import { CashSolid } from "@medusajs/icons"

const DiscountSalesWidget = ({ discount }: DiscountDetailsWidgetProps) => {
  const [totalSales, setTotalSales] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  const { 
    orders, 
    isLoading,
  } = useAdminOrders({
    limit: 100,
    offset: 0,
    expand: "discounts,items",  // Changed to comma-separated string
  })

  useEffect(() => {
    if (!orders?.length) return

    // Filter orders that used this discount
    const ordersWithDiscount = orders.filter((order) => 
      order.discounts?.some(d => d.id === discount.id)
    )

    // Calculate total sales from filtered orders
    const sales = ordersWithDiscount.reduce((acc, order) => {
      // Sum up refundable amount from all items
      const orderTotal = order.items.reduce((itemsTotal, item) => {
        return itemsTotal + (item.refundable || 0)
      }, 0)
      
      return acc + orderTotal
    }, 0)

    setTotalSales(sales)
    setTotalOrders(ordersWithDiscount.length)
  }, [orders, discount.id])

  return (
    <Container className="px-6 py-4">
      <div className="flex flex-col gap-y-3">
        <div className="flex items-center gap-x-2">
          <CashSolid className="text-ui-fg-subtle" />
          <Heading>Discount Usage</Heading>
        </div>

        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <Text className="text-ui-fg-subtle">Total Order Value</Text>
            <Text className="text-ui-fg-base">
              {(totalSales / 100).toFixed(2)} {discount.regions?.[0]?.currency_code?.toUpperCase() || "NPR"}
            </Text>
          </div>
          
          <div className="flex items-center justify-between">
            <Text className="text-ui-fg-subtle">Orders Using Discount</Text>
            <Text className="text-ui-fg-base">
              {totalOrders} order{totalOrders !== 1 ? "s" : ""}
            </Text>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config: WidgetConfig = {
  zone: "discount.details.after",
}

export default DiscountSalesWidget