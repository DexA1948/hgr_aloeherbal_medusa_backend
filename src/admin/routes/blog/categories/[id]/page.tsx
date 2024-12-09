// src/admin/routes/blog/categories/[id]/page.tsx
import { useEffect, useState } from "react"
import { Container, Heading } from "@medusajs/ui"
import CategoryForm from "../../shared/category-form"
import { useNavigate, useParams } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import type { BlogCategory } from "../../../../types/blog"

const EditBlogCategory = ({ notify }: RouteProps) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState<BlogCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL
        const response = await fetch(`${baseUrl}/store/blog/categories`)

        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }

        const data = await response.json()
        const categories = Array.isArray(data) ? data : data.categories || []
        const foundCategory = categories.find(cat => cat.id === id)

        if (!foundCategory) {
          throw new Error("Category not found")
        }

        setCategory(foundCategory)
      } catch (error) {
        console.error("Error fetching category:", error)
        notify.error("Error", "Failed to load category")
        navigate("/a/blog")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchCategory()
    }
  }, [id])

  const handleSuccess = (updatedCategory: BlogCategory) => {
    notify.success("Success", `Category "${updatedCategory.title}" updated successfully`)
    navigate("/a/blog")
  }

  if (isLoading) {
    return (
      <Container>
        <div>Loading category...</div>
      </Container>
    )
  }

  if (!category) {
    return (
      <Container>
        <div>Category not found</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Heading>Edit Category: {category.title}</Heading>
        <CategoryForm
          initialData={category}
          onSuccess={handleSuccess}
        />
      </div>
    </Container>
  )
}

export default EditBlogCategory