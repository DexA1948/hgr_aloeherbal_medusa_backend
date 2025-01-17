// src/admin/routes/jobs/new/page.tsx
import { Container, Heading } from "@medusajs/ui"
import JobForm from "../shared/job-form"
import { useNavigate } from "react-router-dom"
import { RouteProps } from "@medusajs/admin"
import type { Job } from "../../../types/job"

const NewJob = ({ notify }: RouteProps) => {
    const navigate = useNavigate()

    const handleSuccess = (job: Job) => {
        notify.success("Success", `Job "${job.title}" created successfully`)
        navigate("/a/jobs")
    }

    return (
        <Container>
            <div className="flex flex-col gap-4">
                <Heading>Create New Job Listing</Heading>
                <JobForm onSuccess={handleSuccess} notify={notify} />
            </div>
        </Container>
    )
}

export default NewJob