// src/admin/widgets/ncm-customer-import/types.ts

export type NCMCustomerImportCsvRow = {
    "Customer Id"?: string
    "Email": string
    "First Name": string
    "Last Name": string
    "Phone": string
    "Shipping Country Code": string
    "Region": string
    "District": string
    "Municipality": string
    "NCM Area": string
    "NCM Postal Code": string
    "Further Address Instruction": string
    "Metadata"?: string
}

export type ImportAnalysis = {
    updates: number
    creates: number
    errors: string[]
}

export type ProcessingError = {
    row?: number
    message: string
    raw?: string
}