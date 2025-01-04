// src/strategies/download-template.ts

export const CustomerImportCSV =
  "data:text/csv;charset=utf-8," +
  `Customer Id,Email,First Name,Last Name,Phone,Company,Shipping Address 1,Shipping Address 2,Shipping City,Shipping Postal Code,Shipping Province,Shipping Country Code,Metadata
,john@example.com,John,Doe,+1234567890,ACME Corp,123 Main St,,New York,10001,NY,US,{"note":"preferred customer"}
,jane@example.com,Jane,Smith,+0987654321,Widget Inc,456 Oak Ave,,Los Angeles,90001,CA,US,{"tags":"new customer"}`

export function downloadCustomerImportTemplate() {
  const encodedUri = encodeURI(CustomerImportCSV)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "customer-import-template.csv")
  document.body.appendChild(link)
  link.click()
  link.remove()
}