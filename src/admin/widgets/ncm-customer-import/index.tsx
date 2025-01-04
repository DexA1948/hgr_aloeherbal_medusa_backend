// src/admin/widgets/ncm-customer-import/index.tsx

import React, { useCallback, useState } from "react"
import {
    useAdminCreateBatchJob,
    useAdminUploadProtectedFile,
    useAdminDeleteFile,
    useAdminBatchJob,
    useAdminConfirmBatchJob,
} from "medusa-react"
import {
    Button,
    Container,
    Text,
    FocusModal,
} from "@medusajs/ui"
import { CloudArrowUp, Trash, DocumentText, ArrowDownTray, InformationCircle, CheckCircleSolid } from "@medusajs/icons"
import { downloadNCMCustomerImportTemplate } from "./download-template"
import { ImportAnalysis, ProcessingError, NCMCustomerImportCsvRow } from "./types"
import { transformToStandardFormat } from "./utils"
import Papa from "papaparse"
import clsx from "clsx"

type FileSummaryProps = {
    name: string
    size: number
    action: React.ReactNode
    hasError?: boolean
    errorMessage?: string
    status?: string
}

const FileSummary = ({
    name,
    size,
    action,
    hasError,
    errorMessage,
    status
}: FileSummaryProps) => {
    const formattedSize = size / 1024 < 10
        ? `${(size / 1024).toFixed(2)} KiB`
        : `${(size / (1024 * 1024)).toFixed(2)} MiB`

    return (
        <div className="relative mt-6 flex items-center rounded-lg border border-grey-20 p-4">
            <div className="mr-4">
                <DocumentText color={hasError ? "#E11D48" : "#9CA3AF"} />
            </div>
            <div className="flex-1">
                <Text className="text-grey-90">{name}</Text>
                <Text className={clsx("text-small", {
                    "text-rose-500": hasError,
                    "text-grey-50": !hasError,
                })}>
                    {status || formattedSize}
                </Text>
                {hasError && (
                    <Text className="text-rose-500 text-small mt-2">
                        {errorMessage}
                    </Text>
                )}
            </div>
            <div>{action}</div>
        </div>
    )
}

