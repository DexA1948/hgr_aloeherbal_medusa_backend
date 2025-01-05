// src/admin/components/rich-text-editor/image-upload-modal.tsx

import { useState } from "react"
import { useAdminUploadProtectedFile } from "medusa-react"
import {
    Button,
    FocusModal,
    Input,
    Label,
    Text
} from "@medusajs/ui"
import { PhotoSolid } from "@medusajs/icons"

interface ImageUploadModalProps {
    open: boolean
    onClose: () => void
    onImageSelect: (url: string) => void
}

const ImageUploadModal = ({ open, onClose, onImageSelect }: ImageUploadModalProps) => {
    const [imageUrl, setImageUrl] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadMode, setUploadMode] = useState<"url" | "file">("url")

    const { mutateAsync: uploadFile } = useAdminUploadProtectedFile()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        try {
            const { uploads } = await uploadFile(selectedFile)
            onImageSelect(uploads[0].url)
            onClose()
        } catch (error) {
            console.error("Error uploading file:", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleUrlSubmit = () => {
        if (imageUrl) {
            onImageSelect(imageUrl)
            onClose()
        }
    }

    return (
        <FocusModal open={open}>
            <FocusModal.Content>
                <FocusModal.Header>
                    <Text className="text-xl">Add Image</Text>
                </FocusModal.Header>
                <FocusModal.Body className="flex flex-col items-center py-16">
                    <div className="flex w-full max-w-lg flex-col gap-y-8">
                        <div className="flex justify-center gap-x-4 mb-8">
                            <Button
                                variant={uploadMode === "url" ? "primary" : "secondary"}
                                onClick={() => setUploadMode("url")}
                            >
                                Use URL
                            </Button>
                            <Button
                                variant={uploadMode === "file" ? "primary" : "secondary"}
                                onClick={() => setUploadMode("file")}
                            >
                                Upload File
                            </Button>
                        </div>

                        {uploadMode === "url" ? (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-y-2">
                                    <Label htmlFor="image_url">Image URL</Label>
                                    <Input
                                        id="image_url"
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <div className="flex justify-end gap-x-2">
                                    <Button variant="secondary" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUrlSubmit} disabled={!imageUrl}>
                                        Add Image
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="flex flex-col items-center gap-y-2">
                                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-ui-bg-subtle">
                                            <PhotoSolid />
                                        </div>
                                        <Text className="text-ui-fg-subtle">
                                            {selectedFile ? selectedFile.name : "No file selected"}
                                        </Text>
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="max-w-sm"
                                    />
                                </div>
                                <div className="flex justify-end gap-x-2">
                                    <Button variant="secondary" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={!selectedFile || isUploading}
                                    >
                                        {isUploading ? "Uploading..." : "Upload & Add"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </FocusModal.Body>
            </FocusModal.Content>
        </FocusModal>
    )
}

export default ImageUploadModal