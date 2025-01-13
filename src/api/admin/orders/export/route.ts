// src/api/admin/orders/export/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { OrderService } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderService: OrderService = req.scope.resolve("orderService")

  // Parse query parameters directly from req.query instead of URL
  const query = req.query

  const relations = [
    "shipping_address",
    "items",
    "items.variant",
    "items.variant.product",
    "payments",
    "fulfillments"
  ]

  // Add optional relations based on query params
  if (query.salesChannelId) relations.push("sales_channel")
  if (query.regionName) relations.push("region")
  if (query.cartId) relations.push("cart")

  // Build filter object
  let filterableFields: Record<string, any> = {}
  if (query.start_date && query.end_date) {
    filterableFields.created_at = {
      gte: query.start_date,
      lte: query.end_date
    }
  }

  // Add display ID range filter
  if (query.display_id_from && query.display_id_to) {
    filterableFields.display_id = {
      gte: parseInt(query.display_id_from as string),
      lte: parseInt(query.display_id_to as string)
    }
  }

  // Add status filters
  if (query.status) {
    filterableFields.status = Array.isArray(query.status)
      ? query.status
      : [query.status]
  }

  // Add payment status filters
  if (query.payment_status) {
    filterableFields.payment_status = Array.isArray(query.payment_status)
      ? query.payment_status
      : [query.payment_status]
  }

  // Add fulfillment status filters
  if (query.fulfillment_status) {
    filterableFields.fulfillment_status = Array.isArray(query.fulfillment_status)
      ? query.fulfillment_status
      : [query.fulfillment_status]
  }

  // Add region filters
  if (query.region_id) {
    filterableFields.region_id = Array.isArray(query.region_id)
      ? query.region_id
      : [query.region_id]
  }

  // Add sales channel filters
  if (query.sales_channel_id) {
    filterableFields.sales_channel_id = Array.isArray(query.sales_channel_id)
      ? query.sales_channel_id
      : [query.sales_channel_id]
  }

  try {
    const orders = await orderService.list(filterableFields, {
      relations,
      select: query.subtotal ? ["subtotal"] : undefined,
      take: 1000,
      skip: 0
    })

    const csvData = orders.map((order) => {
      // Helper functions
      const getFullAddress = (address: any): string => {
        if (!address) return ""
        return `${address.address_1}${address.address_2 ? `, ${address.address_2}` : ""}, ${address.city}, ${address.postal_code}, ${address.country_code}`
      }

      const getProductsList = (): string => {
        return order.items
          .map((item: any) => `${item.title} (x${item.quantity})`)
          .join("; ")
      }

      const getVariantSKUs = (): string => {
        return order.items
          .map((item: any) => `${item.variant?.sku || 'N/A'} (x${item.quantity})`)
          .filter((sku: string) => sku !== 'N/A (x0)')
          .join("; ")
      }

      // Get NCM fulfillment data if exists
      const ncmFulfillment = order.fulfillments?.find((f: any) =>
        f.provider_id === "ncm-fullfillment")

      // Base data object
      const data: Record<string, any> = {
        "Order ID": order.id,
        "NCM Order ID": ncmFulfillment?.data?.id || "N/A",
        "Order Date": new Date(order.created_at).toLocaleDateString(),
        "Customer Name": `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim(),
        "Shipping Address": getFullAddress(order.shipping_address),
        "Contact": order.shipping_address?.phone || "",
        "Total Amount": `${(order.total / 100).toFixed(2)} ${order.currency_code.toUpperCase()}`,
        "Payment Method": order.payments?.[0]?.provider_id || "N/A",
        "Order Status": order.status,
        "Payment Status": order.payment_status
      }

      // Add optional fields based on query params
      if (query.subtotal) data["Subtotal"] = (order.subtotal / 100).toFixed(2)
      if (query.shippingTotal) data["Shipping Total"] = (order.shipping_total / 100).toFixed(2)
      if (query.discountTotal) data["Discount Total"] = (order.discount_total / 100).toFixed(2)
      if (query.salesChannelId) data["Sales Channel"] = order.sales_channel?.name || "N/A"
      if (query.regionName) data["Region"] = order.region?.name || "N/A"
      if (query.cartId) data["Cart ID"] = order.cart_id || "N/A"
      if (query.displayId) data["Order Display ID"] = order.display_id || "N/A"
      if (query.shortCodes) data["Product Short Codes"] = getVariantSKUs()
      if (query.productFullNames) data["Product Full Names"] = getProductsList()

      return data
    })

    // Generate CSV
    if (csvData.length === 0) {
      return res.status(404).json({ message: "No orders found" })
    }

    const headers = Object.keys(csvData[0])
    const csv = [
      // Headers row
      headers.join(","),
      // Data rows
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Handle special characters and wrap in quotes if needed
            if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(",")
      ),
    ].join("\n")

    // Set response headers
    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", 'attachment; filename="orders-export.csv"')

    return res.send(csv)

  } catch (error) {
    console.error("Error exporting orders:", error)
    return res.status(500).json({
      message: "An error occurred while exporting orders",
      error: error.message
    })
  }
}