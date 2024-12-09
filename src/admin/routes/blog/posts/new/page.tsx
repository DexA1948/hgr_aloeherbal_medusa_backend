import { Container, Heading } from "@medusajs/ui"
import PostForm from "../../shared/post-form"
import { useNavigate } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import type { BlogPost } from "../../../../types/blog"

const NewBlogPost = ({ notify }: RouteProps) => {
  const navigate = useNavigate()

  const handleSuccess = (post: BlogPost) => {
    notify.success("Success", `Post "${post.title}" created successfully`)
    navigate("/a/blog")
  }

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Heading>Create New Blog Post</Heading>
        <PostForm onSuccess={handleSuccess} notify={notify} />
      </div>
    </Container>
  )
}

export default NewBlogPost