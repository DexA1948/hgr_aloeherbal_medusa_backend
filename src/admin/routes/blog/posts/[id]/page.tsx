// src/admin/routes/blog/posts/[id]/page.tsx

import { useEffect, useState } from "react"
import { Container, Heading } from "@medusajs/ui"
import PostForm from "../../shared/post-form"
import { useNavigate, useParams } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import type { BlogPost } from "../../../../types/blog"

const EditBlogPost = ({ notify }: RouteProps) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL
        const response = await fetch(`${baseUrl}/store/blog/posts`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch posts")
        }

        const data = await response.json()
        const posts = Array.isArray(data) ? data : data.posts || []
        const foundPost = posts.find(post => post.id === id)

        if (!foundPost) {
          throw new Error("Post not found")
        }

        setPost(foundPost)
      } catch (error) {
        console.error("Error fetching post:", error)
        notify.error("Error", "Failed to load blog post")
        navigate("/a/blog")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchPost()
    }
  }, [id])

  const handleSuccess = (updatedPost: BlogPost) => {
    notify.success("Success", `Post "${updatedPost.title}" updated successfully`)
    navigate("/a/blog")
  }

  if (isLoading) {
    return (
      <Container>
        <div>Loading post...</div>
      </Container>
    )
  }

  if (!post) {
    return (
      <Container>
        <div>Post not found</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Heading>Edit Blog Post: {post.title}</Heading>
        <PostForm 
          initialData={post}
          onSuccess={handleSuccess} 
          notify={notify}
        />
      </div>
    </Container>
  )
}

export default EditBlogPost