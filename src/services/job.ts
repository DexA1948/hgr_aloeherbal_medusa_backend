// src/services/job.ts
import { TransactionBaseService } from "@medusajs/medusa"
import { Job, JobStatus } from "../models/job"
import { FindConfig, Selector, buildQuery } from "@medusajs/medusa"
import { MedusaError } from "@medusajs/utils"

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

    async create(data: Partial<Job>): Promise<Job> {
        return this.atomicPhase_(async (manager) => {
            const jobRepo = manager.getRepository(Job)
            const job = jobRepo.create(data)
            const result = await jobRepo.save(job)

            return result
        })
    }

    async update(
        id: string,
        data: Omit<Partial<Job>, "id">
    ): Promise<Job> {
        return await this.atomicPhase_(async (manager) => {
            const jobRepo = manager.getRepository(Job)
            const job = await this.retrieve(id)

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
}

export default JobService