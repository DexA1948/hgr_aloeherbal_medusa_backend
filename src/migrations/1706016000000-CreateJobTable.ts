// src/migrations/1706016000000-CreateJobTable.ts
import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateJobTable1706016000000 implements MigrationInterface {
  name = "CreateJobTable1706016000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types first
    await queryRunner.query(`
      CREATE TYPE "job_type_enum" AS ENUM ('full_time', 'part_time', 'contract', 'internship')
    `)
    
    await queryRunner.query(`
      CREATE TYPE "job_experience_level_enum" AS ENUM ('entry', 'mid', 'senior', 'lead', 'executive')
    `)
    
    await queryRunner.query(`
      CREATE TYPE "job_status_enum" AS ENUM ('draft', 'published', 'closed')
    `)

    // Create the job table
    await queryRunner.query(`
      CREATE TABLE "job" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "title" character varying NOT NULL,
        "handle" character varying NOT NULL,
        "department" character varying NOT NULL,
        "location" character varying NOT NULL,
        "type" "job_type_enum" NOT NULL DEFAULT 'full_time',
        "experience_level" "job_experience_level_enum" NOT NULL DEFAULT 'mid',
        "description" text,
        "requirements" text,
        "benefits" text,
        "salary_range" character varying,
        "status" "job_status_enum" NOT NULL DEFAULT 'draft',
        "applications_count" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        CONSTRAINT "PK_job_id" PRIMARY KEY ("id")
      )
    `)

    // Create index on title
    await queryRunner.query(`
      CREATE INDEX "IDX_JOB_TITLE" ON "job" ("title")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table and indexes
    await queryRunner.query(`DROP INDEX "IDX_JOB_TITLE"`)
    await queryRunner.query(`DROP TABLE "job"`)
    
    // Drop ENUM types
    await queryRunner.query(`DROP TYPE "job_status_enum"`)
    await queryRunner.query(`DROP TYPE "job_experience_level_enum"`)
    await queryRunner.query(`DROP TYPE "job_type_enum"`)
  }
}