// src/admin/routes/blog/tags/[id]/page.tsx
import { useEffect, useState } from "react"
import { Container, Heading } from "@medusajs/ui"
import TagForm from "../../shared/tag-form"
import { useNavigate, useParams } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import type { BlogTag } from "../../../../types/blog"

const EditBlogTag = ({ notify }: RouteProps) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tag, setTag] = useState<BlogTag | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTag = async () => {
      try {
        const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL
        const response = await fetch(`${baseUrl}/store/blog/tags`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch tags")
        }

        const data = await response.json()
        const tags = Array.isArray(data) ? data : data.tags || []
        const foundTag = tags.find(t => t.id === id)

        if (!foundTag) {
          throw new Error("Tag not found")
        }

        setTag(foundTag)
      } catch (error) {
        console.error("Error fetching tag:", error)
        notify.error("Error", "Failed to load tag")
        navigate("/a/blog")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchTag()
    }
  }, [id])

  const handleSuccess = (updatedTag: BlogTag) => {
    notify.success("Success", `Tag "${updatedTag.value}" updated successfully`)
    navigate("/a/blog")
  }

  if (isLoading) {
    return (
      <Container>
        <div>Loading tag...</div>
      </Container>
    )
  }

  if (!tag) {
    return (
      <Container>
        <div>Tag not found</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Heading>Edit Tag: {tag.value}</Heading>
        <TagForm 
          initialData={tag}
          onSuccess={handleSuccess} 
        />
      </div>
    </Container>
  )
}

export default EditBlogTag