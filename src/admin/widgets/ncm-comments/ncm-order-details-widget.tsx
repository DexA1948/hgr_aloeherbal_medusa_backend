// src/admin/widgets/ncm-order-details-widget.tsx

import { useEffect, useState } from "react"
import { WidgetConfig, WidgetProps } from "@medusajs/admin"
import {
    Container,
    Heading,
    Table,
    Text,
    Badge,
    FocusModal,
    Button,
    Input,
    Label,
    IconButton
} from "@medusajs/ui"
import { ArrowLeft, ArrrowRight } from "@medusajs/icons"
import type {
    NCMComment,
    NCMOrderDetails,
    NCMOrderStatus
} from "../../../types/ncm"

type Props = WidgetProps & {
    order: any // The order object passed from Medusa
}

const NCMOrderDetailsWidget = ({ order, notify }: Props) => {
    const [comments, setComments] = useState<NCMComment[]>([])
    const [orderDetails, setOrderDetails] = useState<NCMOrderDetails | null>(null)
    const [orderStatuses, setOrderStatuses] = useState<NCMOrderStatus[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [currentFulfillmentIndex, setCurrentFulfillmentIndex] = useState(0)

    // Get NCM fulfillments from order
    const ncmFulfillments = order.fulfillments?.filter(
        (f: any) => f.provider_id === "ncm-fullfillment" && f.data?.orderid
    ) || []

    const currentNcmOrderId = ncmFulfillments[currentFulfillmentIndex]?.data?.orderid

    const canNavigateNext = currentFulfillmentIndex < ncmFulfillments.length - 1
    const canNavigatePrev = currentFulfillmentIndex > 0

    const fetchNCMData = async () => {
        if (!currentNcmOrderId) return

        try {
            setIsLoading(true)
            setError(null)

            const [commentsRes, detailsRes, statusesRes] = await Promise.all([
                fetch(`/admin/ncm/comments/${currentNcmOrderId}`),
                fetch(`/admin/ncm/order/${currentNcmOrderId}`),
                fetch(`/admin/ncm/status/${currentNcmOrderId}`)
            ])

            if (!detailsRes.ok || !statusesRes.ok) {
                throw new Error("Failed to fetch NCM data")
            }

            const [commentsData, detailsData, statusesData] = await Promise.all([
                commentsRes.json(),
                detailsRes.json(),
                statusesRes.json()
            ])

            // Handle no comments case
            const validComments = commentsData.detail === "No comments found" ? [] : commentsData

            setComments(validComments)
            setOrderDetails(detailsData)
            setOrderStatuses(statusesData)
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred"
            setError(message)
            notify.error("Error", message)
        } finally {
            setIsLoading(false)
        }
    }

    const postComment = async () => {
        if (!currentNcmOrderId || !newComment.trim()) return

        try {
            const response = await fetch(`/admin/ncm/comments/${currentNcmOrderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comments: newComment
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to post comment')
            }

            notify.success('Success', 'Comment posted successfully')
            setNewComment("")
            await fetchNCMData() // Refresh comments
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred"
            notify.error("Error", message)
        }
    }

    useEffect(() => {
        if (currentNcmOrderId) {
            fetchNCMData()
        }
    }, [currentNcmOrderId])

    if (ncmFulfillments.length === 0) return null

    if (isLoading) {
        return (
            <Container>
                <div className="w-full flex items-center justify-center p-6">
                    <Text>Loading NCM data...</Text>
                </div>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <div className="bg-ui-bg-base-error p-4 rounded-lg">
                    <Text className="text-ui-fg-error">{error}</Text>
                </div>
            </Container>
        )
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString()
    }

    return (
        <>
            <Container>
                <div className="px-4 space-y-6">
                    {/* Fulfillment Navigation Header */}
                    <div className="flex items-center justify-between mb-4">
                        <Text className="text-ui-fg-subtle">
                            There are {ncmFulfillments.length} NCM fulfillments associated with this order.
                        </Text>
                        <div className="flex items-center gap-2">
                            <IconButton
                                onClick={() => setCurrentFulfillmentIndex(prev => prev - 1)}
                                disabled={!canNavigatePrev}
                            >
                                <ArrowLeft />
                            </IconButton>
                            <Text>
                                Fulfillment {currentFulfillmentIndex + 1}: NCM #{currentNcmOrderId}
                            </Text>
                            <IconButton
                                onClick={() => setCurrentFulfillmentIndex(prev => prev + 1)}
                                disabled={!canNavigateNext}
                            >
                                <ArrrowRight />
                            </IconButton>
                        </div>
                    </div>

                    {/* Order Details Section */}
                    <div>
                        <Heading level="h2">NCM Order Details</Heading>
                        {orderDetails && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <Text className="text-ui-fg-subtle">NCM Order ID</Text>
                                    <Text>{orderDetails.orderid}</Text>
                                </div>
                                <div>
                                    <Text className="text-ui-fg-subtle">COD Charge</Text>
                                    <Text>{orderDetails.cod_charge}</Text>
                                </div>
                                <div>
                                    <Text className="text-ui-fg-subtle">Delivery Charge</Text>
                                    <Text>{orderDetails.delivery_charge}</Text>
                                </div>
                                <div>
                                    <Text className="text-ui-fg-subtle">Delivery Status</Text>
                                    <Badge>{orderDetails.last_delivery_status}</Badge>
                                </div>
                                <div>
                                    <Text className="text-ui-fg-subtle">Tracking ID</Text>
                                    <Text>{orderDetails.trackid}</Text>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Status Section */}
                    <div>
                        <div className="flex items-center justify-between">
                            <Heading level="h2">NCM Order Status</Heading>
                        </div>
                        <Table className="mt-4">
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>Status</Table.HeaderCell>
                                    <Table.HeaderCell>Date</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {orderStatuses.map((status, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell>
                                            <Badge>{status.status}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>{formatDate(status.added_time)}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>

                    {/* Comments Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <Heading level="h2">NCM Comments</Heading>
                            <Button
                                variant="primary"
                                onClick={() => setIsModalOpen(true)}
                            >
                                Add Comment
                            </Button>
                        </div>
                        <Table>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>Comment</Table.HeaderCell>
                                    <Table.HeaderCell>Added By</Table.HeaderCell>
                                    <Table.HeaderCell>Date</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {comments && comments.length > 0 ? (
                                    comments.map((comment, index) => (
                                        <Table.Row key={`${comment.orderid}-${index}`}>
                                            <Table.Cell>{comment.comments}</Table.Cell>
                                            <Table.Cell>{comment.addedBy}</Table.Cell>
                                            <Table.Cell>{formatDate(comment.added_time)}</Table.Cell>
                                        </Table.Row>
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell className="text-center text-ui-fg-subtle">
                                            No comments yet
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    </div>

                    {/* Add Comment Modal */}
                    <FocusModal open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <FocusModal.Content>
                            <FocusModal.Header>
                                <Button
                                    variant="primary"
                                    onClick={async () => {
                                        await postComment()
                                        setIsModalOpen(false)
                                    }}
                                >
                                    Submit
                                </Button>
                            </FocusModal.Header>
                            <FocusModal.Body className="flex flex-col items-center py-16">
                                <div className="flex w-full max-w-lg flex-col gap-y-8">
                                    <div className="flex flex-col gap-y-1">
                                        <Heading>Add Comment</Heading>
                                        <Text className="text-ui-fg-subtle">
                                            Add a comment to this NCM order.
                                        </Text>
                                    </div>
                                    <div className="flex flex-col gap-y-2">
                                        <Label htmlFor="comment">Comment</Label>
                                        <Input
                                            id="comment"
                                            placeholder="Enter your comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </FocusModal.Body>
                        </FocusModal.Content>
                    </FocusModal>
                </div>
            </Container>
            <div className="m-2"></div>
        </>
    )
}

export const config: WidgetConfig = {
    zone: "order.details.before",
}

export default NCMOrderDetailsWidget