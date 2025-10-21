import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend client using your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(to: string, otp: string, purpose = 'Verify account') {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4F46E5;">Tudu Verification</h2>
      <p>Your OTP for <strong>${purpose}</strong> is:</p>
      <h3 style="font-size: 24px; color: #000;">${otp}</h3>
      <p>This code expires in ${process.env.OTP_TTL_MIN} minutes.</p>
      <p style="color: gray;">If you didn’t request this, please ignore this email.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `Tudu <noreply@${process.env.RESEND_DOMAIN}>`, // your verified domain
      to,
      subject: `Tudu - ${purpose} OTP`,
      html
    });

    if (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw error;
    }

    console.log('✅ OTP email sent:', data?.id);
    return data;
  } catch (err) {
    console.error('❌ Error sending OTP email:', err);
    throw err;
  }
}
