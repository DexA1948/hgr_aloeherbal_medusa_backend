// src/admin/routes/blog/shared/post-form.tsx
import { useEffect, useState } from "react"
import {
  Input,
  Label,
  Button,
  Textarea,
  Switch,
  Select,
  RadioGroup,
  Text,
  Container,
} from "@medusajs/ui"
import { useAdminCustomPost, useAdminProducts, useAdminCollections, useAdminUsers } from "medusa-react"
import { useNavigate } from "react-router-dom"
import type {
  PostFormProps,
  BlogCategory,
  BlogTag,
  BlogPost,
  PostResponse,
  MetadataEntry,
  PostRequest
} from "../../../types/blog"
import { BellAlertSolid } from "@medusajs/icons"
// Add these imports at the top
import RichTextEditor from "../../../components/rich-text-editor"
import FeaturedImageUploader from "../../../components/common/featured-image-uploader"

const PostForm = ({ initialData, onSuccess, notify }: PostFormProps) => {
  const navigate = useNavigate()

  // Initialize form data with proper defaults
  const [formData, setFormData] = useState<BlogPost>({
    title: initialData?.title || "",
    handle: initialData?.handle || "",
    author: initialData?.author || "",
    published: initialData?.published || false,
    content: initialData?.content || "",
    description: initialData?.description || "",
    keywords: initialData?.keywords || [],
    category_id: initialData?.category_id || "",
    tag_ids: initialData?.tag_ids || initialData?.tags?.map(tag => tag.id) || [],
    product_ids: initialData?.product_ids || initialData?.products?.map(product => product.id) || [],
    collection_ids: initialData?.collection_ids || initialData?.collections?.map(collection => collection.id) || [],
    metadata: initialData?.metadata || {}
  })

  // Add isLoading state for category handling
  const [isLoading, setIsLoading] = useState(true)

  // Add new states for validation
  const [existingHandles, setExistingHandles] = useState<string[]>([])
  const [handleError, setHandleError] = useState<string>("")
  const [categoryError, setcategoryError] = useState<string>("")

  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [existingAuthors, setExistingAuthors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authorType, setAuthorType] = useState<'admin' | 'custom'>(
    initialData?.metadata?.authorType === 'admin' ? 'admin' : 'custom'
  )
  const [metadataEntries, setMetadataEntries] = useState<MetadataEntry[]>([])
  const [newMetadataKey, setNewMetadataKey] = useState("")
  const [newMetadataValue, setNewMetadataValue] = useState("")
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false)

  // Fetch admin users with search functionality
  const { users = [], isLoading: isLoadingUsers } = useAdminUsers()
  const { products } = useAdminProducts()
  const { collections } = useAdminCollections()

  // Update the mutation usage
  const createPost = useAdminCustomPost<PostRequest, PostResponse>(
    "/blog/posts",
    ["blog_posts"]
  )

  const updatePost = useAdminCustomPost<PostRequest, PostResponse>(
    `/blog/posts/${initialData?.id}`,
    ["blog_posts"]
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL || ''

        // Fetch all required data
        const [categoriesRes, tagsRes, postsRes] = await Promise.all([
          fetch(`${baseUrl}/store/blog/categories`),
          fetch(`${baseUrl}/store/blog/tags`),
          fetch(`${baseUrl}/store/blog/posts`)
        ])

        const categoriesData = await categoriesRes.json()
        const tagsData = await tagsRes.json()
        const postsData = await postsRes.json()

        // Set categories and tags
        const fetchedCategories = Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.categories || []
        setCategories(fetchedCategories)

        setTags(Array.isArray(tagsData) ? tagsData : tagsData.tags || [])

        // Handle posts data
        const posts = Array.isArray(postsData) ? postsData : postsData.posts || []

        // For handle management
        // Filter out current post's handle when editing
        const handles = posts
          .filter(post => initialData ? post.id !== initialData.id : true)
          .map(post => post.handle)
        setExistingHandles(handles)

        // Extract and set unique authors
        const authors = posts
          .filter((post): post is BlogPost =>
            post?.metadata?.authorType === 'custom' && typeof post.author === 'string'
          )
          .map(post => post.author)

        const uniqueAuthors = [...new Set(authors)].filter((author): author is string =>
          typeof author === 'string' && author.length > 0
        )

        setExistingAuthors(uniqueAuthors)

        // Initialize metadata entries from existing data
        if (initialData?.metadata) {
          const entries = Object.entries(initialData.metadata)
            .filter(([key]) => key !== 'authorType')
            .map(([key, value]) => ({
              key,
              value: String(value)
            }))
          setMetadataEntries(entries)
        }

        // Set author type from metadata or default to custom
        setAuthorType(initialData?.metadata?.authorType === 'admin' ? 'admin' : 'custom')
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [initialData])

  // Add debug logs in render to verify selections
  console.log('Form Data:', {
    tagIds: formData.tag_ids,
    productIds: formData.product_ids,
    collectionIds: formData.collection_ids
  })

  useEffect(() => {
    const newMetadata = {
      ...metadataEntries.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value
      }), {}),
      authorType
    }

    setFormData(prev => ({
      ...prev,
      metadata: newMetadata
    }))
  }, [metadataEntries, authorType])

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

  // A new function to handle title changes
  // Handle title change with handle generation
  const handleTitleChange = (value: string) => {
    if (initialData) {
      // If editing, only update title
      setFormData(prev => ({
        ...prev,
        title: value
      }))
    } else {
      // If creating new post, update both title and handle
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

  // src/admin/routes/blog/shared/post-form.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation checks for new posts
    if (!initialData) {
      if (existingHandles.includes(formData.handle)) {
        setHandleError("This handle already exists. Please modify the title.")
        return
      }

      if (!formData.category_id) {
        setcategoryError("Please select a category before creating the post")
        // Add notification for category error
        notify.error(
          "Category Required",
          "Please select a category before creating the post. Note that the category cannot be changed after creation."
        )
        return
      }
    }

    setIsSubmitting(true)
    const mutation = initialData ? updatePost : createPost

    try {
      mutation.mutate(formData, {
        onSuccess: (data) => {
          setIsSubmitting(false)
          if (data && data.id) {
            onSuccess(data)
            navigate("/a/blog")
          } else {
            console.error("Invalid response structure:", data)
            throw new Error("Invalid response structure")
          }
        },
        onError: (error) => {
          console.error("Error saving post:", error)
          setIsSubmitting(false)
          notify.error(
            "Error",
            "Failed to save the blog post. Please try again."
          )
        }
      })
    } catch (error) {
      console.error("Error in submission:", error)
      setIsSubmitting(false)
      notify.error(
        "Error",
        "An unexpected error occurred. Please try again."
      )
    }
  }

  // Filter author suggestions based on input
  const filteredAuthors = existingAuthors.filter(author =>
    author.toLowerCase().includes((formData.author || "").toLowerCase()) &&
    author !== formData.author
  )

  // If no categories exist, show message to create category first
  if (!isLoading && categories.length === 0) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <BellAlertSolid className="text-ui-fg-error w-12 h-12" />
          <Text className="text-ui-fg-error text-center">
            No categories available. Please create at least one category before creating blog posts.
          </Text>
          <Button
            variant="primary"
            onClick={() => navigate("/a/blog/categories/new")}
          >
            Create Category
          </Button>
        </div>
      </Container>
    )
  }

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

        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Category</Label>
          {!initialData && (
            <Text className="text-ui-fg-error text-sm mb-2 flex items-center gap-1">
              <BellAlertSolid />
              Please select a category carefully - it cannot be changed after creation
            </Text>
          )}
          <Select
            value={formData.category_id}
            onValueChange={(value) => {
              setFormData(prev => ({
                ...prev,
                category_id: value
              }))
              setcategoryError("") // Clear error when category is selected
            }}
            disabled={!!initialData}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select a category" />
            </Select.Trigger>
            <Select.Content>
              {categories.map((category) => (
                <Select.Item key={category.id} value={category.id}>
                  {category.title}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          {initialData && (
            <Text className="text-ui-fg-subtle text-sm mt-1">
              Category cannot be modified after creation
            </Text>
          )}
          {categoryError && (
            <Text className="text-ui-fg-error text-sm mt-2 flex items-center gap-1">
              <BellAlertSolid />
              {categoryError}
            </Text>
          )}
        </div>

        <div className="space-y-4">
          <Label>Author Type</Label>
          <RadioGroup
            value={authorType}
            onValueChange={(value: 'admin' | 'custom') => setAuthorType(value)}
          >
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroup.Item value="admin" id="admin" />
                <Label htmlFor="admin">Admin User</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroup.Item value="custom" id="custom" />
                <Label htmlFor="custom">Custom Author</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div>
          {authorType === 'admin' ? (
            <div>
              <Label htmlFor="author">Select Admin User</Label>
              <Select
                value={formData.author || ""}
                onValueChange={(value) => setFormData({
                  ...formData,
                  author: value
                })}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select an author" />
                </Select.Trigger>
                <Select.Content>
                  {isLoadingUsers ? (
                    <Select.Item value="loading">Loading users...</Select.Item>
                  ) : users.length === 0 ? (
                    <Select.Item value="no-author">No users available</Select.Item>
                  ) : (
                    users.map((user) => (
                      <Select.Item
                        key={user.id}
                        value={`${user.first_name} ${user.last_name}`.trim() || user.email}
                      >
                        {`${user.first_name} ${user.last_name}`.trim() || user.email}
                      </Select.Item>
                    ))
                  )}
                </Select.Content>
              </Select>
            </div>
          ) : (
            <div className="relative">
              <Label htmlFor="custom-author">Custom Author Name</Label>
              <Input
                id="custom-author"
                value={formData.author || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    author: e.target.value
                  })
                  setShowAuthorSuggestions(true)
                }}
                onFocus={() => setShowAuthorSuggestions(true)}
                placeholder="Enter author name"
              />
              {showAuthorSuggestions && filteredAuthors.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg"
                  onMouseLeave={() => setShowAuthorSuggestions(false)}
                >
                  {filteredAuthors.map((author) => (
                    <div
                      key={author}
                      className="px-4 py-2 cursor-pointer hover:bg-ui-bg-base-hover"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          author
                        })
                        setShowAuthorSuggestions(false)
                      }}
                    >
                      {author}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <FeaturedImageUploader
            value={formData.metadata?.featured_image || ""}
            onChange={(url) => setMetadataEntries([
              ...metadataEntries,
              { key: "featured_image", value: url }
            ])}
            onRemove={() => handleRemoveMetadata("featured_image")}
          />
        </div>

        <div>
          <Label htmlFor="content">Content</Label>
          <RichTextEditor
            content={formData.content || ""}
            onChange={(content) => setFormData({
              ...formData,
              content: content
            })}
            maxLength={50000}
          />
        </div>

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

        <div className="flex items-center gap-2">
          <Label htmlFor="published">Published</Label>
          <Switch
            id="published"
            checked={formData.published}
            onCheckedChange={(checked) => setFormData({
              ...formData,
              published: checked
            })}
          />
        </div>

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

        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  const newTagIds = formData.tag_ids || []
                  const index = newTagIds.indexOf(tag.id)
                  if (index === -1) {
                    setFormData({
                      ...formData,
                      tag_ids: [...newTagIds, tag.id]
                    })
                  } else {
                    setFormData({
                      ...formData,
                      tag_ids: newTagIds.filter((id) => id !== tag.id)
                    })
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors
                  ${formData.tag_ids?.includes(tag.id)
                    ? 'bg-ui-bg-base border-ui-border-base text-ui-fg-base'
                    : 'bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base'
                  }`}
              >
                {tag.value}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Related Products</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {products?.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  const newProductIds = formData.product_ids || []
                  const index = newProductIds.indexOf(product.id)
                  if (index === -1) {
                    setFormData({
                      ...formData,
                      product_ids: [...newProductIds, product.id]
                    })
                  } else {
                    setFormData({
                      ...formData,
                      product_ids: newProductIds.filter((id) => id !== product.id)
                    })
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors
                  ${formData.product_ids?.includes(product.id)
                    ? 'bg-ui-bg-base border-ui-border-base text-ui-fg-base'
                    : 'bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base'
                  }`}
              >
                {product.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Related Collections</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {collections?.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => {
                  const newCollectionIds = formData.collection_ids || []
                  const index = newCollectionIds.indexOf(collection.id)
                  if (index === -1) {
                    setFormData({
                      ...formData,
                      collection_ids: [...newCollectionIds, collection.id]
                    })
                  } else {
                    setFormData({
                      ...formData,
                      collection_ids: newCollectionIds.filter((id) => id !== collection.id)
                    })
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors
                  ${formData.collection_ids?.includes(collection.id)
                    ? 'bg-ui-bg-base border-ui-border-base text-ui-fg-base'
                    : 'bg-ui-bg-subtle border-ui-border-transparent text-ui-fg-subtle hover:border-ui-border-base'
                  }`}
              >
                {collection.title}
              </button>
            ))}
          </div>
        </div>

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

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => window.history.back()}
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

export default PostForm