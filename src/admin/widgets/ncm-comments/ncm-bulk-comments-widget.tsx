// src/admin/widgets/ncm-bulk-comments-widget.tsx

import { useEffect, useState } from "react"
import { WidgetConfig, WidgetProps } from "@medusajs/admin"
import { Container, Heading, Table, Text, IconButton } from "@medusajs/ui"
import type { NCMComment } from "../../../types/ncm"
import { ArrowLeft, ArrrowRight, CloudArrowDown } from "@medusajs/icons"

const ITEMS_PER_PAGE = 10

const NCMBulkCommentsWidget = ({ notify }: WidgetProps) => {
    const [comments, setComments] = useState<NCMComment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(0)

    const validateComments = (data: any): NCMComment[] => {
        if (!data) return []
        if (Array.isArray(data)) return data
        return []
    }

    const fetchComments = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/admin/ncm')
            if (!response.ok) {
                throw new Error("Failed to fetch comments")
            }

            const { comments } = await response.json()
            setComments(validateComments(comments))
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred"
            setError(message)
            notify.error("Error", message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchComments()
    }, [])

    // Calculate pagination values
    const pageCount = Math.ceil(comments.length / ITEMS_PER_PAGE)
    const canNextPage = currentPage < pageCount - 1
    const canPreviousPage = currentPage > 0
    const paginatedComments = comments.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    )

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString()
    }

    // Render loading state
    if (isLoading) {
        return (
            <Container>
                <div className="w-full flex items-center justify-center p-6">
                    <Text>Loading NCM comments...</Text>
                </div>
            </Container>
        )
    }

    // Render error state
    if (error) {
        return (
            <Container>
                <div className="bg-ui-bg-base-error p-4 rounded-lg">
                    <Text className="text-ui-fg-error">{error}</Text>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="px-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Heading level="h2">NCM Recent Comments</Heading>
                        <Text className="text-ui-fg-subtle">
                            Showing recent comments from Nepal Can Move
                        </Text>
                    </div>
                    <IconButton
                        onClick={fetchComments}
                    >
                        <CloudArrowDown />
                    </IconButton>
                </div>

                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Order ID</Table.HeaderCell>
                            <Table.HeaderCell>Comment</Table.HeaderCell>
                            <Table.HeaderCell>Added By</Table.HeaderCell>
                            <Table.HeaderCell>Date</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {paginatedComments.length > 0 ? (
                            paginatedComments.map((comment, index) => (
                                <Table.Row key={`${comment.orderid}-${index}`}>
                                    <Table.Cell>{comment.orderid}</Table.Cell>
                                    <Table.Cell>{comment.comments}</Table.Cell>
                                    <Table.Cell>{comment.addedBy}</Table.Cell>
                                    <Table.Cell>{formatDate(comment.added_time)}</Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row>
                                <Table.Cell className="text-center text-ui-fg-subtle">
                                    No comments found
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>

                {/* Pagination Controls */}
                {comments.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                        <Text className="text-ui-fg-subtle">
                            Page {currentPage + 1} of {pageCount}
                        </Text>
                        <div className="flex items-center gap-2">
                            <IconButton
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={!canPreviousPage}
                            >
                                <ArrowLeft/>
                            </IconButton>
                            <IconButton
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={!canNextPage}
                            >
                                <ArrrowRight/>
                            </IconButton>
                        </div>
                        <Text className="text-ui-fg-subtle">
                            Total {comments.length} comments
                        </Text>
                    </div>
                )}
            </div>
        </Container>
    )
}

export const config: WidgetConfig = {
    zone: "order.list.after"  // Show after the orders list
}

export default NCMBulkCommentsWidget