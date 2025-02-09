// File: src\admin\widgets\order-refund-widget.tsx

import {
    OrderDetailsWidgetProps,
    WidgetConfig
} from "@medusajs/admin"
import {
    Container,
    Text,
    Badge
} from "@medusajs/ui"
import { BellAlertSolid } from "@medusajs/icons"

const OrderRefundWidget = ({ order }: OrderDetailsWidgetProps) => {
    if (!order || order.refunds.length == 0 || order.payments[0].provider_id != "esewa-payment") return null;

    return (
        <Container className="mb-4">
            {order.refunds && order.refunds.length > 0 &&
                (
                    <div className="bg-ui-bg-base-error p-4 rounded-lg mb-4">
                        <div className="flex items-start gap-3">
                            <BellAlertSolid />
                            <div className="space-y-2">
                                <Text className="font-semibold text-ui-fg-error">
                                    Manual Refund Required
                                </Text>
                                <ul className="list-disc list-inside space-y-1">
                                    {order.refunds.map((refund) => (
                                        <li key={refund.id} className="text-ui-fg-error">
                                            Refund NPR {(refund.amount / 100).toFixed(2)} through eSewa merchant panel
                                            <Badge className="ml-2">
                                                {new Date(refund.created_at).toLocaleDateString()}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                                <Text className="text-ui-fg-error text-sm">
                                    Please process these refunds manually through your eSewa or other options.
                                    The refunds are recorded in the system but must be processed manually with eSewa.
                                </Text>
                            </div>
                        </div>
                    </div>
                )}
        </Container>
    )
}

export const config: WidgetConfig = {
    zone: "order.details.before"
}

export default OrderRefundWidget