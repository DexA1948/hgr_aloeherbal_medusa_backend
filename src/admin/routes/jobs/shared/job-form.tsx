// src/admin/routes/shared/job-form.tsx
import { useState } from "react"
import {
    Input,
    Label,
    Button,
    Textarea,
    Select,
    Text,
} from "@medusajs/ui"
import { useAdminCustomPost } from "medusa-react"
import { useNavigate } from "react-router-dom"
import {
    JobFormProps,
    Job,
    JobStatus,
    JobType,
    ExperienceLevel
} from "../../../types/job"
import { BellAlertSolid } from "@medusajs/icons"

const JobForm = ({ initialData, onSuccess, notify }: JobFormProps) => {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<Partial<Job>>({
        title: initialData?.title || "",
        handle: initialData?.handle || "",
        department: initialData?.department || "",
        location: initialData?.location || "",
        type: initialData?.type || JobType.FULL_TIME,
        experience_level: initialData?.experience_level || ExperienceLevel.MID,
        description: initialData?.description || "",
        requirements: initialData?.requirements || "",
        benefits: initialData?.benefits || "",
        salary_range: initialData?.salary_range || "",
        status: initialData?.status || JobStatus.DRAFT,
        metadata: initialData?.metadata || {}
    })

    const createJob = useAdminCustomPost<Partial<Job>, Job>(
        "/admin/jobs",
        ["jobs"]
    )

    const updateJob = useAdminCustomPost<Partial<Job>, Job>(
        `/admin/jobs/${initialData?.id}`,
        ["jobs"]
    )

    const handleTitleChange = (value: string) => {
        const newHandle = value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        setFormData(prev => ({
            ...prev,
            title: value,
            handle: newHandle
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const mutation = initialData ? updateJob : createJob

        try {
            mutation.mutate(formData, {
                onSuccess: (data) => {
                    setIsSubmitting(false)
                    if (data && data.id) {
                        onSuccess(data)
                    } else {
                        throw new Error("Invalid response structure")
                    }
                },
                onError: (error) => {
                    console.error("Error saving job:", error)
                    setIsSubmitting(false)
                    notify.error(
                        "Error",
                        "Failed to save the job listing. Please try again."
                    )
                }
            })
        } catch (error) {
            console.error("Error in submission:", error)
            setIsSubmitting(false)
            notify.error(
                "Error",
                "An unexpected error occurred. Please try again."
            )
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-[900px]">
            <div className="grid gap-6">
                {/* Title Field */}
                <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        required
                    />
                </div>

                {/* Handle Field */}
                <div>
                    <Label htmlFor="handle">Handle</Label>
                    <Input
                        id="handle"
                        value={formData.handle}
                        disabled={true}
                        className="bg-ui-bg-disabled"
                    />
                    <Text className="text-ui-fg-subtle text-sm mt-1">
                        Handle is automatically generated from the title
                    </Text>
                </div>

                {/* Department Field */}
                <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({
                            ...formData,
                            department: e.target.value
                        })}
                        required
                    />
                </div>

                {/* Location Field */}
                <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({
                            ...formData,
                            location: e.target.value
                        })}
                        required
                    />
                </div>

                {/* Job Type Field */}
                <div>
                    <Label htmlFor="type">Job Type</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value: JobType) => setFormData({
                            ...formData,
                            type: value
                        })}
                    >
                        <Select.Trigger>
                            <Select.Value placeholder="Select job type" />
                        </Select.Trigger>
                        <Select.Content>
                            {Object.values(JobType).map((type) => (
                                <Select.Item key={type} value={type}>
                                    {type.replace('_', ' ')}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select>
                </div>

                {/* Experience Level Field */}
                <div>
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select
                        value={formData.experience_level}
                        onValueChange={(value: ExperienceLevel) => setFormData({
                            ...formData,
                            experience_level: value
                        })}
                    >
                        <Select.Trigger>
                            <Select.Value placeholder="Select experience level" />
                        </Select.Trigger>
                        <Select.Content>
                            {Object.values(ExperienceLevel).map((level) => (
                                <Select.Item key={level} value={level}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select>
                </div>

                {/* Description Field */}
                <div>
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea
                        id="description"
                        value={formData.description || ""}
                        onChange={(e) => setFormData({
                            ...formData,
                            description: e.target.value
                        })}
                        rows={6}
                        required
                    />
                </div>

                {/* Requirements Field */}
                <div>
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                        id="requirements"
                        value={formData.requirements || ""}
                        onChange={(e) => setFormData({
                            ...formData,
                            requirements: e.target.value
                        })}
                        rows={6}
                        required
                    />
                </div>

                {/* Benefits Field */}
                <div>
                    <Label htmlFor="benefits">Benefits</Label>
                    <Textarea
                        id="benefits"
                        value={formData.benefits || ""}
                        onChange={(e) => setFormData({
                            ...formData,
                            benefits: e.target.value
                        })}
                        rows={4}
                    />
                </div>

                {/* Salary Range Field */}
                <div>
                    <Label htmlFor="salary_range">Salary Range</Label>
                    <Input
                        id="salary_range"
                        value={formData.salary_range || ""}
                        onChange={(e) => setFormData({
                            ...formData,
                            salary_range: e.target.value
                        })}
                        placeholder="e.g. $50,000 - $70,000"
                    />
                </div>

                {/* Status Field */}
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value: JobStatus) => setFormData({
                            ...formData,
                            status: value
                        })}
                    >
                        <Select.Trigger>
                            <Select.Value placeholder="Select status" />
                        </Select.Trigger>
                        <Select.Content>
                            {Object.values(JobStatus).map((status) => (
                                <Select.Item key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => navigate("/a/jobs")}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : (initialData ? "Update" : "Create")}
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default JobForm