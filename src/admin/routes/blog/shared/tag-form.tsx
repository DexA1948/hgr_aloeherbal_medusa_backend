// src/admin/routes/blog/shared/tag-form.tsx
import { useState, useEffect } from "react"
import {
  Input,
  Label,
  Button,
  Text,
} from "@medusajs/ui"
import { useAdminCustomPost } from "medusa-react"
import { useNavigate } from "react-router-dom"
import type { TagFormProps, TagRequest, TagResponse } from "../../../types/blog"
import { BellAlertSolid } from "@medusajs/icons"

const TagForm = ({ initialData, onSuccess }: TagFormProps) => {
  const navigate = useNavigate()
  const [existingValues, setExistingValues] = useState<string[]>([])
  const [valueError, setValueError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<TagRequest>({
    value: initialData?.value || "",
  })

  // Fetch existing tag values for validation
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL
        const response = await fetch(`${baseUrl}/store/blog/tags`)
        const data = await response.json()
        const tags = Array.isArray(data) ? data : data.tags || []

        const values = tags
          .filter(tag => initialData ? tag.id !== initialData.id : true)
          .map(tag => tag.value.toLowerCase())
        setExistingValues(values)
      } catch (error) {
        console.error("Error fetching tags:", error)
      }
    }

    fetchTags()
  }, [initialData])

  const createTag = useAdminCustomPost<TagRequest, TagResponse>(
    "/blog/tags",
    ["blog_tags"]
  )

  const updateTag = useAdminCustomPost<TagRequest, TagResponse>(
    `/blog/tags/${initialData?.id}`,
    ["blog_tags"]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value.trim()) {
      setValueError("Tag value cannot be empty");
      return;
    }

    if (!initialData && existingValues.includes(formData.value.toLowerCase())) {
      setValueError("This tag already exists");
      return;
    }

    setIsSubmitting(true);
    const mutation = initialData ? updateTag : createTag;

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
          console.error("Error saving tag:", error);
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error("Error in submission:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[600px]">
      <div className="grid gap-6">
        <div>
          <Label htmlFor="value">Tag Value</Label>
          <Input
            id="value"
            value={formData.value}
            onChange={(e) => {
              setFormData({ value: e.target.value })
              setValueError("")
            }}
            required
          />
          {valueError && (
            <Text className="text-ui-fg-error text-sm mt-2 flex items-center gap-1">
              <BellAlertSolid />
              {valueError}
            </Text>
          )}
        </div>

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

export default TagForm