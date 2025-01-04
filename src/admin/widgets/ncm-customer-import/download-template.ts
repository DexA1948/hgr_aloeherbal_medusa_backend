// src/admin/widgets/ncm-customer-import/download-template.ts

export const NCMCustomerImportCSV =
    "data:text/csv;charset=utf-8," +
    `Customer Id,Email,First Name,Last Name,Phone,Shipping Country Code,Region,District,Municipality,NCM Area,NCM Postal Code,Further Address Instruction,Metadata
,sanu@gmail.com,Sanu,Shrestha,9802212047,NP,R06 - NARAYANI,Makwanpur,HETAUDA SUBMETROPOLITAN CITY,KAMANE-8,HETAUDA,27.655693321918886 85.34923964039794,{"note":"preferred customer"}
,ramu@gmail.com,Ramu,Kandel,9812312345,NP,R05 - BAGMATI,KATHMANDU,KATHMANDU METROPOLITAN CITY,TENJING CHOWK,KAPAN,Behind the peepal tree,{"tags":"new customer"}`

export function downloadNCMCustomerImportTemplate() {
    const encodedUri = encodeURI(NCMCustomerImportCSV)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "ncm-customer-import-template.csv")
    document.body.appendChild(link)
    link.click()
    link.remove()
}