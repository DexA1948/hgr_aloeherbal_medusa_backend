// src/admin/routes/blog/page.tsx
import { useEffect, useState } from 'react';
import { Container, Heading, Button, Text, Table, Tabs, Prompt } from '@medusajs/ui';
import { useNavigate } from 'react-router-dom';
import { useAdminCustomDelete } from 'medusa-react';
import { RouteProps, RouteConfig } from "@medusajs/admin"
import { BellAlertSolid, Newspaper } from "@medusajs/icons"
import type { BlogPost, BlogCategory, BlogTag, CategoryDeletionData } from "../../types/blog"

const BlogManagement = ({ notify }: RouteProps) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [blogTags, setBlogTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'post' | 'category' | 'tag' | null>(null);
  const [categoryDeletionData, setCategoryDeletionData] = useState<CategoryDeletionData | null>(null);
  const navigate = useNavigate();

  // Custom delete hooks for different entities
  const deletePostMutation = useAdminCustomDelete(
    `/blog/posts/${itemToDelete?.id || ''}`,
    ['blog_posts']
  );
  const deleteCategoryMutation = useAdminCustomDelete(
    `/blog/categories/${itemToDelete?.id || ''}`,
    ['blog_categories']
  );
  const deleteTagMutation = useAdminCustomDelete(
    `/blog/tags/${itemToDelete?.id || ''}`,
    ['blog_tags']
  );

  // Fetch data for all entities
  const fetchBlogData = async () => {
    try {
      const baseUrl = process.env.MEDUSA_ADMIN_BACKEND_URL;

      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch(`${baseUrl}/store/blog/posts`),
        fetch(`${baseUrl}/store/blog/categories`),
        fetch(`${baseUrl}/store/blog/tags`)
      ]);

      const [postsData, categoriesData, tagsData] = await Promise.all([
        postsRes.json(),
        categoriesRes.json(),
        tagsRes.json()
      ]);

      setBlogPosts(Array.isArray(postsData) ? postsData : postsData.posts || []);
      setBlogCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []);
      setBlogTags(Array.isArray(tagsData) ? tagsData : tagsData.tags || []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
      notify.error("Fetch Error", "Failed to load blog data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogData();
  }, []);

  // Prepare deletion data for categories
  const handleDeleteInitiation = async (item: any, type: 'post' | 'category' | 'tag') => {
    setDeleteType(type);
    setItemToDelete(item);

    if (type === 'category') {
      // Find posts that belong to this category
      const postsToDelete = blogPosts.filter(post => post.category_id === item.id);
      setCategoryDeletionData({
        category: item,
        postsToDelete
      });
    } else {
      setCategoryDeletionData(null);
    }

    setShowDeleteDialog(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !deleteType) return;

    let mutation, successMessage;
    switch (deleteType) {
      case 'post':
        mutation = deletePostMutation;
        successMessage = `Post "${itemToDelete.title}" has been deleted`;
        break;
      case 'category':
        mutation = deleteCategoryMutation;
        successMessage = `Category "${itemToDelete.title}" has been deleted`;
        break;
      case 'tag':
        mutation = deleteTagMutation;
        successMessage = `Tag "${itemToDelete.value}" has been deleted`;
        break;
    }

    try {
      await mutation.mutateAsync(void 0, {
        onSuccess: () => {
          // Update local state based on delete type
          switch (deleteType) {
            case 'post':
              setBlogPosts(prev => prev.filter(post => post.id !== itemToDelete.id));
              break;
            case 'category':
              setBlogCategories(prev => prev.filter(cat => cat.id !== itemToDelete.id));
              setBlogPosts(prev => prev.filter(post => post.category_id !== itemToDelete.id));
              break;
            case 'tag':
              setBlogTags(prev => prev.filter(tag => tag.id !== itemToDelete.id));
              break;
          }

          notify.success("Deleted", successMessage);
          handleDeleteCancel();
        },
        onError: (error) => {
          console.error(`Error deleting ${deleteType}:`, error);
          notify.error("Delete Error", `Failed to delete ${deleteType}`);
        }
      });
    } catch (error) {
      console.error(`Error in ${deleteType} deletion:`, error);
      notify.error("Delete Error", `An error occurred while deleting ${deleteType}`);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setItemToDelete(null);
    setDeleteType(null);
    setCategoryDeletionData(null);
  };

  // Navigation handlers
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (isLoading) return <Text>Loading blog data...</Text>;

  return (
    <Container>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <Tabs.List>
          <Tabs.Trigger value="posts">Blog Posts</Tabs.Trigger>
          <Tabs.Trigger value="categories">Categories</Tabs.Trigger>
          <Tabs.Trigger value="tags">Tags</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="posts">
          <div className="flex justify-between items-center mb-4">
            <Heading>Blog Posts</Heading>
            <Button
              variant="primary"
              onClick={() => handleNavigate('/a/blog/posts/new')}
            >
              Create New Post
            </Button>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell>Author</Table.HeaderCell>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Published</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {blogPosts?.map((post) => (
                <Table.Row key={post.id}>
                  <Table.Cell>{post.title}</Table.Cell>
                  <Table.Cell>{post.author || 'N/A'}</Table.Cell>
                  <Table.Cell>{post.category?.title || 'Uncategorized'}</Table.Cell>
                  <Table.Cell>{post.published ? 'Yes' : 'No'}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleNavigate(`/a/blog/posts/${post.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDeleteInitiation(post, 'post')}
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Tabs.Content>

        <Tabs.Content value="categories">
          <div className="flex justify-between items-center mb-4">
            <Heading>Blog Categories</Heading>
            <Button
              variant="primary"
              onClick={() => handleNavigate('/a/blog/categories/new')}
            >
              Create New Category
            </Button>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell>Handle</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Post Count</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {blogCategories?.map((category) => (
                <Table.Row key={category.id}>
                  <Table.Cell>{category.title}</Table.Cell>
                  <Table.Cell>{category.handle}</Table.Cell>
                  <Table.Cell>{category.description || 'N/A'}</Table.Cell>
                  <Table.Cell>
                    {blogPosts.filter(post => post.category_id === category.id).length}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleNavigate(`/a/blog/categories/${category.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDeleteInitiation(category, 'category')}
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Tabs.Content>

        <Tabs.Content value="tags">
          <div className="flex justify-between items-center mb-4">
            <Heading>Blog Tags</Heading>
            <Button
              variant="primary"
              onClick={() => handleNavigate('/a/blog/tags/new')}
            >
              Create New Tag
            </Button>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Tag Value</Table.HeaderCell>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {blogTags?.map((tag) => (
                <Table.Row key={tag.id}>
                  <Table.Cell>{tag.value}</Table.Cell>
                  <Table.Cell>{tag.id}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleNavigate(`/a/blog/tags/${tag.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDeleteInitiation(tag, 'tag')}
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Tabs.Content>
      </Tabs>

      {showDeleteDialog && (
        <Prompt open={showDeleteDialog}>
          <Prompt.Content>
            <Prompt.Header>
              <Prompt.Title>
                Delete {deleteType?.charAt(0).toUpperCase() + deleteType?.slice(1)}
              </Prompt.Title>
              <Prompt.Description>
                {deleteType === "post" && (
                  `Are you sure you want to delete the post "${itemToDelete?.title}"?`
                )}
                {deleteType === "category" && (
                  <div className="space-y-4">
                    <Text>
                      Are you sure you want to delete the category "{itemToDelete?.title}"?
                    </Text>
                    {categoryDeletionData?.postsToDelete &&
                      categoryDeletionData.postsToDelete.length > 0 && (
                        <div className="bg-ui-bg-base-error p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <BellAlertSolid className="text-ui-fg-error w-5 h-5 mt-0.5" />
                            <div className="space-y-2">
                              <Text className="font-semibold text-ui-fg-error">
                                Warning: This will also delete the following posts:
                              </Text>
                              <ul className="list-disc list-inside space-y-1">
                                {categoryDeletionData.postsToDelete.map((post) => (
                                  <li key={post.id} className="text-ui-fg-error">
                                    {post.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {deleteType === "tag" && (
                  `Are you sure you want to delete the tag "${itemToDelete?.value}"?`
                )}
                <Text className="mt-2">
                  This action cannot be undone.
                </Text>
              </Prompt.Description>
            </Prompt.Header>
            <Prompt.Footer>
              <Prompt.Cancel onClick={handleDeleteCancel}>
                Cancel
              </Prompt.Cancel>
              <Prompt.Action
                onClick={handleDeleteConfirm}
                disabled={
                  deletePostMutation.isLoading ||
                  deleteCategoryMutation.isLoading ||
                  deleteTagMutation.isLoading
                }
              >
                {(deletePostMutation.isLoading ||
                  deleteCategoryMutation.isLoading ||
                  deleteTagMutation.isLoading)
                  ? "Deleting..."
                  : "Delete"
                }
              </Prompt.Action>
            </Prompt.Footer>
          </Prompt.Content>
        </Prompt>
      )}

    </Container>
  );
};

export const config: RouteConfig = {
  link: {
    label: "Blog Management",
    icon: Newspaper,
  },
}

export default BlogManagement;