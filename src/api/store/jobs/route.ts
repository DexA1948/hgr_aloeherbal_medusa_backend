// src/api/store/jobs/route.ts
import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import JobService from "../../../services/job"
import { JobStatus } from "../../../models/job"

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    try {
        const jobService: JobService = req.scope.resolve("jobService")

        // Using proper selector and config
        const jobs = await jobService.list(
            {
                status: JobStatus.PUBLISHED
            },
            {
                order: { created_at: "DESC" },
                select: ["id", "title", "handle", "department", "location",
                    "type", "experience_level", "description",
                    "requirements", "benefits", "salary_range",
                    "status", "created_at", "updated_at"]
            }
        )

        res.json({
            jobs,
        })
    } catch (error) {
        res.status(400).json({
            message: "An error occurred while fetching jobs",
            error: error.message,
        })
    }
}