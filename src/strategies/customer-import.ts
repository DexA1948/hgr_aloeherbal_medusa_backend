// src/strategies/customer-import.ts

import {
    AbstractBatchJobStrategy,
    BatchJobService,
    CustomerService,
    BatchJob,
} from "@medusajs/medusa"
import { EntityManager } from "typeorm"
import { parse } from "papaparse"
import { CreateCustomerInput } from "@medusajs/medusa/dist/types/customers"
import { AddressCreatePayload } from "@medusajs/medusa/dist/types/common"

type CustomerImportCsvRow = {
    "Customer Id"?: string
    Email: string
    "First Name": string
    "Last Name": string
    Phone: string
    Company?: string
    "Shipping Address 1"?: string
    "Shipping Address 2"?: string
    "Shipping City"?: string
    "Shipping Postal Code"?: string
    "Shipping Province"?: string
    "Shipping Country Code"?: string
    Metadata?: string
}

interface InjectedDependencies {
    manager: EntityManager
    customerService: CustomerService
    batchJobService: BatchJobService
}

class CustomerImportStrategy extends AbstractBatchJobStrategy {
    static identifier = "customer-import-strategy"
    static batchType = "customer-import"

    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    protected batchJobService_: BatchJobService
    protected customerService_: CustomerService

    constructor({ manager, batchJobService, customerService }: InjectedDependencies) {
        super({ manager, batchJobService, customerService })
        this.manager_ = manager
        this.batchJobService_ = batchJobService
        this.customerService_ = customerService
    }

    async preProcessBatchJob(batchJobId: string): Promise<void> {
        const batchJob = await this.batchJobService_
            .withTransaction(this.manager_)
            .retrieve(batchJobId)

        if (!batchJob.context?.fileKey) {
            throw new Error("File key is required")
        }

        const csvBuffer = await this.downloadCsvBuffer(batchJob.context.fileKey as string)
        const parsed = await this.parseCsv(csvBuffer.toString("utf8"))
        const rows = parsed as { data: CustomerImportCsvRow[] }

        await this.batchJobService_
            .withTransaction(this.manager_)
            .update(batchJobId, {
                result: {
                    stat_descriptors: [
                        {
                            key: "customer-import-count",
                            name: "Customer count to import",
                            message: `${rows.data.length} customers will be processed`,
                        },
                    ],
                    count: rows.data.length,
                    advancement_count: 0,
                },
            })
    }

    async processJob(batchJobId: string): Promise<void> {
        const batchJob = await this.batchJobService_
            .withTransaction(this.manager_)
            .retrieve(batchJobId)

        if (!batchJob.context?.fileKey) {
            throw new Error("File key is required")
        }

        const csvBuffer = await this.downloadCsvBuffer(batchJob.context.fileKey as string)
        const parsed = await this.parseCsv(csvBuffer.toString("utf8"))
        const { data } = parsed as { data: CustomerImportCsvRow[] }

        let processedCount = 0

        try {
            for (const row of data) {
                try {
                    const customerData: CreateCustomerInput = {
                        email: row.Email,
                        first_name: row["First Name"],
                        last_name: row["Last Name"],
                        phone: row.Phone,
                        has_account: false,
                        metadata: row.Metadata ? JSON.parse(row.Metadata) : undefined,
                    }

                    if (row["Customer Id"]) {
                        await this.customerService_
                            .withTransaction(this.manager_)
                            .update(row["Customer Id"], customerData)
                    } else {
                        const customer = await this.customerService_
                            .withTransaction(this.manager_)
                            .create(customerData)

                        if (row["Shipping Address 1"]) {
                            const addressData: AddressCreatePayload = {
                                first_name: row["First Name"],
                                last_name: row["Last Name"],
                                company: row.Company || "", // Added required company field
                                address_1: row["Shipping Address 1"],
                                address_2: row["Shipping Address 2"] || "",
                                city: row["Shipping City"] || "",
                                postal_code: row["Shipping Postal Code"] || "",
                                province: row["Shipping Province"] || "",
                                country_code: row["Shipping Country Code"] || "",
                                phone: row.Phone,
                                metadata: row.Metadata ? JSON.parse(row.Metadata) : {},
                            }

                            await this.customerService_
                                .withTransaction(this.manager_)
                                .addAddress(customer.id, addressData)
                        }
                    }

                    processedCount++

                    await this.batchJobService_
                        .withTransaction(this.manager_)
                        .update(batchJobId, {
                            result: {
                                ...batchJob.result,
                                advancement_count: processedCount,
                            },
                        })

                } catch (error) {
                    throw new Error(`Error processing row: ${JSON.stringify(row)}, Error: ${error.message}`)
                }
            }

            // Update job as completed with final results
            await this.batchJobService_
                .withTransaction(this.manager_)
                .update(batchJobId, {
                    result: {
                        ...batchJob.result,
                        advancement_count: processedCount,
                        completed_at: new Date(),
                        status: "completed"
                    },
                })

        } catch (error) {
            await this.batchJobService_
                .withTransaction(this.manager_)
                .update(batchJobId, {
                    result: {
                        ...batchJob.result,
                        errors: [error.message],
                        failed_at: new Date(),
                        status: "failed"
                    },
                })

            throw error
        }
    }

    private async parseCsv(csvString: string) {
        return new Promise((resolve, reject) => {
            parse(csvString, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results),
                error: (error) => reject(error),
            })
        })
    }

    private async downloadCsvBuffer(fileKey: string): Promise<Buffer> {
        const path = await import("path")
        const fs = await import("fs")
        const filePath = path.join("uploads", fileKey)
        return fs.promises.readFile(filePath)
    }

    async buildTemplate(): Promise<string> {
        return ""
    }
}

export default CustomerImportStrategy