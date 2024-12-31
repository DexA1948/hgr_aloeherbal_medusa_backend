// src/api/admin/orders/export/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { OrderService } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderService: OrderService = req.scope.resolve("orderService")

  const orders = await orderService.list(
    {},
    {
      relations: [
        "shipping_address",
        "items",
        "items.variant",
        "items.variant.product",
        "payments",
        "fulfillments"
      ],
      take: 1000,
      skip: 0
    }
  )

  const csvData = orders.map((order) => {
    // Get NCM order ID if available
    const ncmFulfillment = order.fulfillments?.find(f => f.provider_id === "ncm-fullfillment")
    const ncmOrderId = ncmFulfillment?.data?.id || "N/A"

    const getFullAddress = (address) => {
      if (!address) return ""
      return `${address.address_1}${address.address_2 ? `, ${address.address_2}` : ""}, ${address.city}, ${address.postal_code}, ${address.country_code}`
    }

    const getProductsList = () => {
      return order.items
        .map((item) => {
          return `${item.title} (x${item.quantity})`
        })
        .join(", ")
    }

    return {
      "Order ID": order.id,
      "NCM Order ID": ncmOrderId,
      "Order Date": new Date(order.created_at).toLocaleDateString(),
      "Shipping Name": `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim(),
      "Shipping Address": getFullAddress(order.shipping_address),
      "Shipping Contact": order.shipping_address?.phone || "",
      "Ordered Products": getProductsList(),
      "Amount": `${order.total / 100} ${order.currency_code.toUpperCase()}`,
      "Payment Method": order.payments?.[0]?.provider_id || "N/A",
      "Order Status": order.status,
      "Payment Status": order.payment_status
    }
  })

  // Convert to CSV
  const headers = Object.keys(csvData[0])
  const csv = [
    headers.join(","),
    ...csvData.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(",")
    ),
  ].join("\n")

  res.attachment("orders-export.csv")
  res.set("Content-Type", "text/csv")
  res.send(csv)
}