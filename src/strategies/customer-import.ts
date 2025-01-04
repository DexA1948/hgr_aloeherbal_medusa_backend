import { 
    AbstractBatchJobStrategy, 
    BatchJobService,
    CustomerService,
    BatchJobStatus,
} from "@medusajs/medusa"
import { EntityManager } from "typeorm"
import { parse } from "papaparse"
import { CreateCustomerInput, UpdateCustomerInput } from "@medusajs/medusa/dist/types/customers"
import fs from "fs"
import path from "path"

type CustomerImportContext = {
    fileKey: string;
}

type CustomerImportData = {
    "Customer Id"?: string
    Email: string
    "First Name"?: string
    "Last Name"?: string
    Phone?: string
    "Has Account"?: string
    Metadata?: string
}

class CustomerImportStrategy extends AbstractBatchJobStrategy {
    static identifier = "customer-import"
    static batchType = "customer-import"

    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    protected batchJobService_: BatchJobService
    protected customerService_: CustomerService

    constructor(container, options) {
        super(container)
        this.manager_ = container.manager
        this.batchJobService_ = container.batchJobService
        this.customerService_ = container.customerService
    }

    async preProcessBatchJob(batchJobId: string): Promise<void> {
        const batchJob = await this.batchJobService_.retrieve(batchJobId)
        const context = batchJob.context as CustomerImportContext

        if (!context?.fileKey) {
            throw new Error("File key is missing")
        }

        const csvBuffer = await this.downloadCsvBuffer(context.fileKey)
        const parsed = await this.parseCsv(csvBuffer.toString("utf8"))

        await this.batchJobService_.update(batchJobId, {
            result: {
                advancement_count: 0,
                count: parsed.data.length,
                stat_descriptors: [
                    {
                        key: "customer-import-count",
                        name: "Customer count to import",
                        message: `${parsed.data.length} customers will be processed`,
                    },
                ],
            },
        })
    }

    async processJob(batchJobId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const batchJob = await this.batchJobService_
                .withTransaction(manager)
                .retrieve(batchJobId)

            try {
                const csvBuffer = await this.downloadCsvBuffer(
                    (batchJob.context as CustomerImportContext).fileKey
                )
                const parsed = await this.parseCsv(csvBuffer.toString("utf8"))
                
                let processedCount = 0

                for (const row of parsed.data as CustomerImportData[]) {
                    await this.batchJobService_
                        .withTransaction(manager)
                        .setProcessing(batchJobId)

                    try {
                        if (row["Customer Id"]) {
                            await this.processUpdateCustomer(row)
                        } else {
                            await this.processCreateCustomer(row)
                        }
                        
                        processedCount++
                        
                        await this.batchJobService_
                            .withTransaction(manager)
                            .update(batchJobId, {
                                result: {
                                    advancement_count: processedCount,
                                    count: parsed.data.length,
                                    stat_descriptors: [
                                        {
                                            key: "customer-import-count",
                                            name: "Customer count to import",
                                            message: `${processedCount} of ${parsed.data.length} customers processed`,
                                        },
                                    ],
                                },
                            })
                    } catch (error) {
                        throw error
                    }
                }

                await this.batchJobService_
                    .withTransaction(manager)
                    .complete(batchJobId)
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error occurred"
                await this.batchJobService_
                    .withTransaction(manager)
                    .setFailed(batchJobId, message)
                throw error
            }
        })
    }

    private async processCreateCustomer(row: CustomerImportData) {
        const customerData: CreateCustomerInput = {
            email: row.Email,
            first_name: row["First Name"],
            last_name: row["Last Name"],
            phone: row.Phone,
            has_account: row["Has Account"]?.toLowerCase() === "true",
            metadata: row.Metadata ? JSON.parse(row.Metadata) : undefined,
        }

        return await this.customerService_.create(customerData)
    }

    private async processUpdateCustomer(row: CustomerImportData) {
        if (!row["Customer Id"]) {
            throw new Error("Customer ID is required for updates")
        }

        const customerData: UpdateCustomerInput = {
            email: row.Email,
            first_name: row["First Name"],
            last_name: row["Last Name"],
            phone: row.Phone,
            metadata: row.Metadata ? JSON.parse(row.Metadata) : undefined,
        }

        return await this.customerService_.update(row["Customer Id"], customerData)
    }

    private async parseCsv(csvString: string): Promise<{ data: CustomerImportData[] }> {
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
        const filePath = path.join("uploads", fileKey)
        return fs.promises.readFile(filePath)
    }

    async buildTemplate(): Promise<string> {
        return ""
    }
}

export default CustomerImportStrategy