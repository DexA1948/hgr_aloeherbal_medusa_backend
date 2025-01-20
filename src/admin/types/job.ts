// src/admin/types/jobs.ts
export enum JobStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    CLOSED = "closed"
}

export enum JobType {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    CONTRACT = "contract",
    INTERNSHIP = "internship"
}

export enum ExperienceLevel {
    ENTRY = "entry",
    MID = "mid",
    SENIOR = "senior",
    LEAD = "lead",
    EXECUTIVE = "executive"
}

// src/admin/types/job.ts
export interface Job {
    id?: string
    title: string
    handle: string
    department: string
    location: string
    type: JobType
    experience_level: ExperienceLevel
    description?: string | null
    requirements?: string | null
    benefits?: string | null
    salary_range?: string | null
    status: JobStatus
    applications_count?: number
    metadata?: Record<string, unknown> | null
    created_at?: Date
    updated_at?: Date
}

// Add this type for update operations
export type UpdateJobInput = Partial<Omit<Job, "id" | "handle">>

export interface JobFormProps {
    initialData?: Job
    onSuccess: (job: Job) => void
    notify: {
        success: (title: string, message: string) => void
        error: (title: string, message: string) => void
    }
}