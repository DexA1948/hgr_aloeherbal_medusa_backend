// src/admin/routes/blog/shared/category-form.tsx
import { useState, useEffect } from "react"
import {
  Input,
  Label,
  Button,
  Textarea,
  Text,
} from "@medusajs/ui"
import { useAdminCustomPost } from "medusa-react"
import { useNavigate } from "react-router-dom"
import type {
  CategoryFormProps,
  CategoryRequest,
  CategoryResponse,
  MetadataEntry
} from "../../../types/blog"
import { BellAlertSolid } from "@medusajs/icons"

const CategoryForm = ({ initialData, onSuccess }: CategoryFormProps) => {
  const navigate = useNavigate()
  const [existingHandles, setExistingHandles] = useState<string[]>([])
  const [handleError, setHandleError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CategoryRequest>({
    title: initialData?.title || "",
    handle: initialData?.handle || "",
    description: initialData?.description || "",
    keywords: initialData?.keywords || [],
    metadata: initialData?.metadata || {}
  })

  const [metadataEntries, setMetadataEntries] = useState<MetadataEntry[]>([])
  const [newMetadataKey, setNewMetadataKey] = useState("")
  const [newMetadataValue, setNewMetadataValue] = useState("")

  // Initialize metadata entries from existing data
  useEffect(() => {
    if (initialData?.metadata) {
      const entries = Object.entries(initialData.metadata).map(([key, value]) => ({
        key,
        value: String(value)
      }))
      setMetadataEntries(entries)
    }
  }, [initialData])

  // Fetch existing handles for validation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL
        const response = await fetch(`${baseUrl}/store/blog/categories`)
        const data = await response.json()
        const categories = Array.isArray(data) ? data : data.categories || []

        const handles = categories
          .filter(cat => initialData ? cat.id !== initialData.id : true)
          .map(cat => cat.handle)
        setExistingHandles(handles)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [initialData])

  // Update metadata in form data when entries change
  useEffect(() => {
    const newMetadata = metadataEntries.reduce((acc, { key, value }) => ({
      ...acc,
      [key]: value
    }), {})

    setFormData(prev => ({
      ...prev,
      metadata: newMetadata
    }))
  }, [metadataEntries])

  const handleTitleChange = (value: string) => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        title: value
      }))
    } else {
      const newHandle = value.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      if (existingHandles.includes(newHandle)) {
        setHandleError("This handle already exists. Please modify the title.")
      } else {
        setHandleError("")
      }

      setFormData(prev => ({
        ...prev,
        title: value,
        handle: newHandle
      }))
    }
  }

  const handleAddMetadata = () => {
    if (newMetadataKey && newMetadataValue) {
      setMetadataEntries([
        ...metadataEntries,
        { key: newMetadataKey, value: newMetadataValue }
      ])
      setNewMetadataKey("")
      setNewMetadataValue("")
    }
  }

  const handleRemoveMetadata = (keyToRemove: string) => {
    setMetadataEntries(metadataEntries.filter(({ key }) => key !== keyToRemove))
  }

  const createCategory = useAdminCustomPost<CategoryRequest, CategoryResponse>(
    "/blog/categories",
    ["blog_categories"]
  )

  const updateCategory = useAdminCustomPost<CategoryRequest, CategoryResponse>(
    `/blog/categories/${initialData?.id}`,
    ["blog_categories"]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialData && existingHandles.includes(formData.handle)) {
      setHandleError("This handle already exists. Please modify the title.");
      return;
    }

    setIsSubmitting(true);
    const mutation = initialData ? updateCategory : createCategory;

    try {
      mutation.mutate(formData, {
        onSuccess: (data: any) => {
          setIsSubmitting(false);

          // Handle different response formats for create vs update
          if (initialData) {
            // For updates, check if the update was successful
            if (data && typeof data.affected === 'number' && data.affected > 0) {
              onSuccess({ ...initialData, ...formData });
              navigate("/a/blog");
            } else {
              console.error("No changes were made:", data);
              // Optionally notify user that no changes were made
            }
          } else {
            // For create, expect the standard response with id
            if (data && data.id) {
              onSuccess(data);
              navigate("/a/blog");
            } else {
              console.error("Invalid response structure:", data);
              throw new Error("Invalid response structure");
            }
          }
        },
        onError: (error) => {
          console.error("Error saving category:", error);
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error("Error in submission:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[900px]">
      <div className="grid gap-6">
        {/* Title Field */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />
          {handleError && (
            <Text className="text-ui-fg-error text-sm mt-2 flex items-center gap-1">
              <BellAlertSolid />
              {handleError}
            </Text>
          )}
        </div>

        {/* Handle Field */}
        <div>
          <Label htmlFor="handle">Handle</Label>
          <Input
            id="handle"
            value={formData.handle}
            disabled={true}
            className="bg-ui-bg-disabled"
          />
          <Text className="text-ui-fg-subtle text-sm mt-1">
            {initialData
              ? "Handle cannot be modified after creation"
              : "Handle is automatically generated from the title"}
          </Text>
        </div>

        {/* Description Field */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({
              ...formData,
              description: e.target.value
            })}
            rows={3}
          />
        </div>

        {/* Keywords Field */}
        <div>
          <Label htmlFor="keywords">Keywords</Label>
          <div className="flex flex-wrap gap-2">
            {formData.keywords?.map((keyword, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-ui-bg-base border rounded"
              >
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    keywords: formData.keywords?.filter((_, i) => i !== index)
                  })}
                  className="text-ui-fg-subtle hover:text-ui-fg-base"
                >
                  ×
                </button>
              </div>
            ))}
            <Input
              id="keywords"
              placeholder="Add keyword and press Enter"
              className="w-40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const input = e.target as HTMLInputElement
                  const value = input.value.trim()
                  if (value) {
                    setFormData({
                      ...formData,
                      keywords: [...(formData.keywords || []), value]
                    })
                    input.value = ''
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="space-y-4">
          <Label>Metadata</Label>
          <div className="space-y-2">
            {metadataEntries.map(({ key, value }) => (
              <div key={key} className="flex items-center gap-2">
                <Input
                  value={key}
                  disabled
                  className="w-1/3"
                />
                <Input
                  value={value}
                  disabled
                  className="w-1/2"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemoveMetadata(key)}
                  className="w-1/6"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="metadata-key">Key</Label>
              <Input
                id="metadata-key"
                value={newMetadataKey}
                onChange={(e) => setNewMetadataKey(e.target.value)}
                placeholder="Enter key"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="metadata-value">Value</Label>
              <Input
                id="metadata-value"
                value={newMetadataValue}
                onChange={(e) => setNewMetadataValue(e.target.value)}
                placeholder="Enter value"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddMetadata}
              disabled={!newMetadataKey || !newMetadataValue}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/a/blog")}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (initialData ? "Update" : "Create")}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default CategoryForm