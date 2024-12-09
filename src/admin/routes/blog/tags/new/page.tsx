// src/admin/routes/blog/tags/new/page.tsx
import { Container, Heading } from "@medusajs/ui"
import TagForm from "../../shared/tag-form"
import { useNavigate } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import type { BlogTag } from "../../../../types/blog"

const NewBlogTag = ({ notify }: RouteProps) => {
  const navigate = useNavigate()

  const handleSuccess = (tag: BlogTag) => {
    notify.success("Success", `Tag "${tag.value}" created successfully`)
    navigate("/a/blog")
  }

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Heading>Create New Tag</Heading>
        <TagForm onSuccess={handleSuccess} />
      </div>
    </Container>
  )
}

export default NewBlogTag