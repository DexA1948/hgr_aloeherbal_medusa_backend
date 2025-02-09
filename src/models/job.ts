// src/models/job.ts
import {
    BeforeInsert,
    Column,
    Entity,
    PrimaryColumn,
    Index,
} from "typeorm"
import { BaseEntity } from "@medusajs/medusa"
import { generateEntityId } from "@medusajs/medusa/dist/utils"

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

@Entity()
export class Job extends BaseEntity {
    @Index()
    @Column({ type: "varchar" })
    title: string

    @Column({ type: "varchar" })
    handle: string

    @Column({ type: "varchar" })
    department: string

    @Column({ type: "varchar" })
    location: string

    @Column({
        type: "enum",
        enum: JobType,
        default: JobType.FULL_TIME
    })
    type: JobType

    @Column({
        type: "enum",
        enum: ExperienceLevel,
        default: ExperienceLevel.MID
    })
    experience_level: ExperienceLevel

    @Column({ type: "text", nullable: true })
    description: string | null

    @Column({ type: "text", nullable: true })
    requirements: string | null

    @Column({ type: "text", nullable: true })
    benefits: string | null

    @Column({ type: "varchar", nullable: true })
    salary_range: string | null

    @Column({
        type: "enum",
        enum: JobStatus,
        default: JobStatus.DRAFT
    })
    status: JobStatus

    @Column({ type: "int", default: 0 })
    applications_count: number

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown> | null

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "job")
    }
}