// src/admin/routes/jobs/page.tsx
import { useEffect, useState } from 'react';
import {
    Container,
    Heading,
    Button,
    Table,
    Text,
    Badge,
    IconButton,
    Prompt,
} from '@medusajs/ui';
import { useNavigate } from 'react-router-dom';
import { useAdminCustomQuery, useAdminCustomDelete } from 'medusa-react';
import { RouteProps, RouteConfig } from "@medusajs/admin"
import { AcademicCap, PencilSquare, Trash } from "@medusajs/icons"
import { Job } from "../../types/job"

const JobList = ({ notify }: RouteProps) => {
    const [isLoading, setIsLoading] = useState(true)
    const [jobs, setJobs] = useState<Job[]>([])
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
    const navigate = useNavigate()

    // Fetch jobs using custom endpoint
    const { data, isLoading: isLoadingJobs } = useAdminCustomQuery<{ jobs: Job[] }>(
        '/admin/jobs',
        ['jobs']
    )

    // Delete mutation
    const deleteJob = useAdminCustomDelete(
        `/admin/jobs/${jobToDelete?.id}`,
        ['jobs']
    )

    useEffect(() => {
        if (!isLoadingJobs && data) {
            setJobs(data.jobs)
            setIsLoading(false)
        }
    }, [isLoadingJobs, data])

    const handleDelete = async () => {
        if (!jobToDelete) return

        try {
            await deleteJob.mutateAsync(undefined, {
                onSuccess: () => {
                    notify.success('Success', `Job "${jobToDelete.title}" was deleted`)
                    setJobToDelete(null)
                    // Refetch the jobs list
                    data?.jobs && setJobs(data.jobs.filter(j => j.id !== jobToDelete.id))
                },
                onError: (error) => {
                    notify.error('Error', `Failed to delete job: ${error.message}`)
                }
            })
        } catch (error) {
            notify.error('Error', 'An unexpected error occurred')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge color="green">Published</Badge>
            case 'draft':
                return <Badge color="grey">Draft</Badge>
            case 'closed':
                return <Badge color="red">Closed</Badge>
            default:
                return <Badge color="grey">{status}</Badge>
        }
    }

    if (isLoading) {
        return (
            <Container>
                <div className="flex items-center justify-center h-screen">
                    <Text>Loading job listings...</Text>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <Heading>Job Listings</Heading>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/a/jobs/new')}
                    >
                        Create Job Listing
                    </Button>
                </div>

                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Title</Table.HeaderCell>
                            <Table.HeaderCell>Department</Table.HeaderCell>
                            <Table.HeaderCell>Location</Table.HeaderCell>
                            <Table.HeaderCell>Type</Table.HeaderCell>
                            <Table.HeaderCell>Experience</Table.HeaderCell>
                            <Table.HeaderCell>Status</Table.HeaderCell>
                            <Table.HeaderCell>Applications</Table.HeaderCell>
                            <Table.HeaderCell>Actions</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {jobs?.map((job) => (
                            <Table.Row key={job.id}>
                                <Table.Cell>{job.title}</Table.Cell>
                                <Table.Cell>{job.department}</Table.Cell>
                                <Table.Cell>{job.location}</Table.Cell>
                                <Table.Cell>
                                    <Badge>{job.type}</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge>{job.experience_level}</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    {getStatusBadge(job.status)}
                                </Table.Cell>
                                <Table.Cell>
                                    {job.applications_count || 0}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2">
                                        <IconButton
                                            onClick={() => navigate(`/a/jobs/${job.id}`)}
                                        >
                                            <PencilSquare />
                                        </IconButton>
                                        <IconButton
                                            variant="primary"
                                            onClick={() => setJobToDelete(job)}
                                        >
                                            <Trash />
                                        </IconButton>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>

                {/* Delete Confirmation Dialog */}
                <Prompt open={!!jobToDelete}>
                    <Prompt.Content>
                        <Prompt.Header>
                            <Prompt.Title>Delete Job Listing</Prompt.Title>
                            <Prompt.Description>
                                Are you sure you want to delete "{jobToDelete?.title}"?
                                This action cannot be undone.
                            </Prompt.Description>
                        </Prompt.Header>
                        <Prompt.Footer>
                            <Prompt.Cancel onClick={() => setJobToDelete(null)}>
                                Cancel
                            </Prompt.Cancel>
                            <Prompt.Action onClick={handleDelete} >
                                Yes, delete
                            </Prompt.Action>
                        </Prompt.Footer>
                    </Prompt.Content>
                </Prompt>
            </div>
        </Container>
    )
}

// Add route configuration to show in sidebar
export const config: RouteConfig = {
    link: {
        label: "Jobs",
        icon: AcademicCap,
    },
}

export default JobList