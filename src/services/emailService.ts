import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendOTPEmail(to: string, otp: string, purpose = 'Verify account') {
  const html = `<p>Your OTP for ${purpose} is <b>${otp}</b>. It expires in ${process.env.OTP_TTL_MIN} minutes.</p>`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Tudu - ${purpose} OTP`,
    html
  });
}
