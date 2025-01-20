// src/services/job.ts
import { Not } from "typeorm"
import { TransactionBaseService } from "@medusajs/medusa"
import { Job, JobStatus } from "../models/job"
import { FindConfig, Selector, buildQuery } from "@medusajs/medusa"
import { MedusaError } from "@medusajs/utils"
import { UpdateJobInput } from "src/admin/types/job"

class JobService extends TransactionBaseService {
    constructor(container) {
        super(container)
    }

    async listAndCount(
        selector?: Selector<Job>,
        config: FindConfig<Job> = {
            skip: 0,
            take: 20,
            relations: [],
        }
    ): Promise<[Job[], number]> {
        const jobRepo = this.activeManager_.getRepository(Job)
        const query = buildQuery(selector, config)
        return await jobRepo.findAndCount(query)
    }

    async list(
        selector?: Selector<Job>,
        config: FindConfig<Job> = {
            skip: 0,
            take: 20,
            relations: [],
        }
    ): Promise<Job[]> {
        const [jobs] = await this.listAndCount(selector, config)
        return jobs
    }

    async retrieve(
        id: string,
        config?: FindConfig<Job>
    ): Promise<Job> {
        const jobRepo = this.activeManager_.getRepository(Job)
        const query = buildQuery({
            id,
        }, config)

        const job = await jobRepo.findOne(query)

        if (!job) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                "Job posting not found"
            )
        }

        return job
    }

    async isHandleUnique(handle: string, excludeId?: string): Promise<boolean> {
        const jobRepo = this.activeManager_.getRepository(Job)
        const query: any = {
            where: { handle }
        }

        if (excludeId) {
            query.where = {
                handle,
                id: Not(excludeId)
            }
        }

        const existingJob = await jobRepo.findOne(query)
        return !existingJob
    }

    // Also update the create and update methods to handle unique checks

    async create(data: Partial<Job>): Promise<Job> {
        return this.atomicPhase_(async (manager) => {
            const jobRepo = manager.getRepository(Job)

            // Check handle uniqueness
            const isUnique = await this.isHandleUnique(data.handle)
            if (!isUnique) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "A job with this handle already exists"
                )
            }

            const job = jobRepo.create(data)
            const result = await jobRepo.save(job)

            return result
        })
    }

    async update(
        id: string,
        data: UpdateJobInput
    ): Promise<Job> {
        return await this.atomicPhase_(async (manager) => {
            const jobRepo = manager.getRepository(Job)
            const job = await this.retrieve(id)

            // We don't need to destructure handle anymore since it's not in the type
            Object.assign(job, data)

            return await jobRepo.save(job)
        })
    }

    async delete(id: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const jobRepo = manager.getRepository(Job)
            const job = await this.retrieve(id)

            await jobRepo.remove([job])
        })
    }

    async updateStatus(
        id: string,
        status: JobStatus
    ): Promise<Job> {
        return await this.update(id, { status })
    }

    async retrieveByHandle(
        handle: string,
        config?: FindConfig<Job>
    ): Promise<Job> {
        const jobRepo = this.activeManager_.getRepository(Job)
        const query = buildQuery({
            handle,
        }, config)

        const job = await jobRepo.findOne(query)

        if (!job) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                "Job was not found"
            )
        }

        return job
    }
}

export default JobService