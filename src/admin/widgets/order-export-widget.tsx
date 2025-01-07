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
    clx,
    Input
} from "@medusajs/ui"
import { ArrowUpTray } from "@medusajs/icons"
import { useAdminRegions, useAdminSalesChannels } from "medusa-react"

interface AdditionalFields {
    subtotal: boolean
    shippingTotal: boolean
    discountTotal: boolean
    salesChannelId: boolean
    salesChannelName: boolean
    regionName: boolean
    regionCurrency: boolean
    cartId: boolean
    displayId: boolean
    shortCodes: boolean
    productFullNames: boolean
}

const FIELD_LABELS: Record<keyof AdditionalFields, string> = {
    subtotal: "Subtotal",
    shippingTotal: "Shipping Total",
    discountTotal: "Discount Total",
    salesChannelId: "Sales Channel ID",
    salesChannelName: "Sales Channel Name",
    regionName: "Region Name",
    regionCurrency: "Region Currency",
    cartId: "Cart ID",
    displayId: "Display ID",
    shortCodes: "Product Short Codes",
    productFullNames: "Product Full Names"
}

// Addition for filters
interface FilterState {
    status: string[]
    payment_status: string[]
    fulfillment_status: string[]
    regions: string[]
    sales_channels: string[]
}

// Constants for filter options
const STATUS_OPTIONS = [
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "canceled", label: "Canceled" },
    { value: "archived", label: "Archived" },
    { value: "requires_action", label: "Requires Action" }
]

const PAYMENT_STATUS_OPTIONS = [
    { value: "awaiting", label: "Awaiting" },
    { value: "captured", label: "Captured" },
    { value: "refunded", label: "Refunded" },
    { value: "canceled", label: "Canceled" },
    { value: "partially_refunded", label: "Partially Refunded" },
    { value: "requires_action", label: "Requires Action" },
    { value: "not_paid", label: "Not Paid" }
]

