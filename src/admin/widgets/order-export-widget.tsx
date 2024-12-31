// src/admin/widgets/order-export-widget.tsx
import React, { useState } from "react"
import {
    Button,
    Text,
    Container,
    FocusModal,
    Label,
    Checkbox,
    DatePicker,
    clx
} from "@medusajs/ui"
import { ArrowUpTray } from "@medusajs/icons"

interface AdditionalFields {
    subtotal: boolean
    shippingTotal: boolean
    discountTotal: boolean
    salesChannelId: boolean
    salesChannelName: boolean
    regionName: boolean
    regionCurrency: boolean
    cartId: boolean
}

const FIELD_LABELS: Record<keyof AdditionalFields, string> = {
    subtotal: "Subtotal",
    shippingTotal: "Shipping Total",
    discountTotal: "Discount Total",
    salesChannelId: "Sales Channel ID",
    salesChannelName: "Sales Channel Name",
    regionName: "Region Name",
    regionCurrency: "Region Currency",
    cartId: "Cart ID"
}

const OrderExportWidget = () => {
    const [isExporting, setIsExporting] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [additionalFields, setAdditionalFields] = useState<AdditionalFields>({
        subtotal: false,
        shippingTotal: false,
        discountTotal: false,
        salesChannelId: false,
        salesChannelName: false,
        regionName: false,
        regionCurrency: false,
        cartId: false,
    })

    const [startDate, setStartDate] = useState<Date | null>(null)
    const [endDate, setEndDate] = useState<Date | null>(null)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL || "/api"
            const searchParams = new URLSearchParams()

            // Add selected fields to query params
            Object.entries(additionalFields).forEach(([key, value]) => {
                if (value) searchParams.append(key, "true")
            })

            // Add date range if selected
            if (startDate) {
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)
                searchParams.append("start_date", start.toISOString())
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                searchParams.append("end_date", end.toISOString())
            }

            window.location.href = `${baseUrl}/admin/orders/export?${searchParams.toString()}`
        } catch (error) {
            console.error("Failed to export orders:", error)
        } finally {
            setIsExporting(false)
            setIsModalOpen(false)
        }
    }

    return (
        <Container>
            <div className="flex items-center justify-between">
                <Text className="text-ui-fg-subtle">
                    Export orders with additional fields and date filters:
                </Text>
                <Button
                    variant="secondary"
                    onClick={() => setIsModalOpen(true)}
                >
                    <ArrowUpTray className="mr-2" />
                    Export Orders
                </Button>
            </div>
            <FocusModal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <FocusModal.Content>
                    <FocusModal.Header>
                        <Button
                            variant="primary"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? "Exporting..." : "Export Orders"}
                        </Button>
                    </FocusModal.Header>
                    <FocusModal.Body className="flex flex-col items-center py-16">
                        <div className="flex w-full max-w-lg flex-col gap-y-8">
                            {/* Additional Fields Section */}
                            <div className="flex flex-col gap-y-4">
                                <Text size="large" className="font-semibold">
                                    Additional Fields
                                </Text>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(additionalFields).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-x-2"
                                        >
                                            <Checkbox
                                                id={key}
                                                checked={value}
                                                onCheckedChange={() =>
                                                    setAdditionalFields(prev => ({
                                                        ...prev,
                                                        [key]: !value
                                                    }))
                                                }
                                            />
                                            <Label
                                                htmlFor={key}
                                                className={clx(
                                                    "text-ui-fg-base cursor-pointer",
                                                    value && "text-ui-fg-interactive"
                                                )}
                                            >
                                                {FIELD_LABELS[key as keyof AdditionalFields]}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Date Range Section */}
                            <div className="flex flex-col gap-y-4">
                                <Text size="large" className="font-semibold">
                                    Date Range
                                </Text>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-y-2">
                                        <Label htmlFor="start-date">Start Date</Label>
                                        <DatePicker
                                            id="start-date"
                                            value={startDate}
                                            onChange={(date) => setStartDate(date)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-y-2">
                                        <Label htmlFor="end-date">End Date</Label>
                                        <DatePicker
                                            id="end-date"
                                            value={endDate}
                                            onChange={(date) => setEndDate(date)}
                                            fromDate={startDate || undefined}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FocusModal.Body>
                </FocusModal.Content>
            </FocusModal>
        </Container>
    )
}

export const config = {
    zone: "order.list.before",
}

export default OrderExportWidget