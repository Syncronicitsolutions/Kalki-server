import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ✅ Create reusable transporter
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net', // GoDaddy SMTP
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,     // e.g. support@yourdomain.com
    pass: process.env.EMAIL_PASSWORD, // GoDaddy email password
  },
});

// ✅ Email Sender Function
async function sendMail(to: string, subject: string, html: string) {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new Error('Invalid recipient email');
  }

  const mailOptions = {
    from: `"Kalki Seva" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: html.replace(/<\/?[^>]+(>|$)/g, ""), // Plain text fallback
    replyTo: process.env.EMAIL_USER,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

// ✅ Route: POST /utils/test-email
router.post('/test-email', async (req: any, res: any) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ message: 'Recipient email is required' });
  }

  try {
    const info = await sendMail(
      to,
      '✅ Test Email from Kalki Seva',
      `<p>Hello,</p>
       <p>This is a <strong>test email</strong> sent from Kalki Seva backend via GoDaddy SMTP.</p>
       <p>If you received this, your SMTP configuration is working correctly.</p>
       <p>Regards,<br />Kalki Seva Team</p>`
    );

    res.status(200).json({ message: '✅ Test email sent', info });
  } catch (error: any) {
    console.error('❌ Failed to send test email:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message || 'Unknown error',
    });
  }
});

export default router;