const FULFILLMENT_STATUS_OPTIONS = [
    { value: "fulfilled", label: "Fulfilled" },
    { value: "not_fulfilled", label: "Not Fulfilled" },
    { value: "partially_fulfilled", label: "Partially Fulfilled" },
    { value: "returned", label: "Returned" },
    { value: "partially_returned", label: "Partially Returned" },
    { value: "shipped", label: "Shipped" },
    { value: "partially_shipped", label: "Partially Shipped" },
    { value: "requires_action", label: "Requires Action" },
    { value: "canceled", label: "Canceled" }
]
// Addition for filters end

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
        displayId: false,
        shortCodes: true,
        productFullNames: true,
    })

    const [startDate, setStartDate] = useState<Date | null>(null)
    const [endDate, setEndDate] = useState<Date | null>(null)

    const [displayIdRange, setDisplayIdRange] = useState({
        start: "",
        end: ""
    })
    const [rangeError, setRangeError] = useState<string>("")

    // Validate range inputs
    const validateRange = (): boolean => {
        const start = parseInt(displayIdRange.start)
        const end = parseInt(displayIdRange.end)

        if (displayIdRange.start && displayIdRange.end) {
            if (isNaN(start) || isNaN(end)) {
                setRangeError("Please enter valid numbers")
                return false
            }
            if (start < 1) {
                setRangeError("Start ID must be greater than 0")
                return false
            }
            if (end < start) {
                setRangeError("End ID must be greater than Start ID")
                return false
            }
            if (end - start > 1000) {
                setRangeError("Range cannot exceed 1000 orders")
                return false
            }
            setRangeError("")
            return true
        }
        return true // If either field is empty, consider it valid (not using range filter)
    }

    // Addition for filters
    // Add new state for filters
    const [filters, setFilters] = useState<FilterState>({
        status: [],
        payment_status: [],
        fulfillment_status: [],
        regions: [],
        sales_channels: []
    })

    // Fetch regions and sales channels
    const { regions } = useAdminRegions()
    const { sales_channels } = useAdminSalesChannels()

    const handleStatusChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            status: prev.status.includes(value)
                ? prev.status.filter(s => s !== value)
                : [...prev.status, value]
        }))
    }

    const handlePaymentStatusChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            payment_status: prev.payment_status.includes(value)
                ? prev.payment_status.filter(s => s !== value)
                : [...prev.payment_status, value]
        }))
    }

    const handleFulfillmentStatusChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            fulfillment_status: prev.fulfillment_status.includes(value)
                ? prev.fulfillment_status.filter(s => s !== value)
                : [...prev.fulfillment_status, value]
        }))
    }

    const handleRegionChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            regions: prev.regions.includes(value)
                ? prev.regions.filter(r => r !== value)
                : [...prev.regions, value]
        }))
    }

    const handleSalesChannelChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            sales_channels: prev.sales_channels.includes(value)
                ? prev.sales_channels.filter(sc => sc !== value)
                : [...prev.sales_channels, value]
        }))
    }
    // Addition for filters end

    const handleExport = async () => {
        if (!validateRange()) {
            return
        }

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

            // Add display ID range if both values are provided
            if (displayIdRange.start && displayIdRange.end) {
                searchParams.append("display_id_from", displayIdRange.start)
                searchParams.append("display_id_to", displayIdRange.end)
            }

            // Addition for filters
            // Add filters to query params
            if (filters.status.length) {
                filters.status.forEach(status =>
                    searchParams.append("status", status))
            }
            if (filters.payment_status.length) {
                filters.payment_status.forEach(status =>
                    searchParams.append("payment_status", status))
            }
            if (filters.fulfillment_status.length) {
                filters.fulfillment_status.forEach(status =>
                    searchParams.append("fulfillment_status", status))
            }
            if (filters.regions.length) {
                filters.regions.forEach(region =>
                    searchParams.append("region_id", region))
            }
            if (filters.sales_channels.length) {
                filters.sales_channels.forEach(channel =>
                    searchParams.append("sales_channel_id", channel))
            }
            // Addition for filters end

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
                        <div className="flex flex-col items-center h-[calc(85vh-100px)] overflow-y-auto scrollbar-hide w-full p-4">
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

                                {/* Display ID Range Section */}
                                <div className="flex flex-col gap-y-4">
                                    <Text size="large" className="font-semibold">
                                        Display ID Range
                                    </Text>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-y-2">
                                            <Label htmlFor="start-id">Start ID</Label>
                                            <Input
                                                id="start-id"
                                                type="number"
                                                min="1"
                                                placeholder="e.g. 1"
                                                value={displayIdRange.start}
                                                onChange={(e) => setDisplayIdRange(prev => ({
                                                    ...prev,
                                                    start: e.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-y-2">
                                            <Label htmlFor="end-id">End ID</Label>
                                            <Input
                                                id="end-id"
                                                type="number"
                                                min="1"
                                                placeholder="e.g. 100"
                                                value={displayIdRange.end}
                                                onChange={(e) => setDisplayIdRange(prev => ({
                                                    ...prev,
                                                    end: e.target.value
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    {rangeError && (
                                        <Text className="text-ui-fg-error text-sm">
                                            {rangeError}
                                        </Text>
                                    )}
                                    <Text className="text-ui-fg-subtle text-sm">
                                        Leave both fields empty to export without ID range filtering. Maximum range: 1000 orders.
                                    </Text>
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

                                {/* Order Status Section */}
                                <div className="flex flex-col gap-y-4">
                                    <Text size="large" className="font-semibold">
                                        Order Status
                                    </Text>
                                    <div className="flex flex-wrap gap-2">
                                        {STATUS_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleStatusChange(option.value)}
                                                className={clx(
                                                    "px-3 py-1.5 rounded-full text-sm transition-colors",
                                                    filters.status.includes(option.value)
                                                        ? "bg-ui-bg-base border-ui-border-base text-ui-fg-base border"
                                                        : "bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base border"
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Status Section */}
                                <div className="flex flex-col gap-y-4">
                                    <Text size="large" className="font-semibold">
                                        Payment Status
                                    </Text>
                                    <div className="flex flex-wrap gap-2">
                                        {PAYMENT_STATUS_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handlePaymentStatusChange(option.value)}
                                                className={clx(
                                                    "px-3 py-1.5 rounded-full text-sm transition-colors",
                                                    filters.payment_status.includes(option.value)
                                                        ? "bg-ui-bg-base border-ui-border-base text-ui-fg-base border"
                                                        : "bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base border"
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Fulfillment Status Section */}
                                <div className="flex flex-col gap-y-4">
                                    <Text size="large" className="font-semibold">
                                        Fulfillment Status
                                    </Text>
                                    <div className="flex flex-wrap gap-2">
                                        {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFulfillmentStatusChange(option.value)}
                                                className={clx(
                                                    "px-3 py-1.5 rounded-full text-sm transition-colors",
                                                    filters.fulfillment_status.includes(option.value)
                                                        ? "bg-ui-bg-base border-ui-border-base text-ui-fg-base border"
                                                        : "bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base border"
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Regions Section */}
                                {regions && regions.length > 0 && (
                                    <div className="flex flex-col gap-y-4">
                                        <Text size="large" className="font-semibold">
                                            Regions
                                        </Text>
                                        <div className="flex flex-wrap gap-2">
                                            {regions.map((region) => (
                                                <button
                                                    key={region.id}
                                                    onClick={() => handleRegionChange(region.id)}
                                                    className={clx(
                                                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                                                        filters.regions.includes(region.id)
                                                            ? "bg-ui-bg-base border-ui-border-base text-ui-fg-base border"
                                                            : "bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base border"
                                                    )}
                                                >
                                                    {region.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sales Channels Section */}
                                {sales_channels && sales_channels.length > 0 && (
                                    <div className="flex flex-col gap-y-4">
                                        <Text size="large" className="font-semibold">
                                            Sales Channels
                                        </Text>
                                        <div className="flex flex-wrap gap-2">
                                            {sales_channels.map((channel) => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => handleSalesChannelChange(channel.id)}
                                                    className={clx(
                                                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                                                        filters.sales_channels.includes(channel.id)
                                                            ? "bg-ui-bg-base border-ui-border-base text-ui-fg-base border"
                                                            : "bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base border"
                                                    )}
                                                >
                                                    {channel.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
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