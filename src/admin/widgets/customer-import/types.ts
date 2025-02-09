// src/admin/widgets/customer-import/types.ts
export type CustomerImportCsvRow = {
    "Customer Id"?: string
    "Email": string
    "First Name"?: string
    "Last Name"?: string
    "Phone"?: string
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