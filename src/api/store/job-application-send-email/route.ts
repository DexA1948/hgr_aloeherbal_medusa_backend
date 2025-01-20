// File: aloeherbal-medusa-backend/src/api/store/job-application-send-email/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import nodemailer from 'nodemailer';

interface JobApplicationRequestBody {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    coverLetter: string;
    jobTitle: string;
    attachments?: {
        filename: string;
        content: string; // Base64 encoded
        contentType: string;
    }[];
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> => {
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        coverLetter,
        jobTitle,
        attachments = []
    } = req.body as JobApplicationRequestBody;

    if (!firstName || !lastName || !email || !coverLetter || !jobTitle) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Process attachments
    const emailAttachments = attachments.map(attachment => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content, 'base64'),
        contentType: attachment.contentType
    }));

    // Email to HR/Admin
    const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: 'hr@aloeherbals.com',
        replyTo: email,
        subject: `New Job Application: ${jobTitle} from ${firstName} ${lastName}`,
        text: `
💼 New Job Application

Position Applied: ${jobTitle}

Applicant Information:
------------------
Full Name: ${firstName} ${lastName}
Email Address: ${email}
Contact Number: ${phoneNumber || 'Not provided'}

Cover Letter:
---------------
${coverLetter}

This application was received through the Aloe Herbals careers portal.
        `,
        attachments: emailAttachments
    };

    // Confirmation email to applicant
    const applicantMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Application Received - ${jobTitle} Position at Aloe Herbals`,
        text: `
Dear ${firstName} ${lastName},

Thank you for applying for the ${jobTitle} position at Aloe Herbals. We have received your application and will review it carefully.

Application Details:
------------------
Position: ${jobTitle}
Full Name: ${firstName} ${lastName}
Email Address: ${email}
Contact Number: ${phoneNumber || 'Not provided'}

Cover Letter:
---------------
${coverLetter}

What's Next?
-----------
Our HR team will review your application and get back to you within 5-7 business days if your qualifications match our requirements.

Best regards,
HR Team
Aloe Herbals
        `
    };

    try {
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(applicantMailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: error.message });
    }
};