// src/admin/widgets/ncm-customer-import/utils.ts

import { NCMCustomerImportCsvRow } from "./types"

export const transformToStandardFormat = (ncmRow: NCMCustomerImportCsvRow) => {
    return {
        "Customer Id": ncmRow["Customer Id"],
        "Email": ncmRow["Email"],
        "First Name": ncmRow["First Name"],
        "Last Name": ncmRow["Last Name"],
        "Phone": ncmRow["Phone"],
        "Company": ncmRow["Municipality"],
        "Shipping Address 1": ncmRow["NCM Area"],
        "Shipping Address 2": ncmRow["Further Address Instruction"],
        "Shipping City": ncmRow["District"],
        "Shipping Postal Code": ncmRow["NCM Postal Code"],
        "Shipping Province": ncmRow["Region"],
        "Shipping Country Code": ncmRow["Shipping Country Code"],
        "Metadata": ncmRow["Metadata"]
    }
}