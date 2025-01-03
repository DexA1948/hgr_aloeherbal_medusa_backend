// src/api/admin/customers/export/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { CustomerService } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const customerService: CustomerService = req.scope.resolve("customerService")
    const query = req.query

    // Only include relations that were explicitly requested
    const relations: string[] = []
    if (query.shipping_addresses === "true") relations.push("shipping_addresses")
    if (query.billing_address === "true") relations.push("billing_address")
    if (query.groups === "true") relations.push("groups")

    let filterableFields: Record<string, any> = {}

    // Hey claude, this will be new params which will work as filters
    // Old params are additional fields to be shown in the export
    if (query.filter_has_account === "true") {
        filterableFields.has_account = true
    }

    if (query.start_date && query.end_date) {
        filterableFields.created_at = {
            gte: query.start_date,
            lte: query.end_date
        }
    }

    try {
        const customers = await customerService.list(filterableFields, {
            relations,
            take: 1000,
            skip: 0
        })

        const csvData = customers.map((customer) => {
            const data: Record<string, any> = {
                "Customer ID": customer.id,
                "Email": customer.email,
                "First Name": customer.first_name || "",
                "Last Name": customer.last_name || "",
                "Phone": customer.phone || "",
                "Created At": new Date(customer.created_at).toLocaleDateString()
            }

            // Only add address/group data if relations were requested
            if (query.has_account === "true") {
                data[ "Has Account"] = getFullAddress(customer.has_account)
            }

            if (query.billing_address === "true") {
                data["Billing Address"] = getFullAddress(customer.billing_address)
            }

            if (query.shipping_addresses === "true") {
                data["Shipping Addresses"] = customer.shipping_addresses
                    ?.map(getFullAddress)
                    .join("; ") || ""
            }

            if (query.groups === "true") {
                data["Groups"] = customer.groups
                    ?.map(g => g.name)
                    .join("; ") || ""
            }

            return data
        })

        if (csvData.length === 0) {
            return res.status(404).json({ message: "No customers found" })
        }

        const headers = Object.keys(csvData[0])
        const csv = [
            headers.join(","),
            ...csvData.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header]
                        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
                            return `"${value.replace(/"/g, '""')}"`
                        }
                        return value
                    })
                    .join(",")
            ),
        ].join("\n")

        res.setHeader("Content-Type", "text/csv")
        res.setHeader("Content-Disposition", 'attachment; filename="customers-export.csv"')

        return res.send(csv)

    } catch (error) {
        console.error("Error exporting customers:", error)
        return res.status(500).json({
            message: "An error occurred while exporting customers",
            error: error.message
        })
    }
}


// Helper function moved outside
const getFullAddress = (address: any): string => {
    if (!address) return ""
    return `${address.address_1}${address.address_2 ? `, ${address.address_2}` : ""}, ${address.city}, ${address.postal_code}, ${address.country_code}`
}