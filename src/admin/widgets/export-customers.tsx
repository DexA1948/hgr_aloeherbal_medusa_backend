import React, { useState } from 'react'
import { Input, Button, Select, usePrompt } from "@medusajs/ui"
import Papa from 'papaparse'
import { useAdminCustomers } from "medusa-react"
import _ from 'lodash'
import type {
    WidgetConfig
} from "@medusajs/admin"

const ExportCustomersWidget = () => {
    const [fileName, setFileName] = useState("customers-export")
    const [fileFormat, setFileFormat] = useState("csv")
    const [isExporting, setIsExporting] = useState(false)
    const dialog = usePrompt()

    const { customers, isLoading } = useAdminCustomers({
        limit: 100,
        offset: 0
    })

    const handleExport = async () => {
        try {
            setIsExporting(true)

            const confirmed = await dialog({
                title: "Export Customers",
                description: "Are you sure you want to export customer data?",
                variant: "confirmation"
            })

            if (!confirmed) {
                setIsExporting(false)
                return
            }

            const exportData = customers?.map(customer => ({
                id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                phone: customer.phone,
                created_at: new Date(customer.created_at).toLocaleString(),
                orders_count: customer.orders?.length || 0,
                has_account: customer.has_account
            }))

            if (fileFormat === "csv") {
                const csv = Papa.unparse(exportData || [])
                downloadFile(csv, `${fileName}.csv`, 'text/csv')
            } else {
                const json = JSON.stringify(exportData, null, 2)
                downloadFile(json, `${fileName}.json`, 'application/json')
            }

        } catch (error) {
            console.error("Export failed:", error)
        } finally {
            setIsExporting(false)
        }
    }

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
    }

    return (
        <div className="bg-white p-8 border border-gray-200 rounded-lg">
            <div className="flex flex-col gap-y-4">
                <div>
                    <label className="text-gray-500 text-sm">File Name</label>
                    <Input
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter file name"
                    />
                </div>

                <div>
                    <label className="text-gray-500 text-sm">Format</label>
                    <Select
                        value={fileFormat}
                        onValueChange={(value) => setFileFormat(value)}
                    >
                        <Select.Trigger>
                            <Select.Value placeholder="Select format" />
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="csv">CSV</Select.Item>
                            <Select.Item value="json">JSON</Select.Item>
                        </Select.Content>
                    </Select>
                </div>

                <Button
                    onClick={handleExport}
                    disabled={isLoading || isExporting}
                    isLoading={isExporting}
                >
                    {isExporting ? "Exporting..." : "Export Customers"}
                </Button>
            </div>
        </div>
    )
}

export const config: WidgetConfig = {
    zone: "customer.list.before",
}

export default ExportCustomersWidget