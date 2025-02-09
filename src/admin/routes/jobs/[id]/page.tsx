// src/admin/routes/jobs/[id]/page.tsx
import { useEffect, useState } from "react"
import { Container, Heading, Text } from "@medusajs/ui"
import JobForm from "../shared/job-form"
import { useNavigate, useParams } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import { useAdminCustomQuery } from "medusa-react"
import type { Job } from "../../../types/job"

const EditJob = ({ notify }: RouteProps) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [job, setJob] = useState<Job | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch job data using the service
    const { data, isLoading: isLoadingJob } = useAdminCustomQuery<{ job: Job }>(
        id ? `/admin/jobs/${id}` : null, // Only make request if id exists
        ["job", id],
    )

    useEffect(() => {
        if (!isLoadingJob && data?.job) {
            setJob(data.job)
            setIsLoading(false)
        }
    }, [isLoadingJob, data])

    const handleSuccess = (updatedJob: Job) => {
        notify.success("Success", `Job "${updatedJob.title}" updated successfully`)
        navigate("/a/jobs")
    }

    if (isLoading) {
        return (
            <Container>
                <div>
                    <Text>Loading job details...</Text>
                </div>
            </Container>
        )
    }

    if (!job) {
        return (
            <Container>
                <div className="flex flex-col gap-4">
                    <Text className="text-ui-fg-error">
                        Job listing not found
                    </Text>
                    <div>
                        <button
                            onClick={() => navigate("/a/jobs")}
                            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                        >
                            Back to job listings
                        </button>
                    </div>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="flex flex-col gap-4">
                <Heading>Edit Job: {job.title}</Heading>
                <JobForm
                    initialData={job}
                    onSuccess={handleSuccess}
                    notify={notify}
                />
            </div>
        </Container>
    )
}

export default EditJob