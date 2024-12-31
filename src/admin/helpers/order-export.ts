// src/admin/helpers/order-export.ts
import { Order } from "@medusajs/medusa"

export const exportOrders = async (orders: Order[]) => {
    const getProductsList = (order: Order) => {
        return order.items
            .map((item) => {
                return `${item.title} (x${item.quantity})`
            })
            .join(", ")
    }

    const getFullAddress = (order: Order) => {
        const address = order.shipping_address
        if (!address) return ""
        return `${address.address_1}${address.address_2 ? `, ${address.address_2}` : ""}, ${address.city}, ${address.postal_code}, ${address.country_code}`
    }

    const getPaymentMethod = (order: Order) => {
        return order.payments?.[0]?.provider_id || "N/A"
    }

    const rows = orders.map((order) => ({
        "Order ID": order.id,
        "Order Date": new Date(order.created_at).toLocaleDateString(),
        "Customer Name": `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim(),
        "Customer Address": getFullAddress(order),
        "Shipping Address": getFullAddress(order),
        "Customer Contact": order.customer?.phone || "",
        "Customer Email": order.customer?.email || "",
        "Ordered Products": getProductsList(order),
        "Amount": `${order.total / 100} ${order.currency_code.toUpperCase()}`,
        "Payment Method": getPaymentMethod(order),
        "Order Status": order.status,
        "Payment Status": order.payment_status
    }))

    // Convert to CSV
    const headers = Object.keys(rows[0])
    const csv = [
        headers.join(","),
        ...rows.map((row) =>
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

    // Download the file
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-export-${new Date().toISOString()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
}