const NCMCustomerImportWidget = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [fileKey, setFileKey] = useState<string>()
    const [batchJobId, setBatchJobId] = useState<string>()
    const [selectedFile, setSelectedFile] = useState<File>()
    const [isDragActive, setIsDragActive] = useState(false)
    const [analysis, setAnalysis] = useState<ImportAnalysis>()
    const [processingError, setProcessingError] = useState<ProcessingError>()
    const [isPreprocessing, setIsPreprocessing] = useState(false)

    const createBatchJob = useAdminCreateBatchJob()
    const confirmBatchJob = useAdminConfirmBatchJob(batchJobId!)
    const fileUploader = useAdminUploadProtectedFile()
    const deleteFile = useAdminDeleteFile()

    const { batch_job } = useAdminBatchJob(
        batchJobId!,
        {
            enabled: !!batchJobId,
            refetchInterval: 2000,
        }
    )

    const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragActive(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            setSelectedFile(file)
            await processUpload(file)
        }
    }

    const analyzeCSV = useCallback(async (file: File): Promise<ImportAnalysis> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rows = results.data as NCMCustomerImportCsvRow[]
                    const updates = rows.filter(row => row["Customer Id"]).length
                    const creates = rows.length - updates
                    const errors: string[] = []

                    // Required fields validation
                    const requiredFields = ["Email", "First Name", "Last Name", "Phone",
                        "Shipping Country Code", "Region", "District", "Municipality",
                        "NCM Area", "NCM Postal Code"]

                    const missingFields = requiredFields.filter(
                        field => !results.meta.fields?.includes(field)
                    )

                    if (missingFields.length > 0) {
                        errors.push(`Missing required columns: ${missingFields.join(", ")}`)
                    }

                    if (results.errors.length > 0) {
                        errors.push(...results.errors.map(e => `Row ${e.row}: ${e.message}`))
                    }

                    resolve({
                        updates,
                        creates,
                        errors
                    })
                },
                error: (error) => reject(new Error(`Failed to parse CSV: ${error}`))
            })
        })
    }, [])

    const processUpload = async (file: File) => {
        setIsPreprocessing(true)
        setProcessingError(undefined)

        try {
            // First analyze the CSV
            const csvAnalysis = await analyzeCSV(file)
            setAnalysis(csvAnalysis)

            if (csvAnalysis.errors.length > 0) {
                setProcessingError({
                    message: "CSV validation failed",
                    raw: csvAnalysis.errors.join("\n")
                })
                return
            }

            // Transform the CSV data
            const transformedCsv = await new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const transformedRows = (results.data as NCMCustomerImportCsvRow[])
                            .map(transformToStandardFormat)

                        const csv = Papa.unparse(transformedRows)
                        resolve(new Blob([csv], { type: 'text/csv' }))
                    },
                    error: (error) => reject(error)
                })
            })

            // Upload transformed file
            const res = await fileUploader.mutateAsync(transformedCsv as any)
            const _fileKey = res.uploads[0].key
            setFileKey(_fileKey)

            const batchJob = await createBatchJob.mutateAsync({
                type: "customer-import",
                context: { fileKey: _fileKey },
                dry_run: true,
            })

            setBatchJobId(batchJob.batch_job.id)

        } catch (error) {
            setProcessingError({
                message: "Failed to process file",
                raw: error.message
            })

            if (fileKey) {
                await deleteFile.mutateAsync({ file_key: fileKey })
            }
        } finally {
            setIsPreprocessing(false)
        }
    }

    const renderStatus = () => {
        if (isPreprocessing) {
            return (
                <div className="flex items-center space-x-2 text-ui-fg-subtle">
                    <Text>Preprocessing...</Text>
                </div>
            )
        }

        if (processingError) {
            return (
                <div className="mt-4 p-4 bg-rose-50 rounded-lg">
                    <Text className="text-rose-500 font-medium">{processingError.message}</Text>
                    {processingError.raw && (
                        <Text className="text-rose-500 text-small mt-2 font-mono">{processingError.raw}</Text>
                    )}
                </div>
            )
        }

        if (analysis && !processingError) {
            return (
                <div className="mt-4 flex space-x-4">
                    <div className="flex items-center">
                        <CheckCircleSolid className="text-ui-fg-subtle mr-2" />
                        <Text>{analysis.creates} new customers</Text>
                    </div>
                    <div className="flex items-center">
                        <InformationCircle className="text-ui-fg-subtle mr-2" />
                        <Text>{analysis.updates} updates</Text>
                    </div>
                </div>
            )
        }

        return null
    }

    return (
        <Container>
            <div className="flex items-center justify-between mb-4">
                <Text className="text-ui-fg-subtle">
                    Import customer data in NCM format from a CSV file:
                </Text>
                <Button
                    variant="secondary"
                    onClick={() => setIsModalOpen(true)}
                >
                    <CloudArrowUp className="mr-2" />
                    Import NCM Format
                </Button>
            </div>

            <FocusModal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <FocusModal.Content>
                    <FocusModal.Header>
                        <Text className="text-md font-bold">
                            Import customers list
                        </Text>
                    </FocusModal.Header>
                    <FocusModal.Body className="flex flex-col items-center py-16">
                        <div className="flex w-full max-w-lg flex-col gap-y-8">
                            <div className="flex flex-col gap-y-2">
                                <Text>
                                    Through imports you can add or update customers.
                                    To update existing customers you must set an existing ID.
                                    If no ID is set, a new customer will be created.
                                </Text>

                                {renderStatus()}
                                {!selectedFile ? (
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            setIsDragActive(true)
                                        }}
                                        onDragLeave={() => setIsDragActive(false)}
                                        onDrop={handleFileDrop}
                                        className={clsx(
                                            "mt-3 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12",
                                            {
                                                "border-ui-border-base bg-ui-bg-base": !isDragActive,
                                                "border-ui-border-interactive bg-ui-bg-base": isDragActive
                                            }
                                        )}
                                    >
                                        <Text className="text-ui-fg-subtle mb-3">
                                            Drop your file here, or{" "}
                                            <button
                                                className="text-ui-fg-interactive"
                                                onClick={() => {
                                                    const input = document.createElement("input")
                                                    input.type = "file"
                                                    input.accept = ".csv"
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0]
                                                        if (file) {
                                                            setSelectedFile(file)
                                                            processUpload(file)
                                                        }
                                                    }
                                                    input.click()
                                                }}
                                            >
                                                click to browse
                                            </button>
                                        </Text>
                                        <Text className="text-ui-fg-subtle text-small">
                                            Only .csv files are supported
                                        </Text>
                                    </div>
                                ) : (
                                    <FileSummary
                                        name={selectedFile.name}
                                        size={selectedFile.size}
                                        status={batch_job?.status === "created" ? "Pre-processing..." : undefined}
                                        hasError={batch_job?.status === "failed"}
                                        errorMessage={typeof batch_job?.result?.errors?.[0] === 'string' ? batch_job?.result?.errors?.[0] : JSON.stringify(batch_job?.result?.errors?.[0])}
                                        action={
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                onClick={async () => {
                                                    if (fileKey) {
                                                        await deleteFile.mutateAsync({ file_key: fileKey })
                                                    }
                                                    setFileKey(undefined)
                                                    setBatchJobId(undefined)
                                                    setSelectedFile(undefined)
                                                }}
                                            >
                                                <Trash className="text-grey-40" />
                                            </Button>
                                        }
                                    />
                                )}

                                <div className="mt-8">
                                    <Text className="text-grey-90 font-semibold mb-2">
                                        Unsure about how to arrange your list?
                                    </Text>
                                    <Text className="text-grey-50 mb-4">
                                        Download the template below to ensure you are following the correct format.
                                    </Text>

                                    <FileSummary
                                        name="customer-import-template.csv"
                                        size={2967}
                                        action={
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                onClick={downloadNCMCustomerImportTemplate}
                                            >
                                                <ArrowDownTray className="text-grey-40" />
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </FocusModal.Body>
                    <div className="flex justify-end gap-x-2 border-t border-grey-20 px-6 py-4">
                        <Button
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!batch_job || batch_job.status !== "pre_processed"}
                            onClick={async () => {
                                if (batchJobId) {
                                    await confirmBatchJob.mutateAsync()
                                    setIsModalOpen(false)
                                }
                            }}
                        >
                            Import List
                        </Button>
                    </div>
                </FocusModal.Content>
            </FocusModal>
        </Container>
    )
}

export const config = {
    zone: "customer.list.before",
}

export default NCMCustomerImportWidget