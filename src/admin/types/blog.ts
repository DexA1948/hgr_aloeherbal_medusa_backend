// src/admin/types/blog.ts

// Base interfaces
export interface BlogPost {
  id?: string
  title: string
  handle: string
  author?: string
  published: boolean
  content?: string
  description?: string
  keywords?: string[]
  category_id?: string
  category?: BlogCategory
  tag_ids?: string[]
  tags?: BlogTag[]
  product_ids?: string[]
  products?: Product[]
  collection_ids?: string[]
  collections?: Collection[]
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface BlogCategory {
  id: string
  title: string
  handle: string
  description?: string
  keywords?: string[]
  metadata?: Record<string, any>
  posts?: BlogPost[]
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface BlogTag {
  id: string
  value: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface CategoryFormProps {
  initialData?: BlogCategory
  onSuccess: (category: BlogCategory) => void
}

export interface TagFormProps {
  initialData?: BlogTag
  onSuccess: (tag: BlogTag) => void
}

// Request/Response interfaces
export interface CategoryRequest extends Omit<BlogCategory,
  'id' |
  'created_at' |
  'updated_at' |
  'deleted_at' |
  'posts'
> { }

// Update response interface
export interface UpdateResponse {
  generatedMaps: any[]
  raw: any[]
  affected: number
}

// Modified Response interfaces to handle both create and update scenarios
export type CategoryResponse = BlogCategory | UpdateResponse
export type TagResponse = BlogTag | UpdateResponse

export interface TagRequest extends Omit<BlogTag,
  'id' |
  'created_at' |
  'updated_at' |
  'deleted_at'
> { }

// Deletion Warning interfaces
export interface CategoryDeletionData {
  category: BlogCategory
  postsToDelete: BlogPost[]
}

export interface DeleteConfirmationProps {
  itemToDelete: any
  deleteType: 'post' | 'category' | 'tag'
  onConfirm: () => void
  onCancel: () => void
  deletionData?: CategoryDeletionData
  isLoading?: boolean
}

export interface MetadataEntry {
  key: string
  value: string
}

export interface PostFormProps {
  initialData?: BlogPost
  onSuccess: (post: BlogPost) => void
  notify: {
    success: (title: string, message: string) => void
    error: (title: string, message: string) => void
    warn: (title: string, message: string) => void
    info: (title: string, message: string) => void
  }
}

// API Response types
export type PostResponse = BlogPost | UpdateResponse

// Request type - omit server-generated fields
export interface PostRequest extends Omit<BlogPost,
  'id' |
  'created_at' |
  'updated_at' |
  'deleted_at' |
  'category' |  // Omit expanded relations
  'tags' |
  'products' |
  'collections'
> { }

// Product interface based on the response
export interface Product {
  id: string
  title: string
  subtitle?: string | null
  description?: string
  handle: string
  is_giftcard: boolean
  status: string
  thumbnail?: string | null
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  hs_code?: string | null
  origin_country?: string | null
  mid_code?: string | null
  material?: string | null
  collection_id?: string | null
  type_id?: string | null
  discountable: boolean
  external_id?: string | null
  metadata?: Record<string, any> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Collection interface based on the response
export interface Collection {
  id: string
  title: string
  handle: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at: string | null
}