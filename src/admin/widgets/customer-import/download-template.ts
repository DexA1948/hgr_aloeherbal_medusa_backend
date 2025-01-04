// File: aloeherbal-medusa-backend/src/admin/widgets/customer-import/download-template.ts

const CustomerImportCSV =
  "data:text/csv;charset=utf-8," +
  `Customer Id,Email,First Name,Last Name,Phone,Has Account,Billing Address Id,Billing Address 1,Billing Address 2,Billing City,Billing Postal Code,Billing Province,Billing Country Code,Shipping Address 1,Shipping Address 2,Shipping City,Shipping Postal Code,Shipping Province,Shipping Country Code,Groups,Metadata
,john@example.com,John,Doe,+1234567890,false,,123 Main St,,New York,10001,NY,US,123 Main St,,New York,10001,NY,US,VIP;Wholesale,{"note":"preferred customer"}
,jane@example.com,Jane,Smith,+0987654321,true,,456 Oak Ave,,Los Angeles,90001,CA,US,789 Pine St,,Chicago,60601,IL,US,Retail,{"tags":"new customer"}`

export function downloadCustomerImportCSVTemplate() {
  const encodedUri = encodeURI(CustomerImportCSV)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "customer-import-template.csv")
  document.body.appendChild(link)

  link.click()
}