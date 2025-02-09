// src/admin/components/common/featured-image-uploader.tsx

import { useState, useRef } from "react" // Add useRef import
import { useAdminUploadProtectedFile } from "medusa-react"
import { Label, Text, Button } from "@medusajs/ui"
import { PhotoSolid } from "@medusajs/icons"

interface FeaturedImageUploaderProps {
    value?: string
    onChange: (url: string) => void
    onRemove?: () => void
}

const FeaturedImageUploader = ({ value, onChange, onRemove }: FeaturedImageUploaderProps) => {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null) // Add ref for file input
    const { mutateAsync: uploadFile } = useAdminUploadProtectedFile()

    const handleUploadClick = () => {
        // Programmatically click the hidden file input
        fileInputRef.current?.click()
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const { uploads } = await uploadFile(file)
            onChange(uploads[0].url)
        } catch (error) {
            console.error("Error uploading file:", error)
        } finally {
            setIsUploading(false)
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        setIsUploading(true)
        try {
            const { uploads } = await uploadFile(file)
            onChange(uploads[0].url)
        } catch (error) {
            console.error("Error uploading file:", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    return (
        <div className="space-y-4">
            <div>
                <Label>Featured Image</Label>
                <Text className="text-ui-fg-subtle text-sm">
                    Upload a featured image for your blog post
                </Text>
            </div>

            {value ? (
                <div className="relative group">
                    <img
                        src={value}
                        alt="Featured"
                        className="max-w-[300px] rounded-lg border border-ui-border-base"
                    />
                    <div className="absolute inset-0 bg-ui-bg-overlay opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => onRemove()}
                            type="button"
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    className="flex flex-col items-center gap-4 p-12 border-2 border-dashed border-ui-border-base rounded-lg bg-ui-bg-subtle hover:bg-ui-bg-base transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <div className="w-12 h-12 rounded-full bg-ui-bg-base flex items-center justify-center">
                        <PhotoSolid />
                    </div>
                    <div className="text-center">
                        <div className="flex flex-col gap-y-2">
                            <Text className="text-ui-fg-base font-semibold">
                                Drag and drop or click to upload
                            </Text>
                            <Text className="text-ui-fg-subtle">
                                Recommended size: 1200 x 630 pixels
                            </Text>
                            {isUploading && (
                                <Text className="text-ui-fg-subtle animate-pulse">
                                    Uploading...
                                </Text>
                            )}
                        </div>
                        <div className="mt-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                            />
                            <Button
                                variant="secondary"
                                disabled={isUploading}
                                type="button"
                                onClick={handleUploadClick}
                            >
                                {isUploading ? "Uploading..." : "Choose File"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FeaturedImageUploader