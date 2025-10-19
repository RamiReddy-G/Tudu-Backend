import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import User from '../models/User';
import OTP from '../models/OTP';
import { sendOTPEmail } from '../services/emailService';
import { Request, Response } from 'express';
import crypto from 'crypto';

const OTP_TTL_MIN = Number(process.env.OTP_TTL_MIN || 10);

function genOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

// Signup OTP request
export const signupRequestOTP = async (req: Request, res: Response) => {
  const { name, email, mobile, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const otpValue = genOTP();
  const hashed = crypto.createHash('sha256').update(otpValue).digest('hex');

  await OTP.create({
    email,
    otp: hashed,
    purpose: 'signup',
    expiresAt: dayjs().add(OTP_TTL_MIN, 'minute').toDate()
  });

  await sendOTPEmail(email, otpValue, 'Sign up');
  return res.json({ message: 'OTP sent to email' });
};

// Verify signup OTP
export const verifySignup = async (req: Request, res: Response) => {
  const { name, email, mobile, password, otp } = req.body;
  const record = await OTP.findOne({ email, purpose: 'signup', used: false }).sort({ createdAt: -1 });
  if (!record) return res.status(400).json({ message: 'No OTP found' });
  if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== record.otp) return res.status(400).json({ message: 'Invalid OTP' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, mobile, passwordHash });

  // Delete OTP immediately after use
  await OTP.deleteOne({ _id: record._id });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
};

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
};

// Request forgot password OTP
export const requestForgotPasswordOTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Email not registered' });

  const otpValue = genOTP();
  const hashed = crypto.createHash('sha256').update(otpValue).digest('hex');

  await OTP.create({
    email,
    otp: hashed,
    purpose: 'forgot_password',
    expiresAt: dayjs().add(OTP_TTL_MIN, 'minute').toDate()
  });

  await sendOTPEmail(email, otpValue, 'Reset password');
  return res.json({ message: 'OTP sent' });
};

// Verify forgot password OTP
export const verifyForgotPasswordOTP = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  const record = await OTP.findOne({ email, purpose: 'forgot_password', used: false }).sort({ createdAt: -1 });
  if (!record) return res.status(400).json({ message: 'OTP not found' });
  if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== record.otp) return res.status(400).json({ message: 'Invalid OTP' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await User.updateOne({ email }, { $set: { passwordHash } });

  // Delete OTP immediately after use
  await OTP.deleteOne({ _id: record._id });

  return res.json({ message: 'Password reset successful' });
};
