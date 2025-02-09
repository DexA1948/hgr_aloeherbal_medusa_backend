// src/api/admin/jobs/route.ts
import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import JobService from "../../../services/job"

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    try {
        const jobService: JobService = req.scope.resolve("jobService")

        const jobs = await jobService.list(
            {},
            {
                order: { created_at: "DESC" }
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

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    try {
        const jobService: JobService = req.scope.resolve("jobService")
        const created = await jobService.create(req.body)

        res.json(created)
    } catch (error) {
        res.status(400).json({
            message: "An error occurred while creating the job",
            error: error.message,
        })
    }
}