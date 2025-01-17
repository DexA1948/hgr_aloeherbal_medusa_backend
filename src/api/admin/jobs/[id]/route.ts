// src/api/admin/jobs/[id]/route.ts
import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/medusa"
import JobService from "../../../../services/job"

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params

    try {
        const jobService: JobService = req.scope.resolve("jobService")

        const job = await jobService.retrieve(id)

        res.json({
            job,
        })
    } catch (error) {
        res.status(400).json({
            message: "An error occurred while fetching the job",
            error: error.message,
        })
    }
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params

    try {
        const jobService: JobService = req.scope.resolve("jobService")
        const updated = await jobService.update(id, req.body)
        res.json(updated)
    } catch (error) {
        res.status(400).json({
            message: "An error occurred while updating the job",
            error: error.message,
        })
    }
}

export const DELETE = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params

    try {
        const jobService: JobService = req.scope.resolve("jobService")
        await jobService.delete(id)
        res.status(200).json({
            id,
            object: "job",
            deleted: true,
        })
    } catch (error) {
        res.status(400).json({
            message: "An error occurred while deleting the job",
            error: error.message,
        })
    }
}