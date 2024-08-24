import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import nodemailer from 'nodemailer';

// Define an interface for the expected request body
interface SendEmailRequestBody {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string; // Optional field
    details: string;
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> => {
    // Assert that req.body is of type SendEmailRequestBody
    const { firstName, lastName, email, phoneNumber, details } = req.body as SendEmailRequestBody;

    if (!firstName || !lastName || !email || !details) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // or any other email service provider
        auth: {
            user: process.env.EMAIL_USER, // your email address
            pass: process.env.EMAIL_PASS, // your email password
        },
    });

    const mailOptions = {
        from: email,
        to: 'devkotadexant@gmail.com',
        subject: `New Inquiry from ${firstName} ${lastName}`,
        text: `
      Name: ${firstName} ${lastName}
      Email: ${email}
      Phone: ${phoneNumber || 'N/A'}
      Message: ${details}
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
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
