// File: src\admin\widgets\product-widget.tsx

import type { ProductDetailsWidgetProps, WidgetConfig } from "@medusajs/admin"
import { useAdminProductTags } from "medusa-react"

const ProductWidget = ({ product }: ProductDetailsWidgetProps) => {
    const { product_tags } = useAdminProductTags({
        id: product.tags.map((tag) => tag.id),
        limit: 10,
        offset: 0,
    })

    return (
        <div className="bg-white p-8 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Product Tags</h3>
            <div className="flex flex-wrap">
                {product_tags?.map((tag) => (
                    <span
                        key={tag.id}
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs mr-2 mb-2"
                    >
                        {tag.value}
                    </span>
                ))}
            </div>
        </div>
    )
}

export const config: WidgetConfig = {
    zone: "product.details.after",
}

export default ProductWidget