// src/admin/routes/blog/categories/new/page.tsx
import { Container, Heading } from "@medusajs/ui"
import CategoryForm from "../../shared/category-form"
import { useNavigate } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import type { BlogCategory } from "../../../../types/blog"

const NewBlogCategory = ({ notify }: RouteProps) => {
  const navigate = useNavigate()

  const handleSuccess = (category: BlogCategory) => {
    notify.success("Success", `Category "${category.title}" created successfully`)
    navigate("/a/blog")
  }

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Heading>Create New Category</Heading>
        <CategoryForm onSuccess={handleSuccess} />
      </div>
    </Container>
  )
}

export default NewBlogCategory