import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import nodemailer from 'nodemailer';

interface SendEmailRequestBody {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    details: string;
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> => {
    const { firstName, lastName, email, phoneNumber, details } = req.body as SendEmailRequestBody;

    if (!firstName || !lastName || !email || !details) {
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

    // Email to admin
    const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: 'devkotadexant@gmail.com',
        replyTo: email,
        subject: `New Inquiry from ${firstName} ${lastName}`,
        text: `
📧 New General Inquiry

Customer Information:
------------------
Full Name: ${firstName} ${lastName}
Email Address: ${email}
Contact Number: ${phoneNumber || 'Not provided'}

Customer Message:
---------------
${details}

This inquiry was received through the Aloe Herbals contact form.
        `,
    };

    // Confirmation email to user
    const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Inquiry Received - Aloe Herbals',
        text: `
Dear ${firstName} ${lastName},

Thank you for reaching out to us. We have received your inquiry and will get back to you within 1-2 business days.

Your message details:

Customer Information:
------------------
Full Name: ${firstName} ${lastName}
Email Address: ${email}
Contact Number: ${phoneNumber || 'Not provided'}

Your Message:
-----------
${details}

Best regards,
Aloe Herbals Team
        `,
    };

    try {
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const GET = (
    req: MedusaRequest,
    res: MedusaResponse
): void => {
    res.json({
        message: "Please use POST to send an inquiry.",
    });
};