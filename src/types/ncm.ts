// src/types/ncm.ts
// src/types/ncm.ts
export interface NCMComment {
    pk: number               // Added pk field
    orderid: number
    comments: string
    addedBy: "NCM Staff" | "Vendor"
    added_time: string
}

export interface NCMOrderDetails {
    orderid: number
    cod_charge: string
    delivery_charge: string
    last_delivery_status: string
    payment_status: string
    vendor_return: string    // Added vendor_return field
    trackid: string         // Added trackid field
}

export interface NCMOrderStatus {
    orderid: number
    status: string
    added_time: string
    vendor_return: string    // Added vendor_return field
}

export interface NCMApiError {
    detail: string
}

export type NCMBulkCommentsResponse = NCMComment[]