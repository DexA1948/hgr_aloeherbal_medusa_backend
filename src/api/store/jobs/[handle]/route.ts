// src/api/store/jobs/[handle]/route.ts
import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import JobService from "../../../../services/job"
import { JobStatus } from "../../../../models/job"

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { handle } = req.params

    try {
        const jobService: JobService = req.scope.resolve("jobService")

        try {
            // Using proper selector pattern
            const job = await jobService.retrieveByHandle(
                handle,
                {
                    select: ["id", "title", "handle", "department", "location",
                        "type", "experience_level", "description",
                        "requirements", "benefits", "salary_range",
                        "status", "created_at", "updated_at"],
                }
            )

            // Check status after retrieval
            if (job.status !== JobStatus.PUBLISHED) {
                return res.status(404).json({
                    message: "Job not found or not published"
                })
            }

            res.json({ job })
        } catch (error) {
            // If the job is not found, return 404
            if (error.type === "not_found") {
                return res.status(404).json({
                    message: "Job not found or not published"
                })
            }
            throw error
        }
    } catch (error) {
        res.status(400).json({
            message: "An error occurred while fetching the job",
            error: error.message,
        })
    }
}