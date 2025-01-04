import React, { useState, useEffect } from "react"
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
import { CloudArrowUp } from "@medusajs/icons"
import { BatchJob } from "@medusajs/medusa"
import { downloadCustomerImportCSVTemplate } from "./download-template"

const CustomerImportWidget = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [fileKey, setFileKey] = useState<string>()
    const [batchJobId, setBatchJobId] = useState<string>()
    const [selectedFile, setSelectedFile] = useState<File>()

    const createBatchJob = useAdminCreateBatchJob()
    const confirmBatchJob = useAdminConfirmBatchJob(batchJobId!)
    const fileUploader = useAdminUploadProtectedFile()
    const deleteFile = useAdminDeleteFile()

    // Get batch job status
    const { batch_job } = useAdminBatchJob(
        batchJobId!,
        {
            enabled: !!batchJobId,
            refetchInterval: 2000,
        }
    )

    const processUpload = async (file: File) => {
        try {
            const res = await fileUploader.mutateAsync(file as any)
            const _fileKey = res.uploads[0].key
            setFileKey(_fileKey)

            const batchJob = await createBatchJob.mutateAsync({
                type: "customer-import",
                context: { fileKey: _fileKey },
                dry_run: false,
            })

            setBatchJobId(batchJob.batch_job.id)

            // Wait a moment before confirming to ensure pre-processing is complete
            setTimeout(async () => {
                try {
                    await confirmBatchJob.mutateAsync()
                } catch (error) {
                    console.error("Error confirming batch job:", error)
                }
            }, 1000)
        } catch (error) {
            console.error("Upload error:", error)
            if (fileKey) {
                await deleteFile.mutateAsync({ file_key: fileKey })
            }
        }
    }

    const onFileRemove = async () => {
        if (fileKey) {
            try {
                await deleteFile.mutateAsync({ file_key: fileKey })
            } catch (error) {
                console.error("Error deleting file:", error)
            }
        }
        setFileKey(undefined)
        setBatchJobId(undefined)
        setSelectedFile(undefined)
    }

    return (
        <Container>
            <div className="flex items-center justify-between">
                <Text className="text-ui-fg-subtle">
                    Import customer data from a CSV file:
                </Text>
                <Button
                    variant="secondary"
                    onClick={() => setIsModalOpen(true)}
                >
                    <CloudArrowUp className="mr-2" />
                    Import Customers
                </Button>
            </div>

            <FocusModal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <FocusModal.Content>
                    <FocusModal.Header>
                        <Text className="text-xl font-bold">
                            Import Customers
                        </Text>
                    </FocusModal.Header>
                    <FocusModal.Body className="flex flex-col items-center py-16">
                        <div className="flex w-full max-w-lg flex-col gap-y-8">
                            <div className="flex flex-col gap-y-2">
                                <Text>
                                    Upload a CSV file to import customers. Download the template below to ensure correct formatting.
                                </Text>

                                {!selectedFile ? (
                                    <div
                                        className="border-2 border-dashed border-grey-20 rounded-rounded p-8 flex flex-col justify-center items-center"
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            const file = e.dataTransfer.files[0]
                                            setSelectedFile(file)
                                            processUpload(file)
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <Text>
                                            Drop your CSV file here, or{" "}
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
                                        <Text className="text-ui-fg-subtle mt-2">
                                            Only .csv files are supported
                                        </Text>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-ui-bg-subtle p-4 rounded-rounded">
                                        <Text>{selectedFile.name}</Text>
                                        <Button
                                            variant="secondary"
                                            size="small"
                                            onClick={onFileRemove}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}

                                {/* Status display */}
                                {batch_job && (
                                    <div className="mt-4">
                                        <Text>
                                            Status: {batch_job.status}
                                            {batch_job.result?.advancement_count != null && (
                                                <span>
                                                    {" "}
                                                    ({batch_job.result.advancement_count} / {batch_job.result.count} processed)
                                                </span>
                                            )}
                                        </Text>
                                        {batch_job.status === "failed" && (
                                            <Text className="text-ui-fg-error">
                                                Error: {typeof batch_job.result?.errors?.[0] === "string" ? batch_job.result.errors[0] : "An error occurred"}
                                            </Text>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-4">
                                    <Text>Download template</Text>
                                    <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={downloadCustomerImportCSVTemplate}
                                    >
                                        Download Template
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </FocusModal.Body>
                </FocusModal.Content>
            </FocusModal>
        </Container>
    )
}

export const config = {
    zone: "customer.list.before",
}

export default CustomerImportWidget