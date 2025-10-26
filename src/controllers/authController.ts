import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dayjs from 'dayjs';
import User from '../models/User';
import OTP from '../models/OTP';
import { sendOTPEmail } from '../services/emailService';
import { Request, Response } from 'express';
import crypto from 'crypto';

const OTP_TTL_MIN = Number(process.env.OTP_TTL_MIN || 10);

function genOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// ✅ Helper: Create JWT safely for TS v5 + jsonwebtoken v9
function createToken(payload: object): string {
  const secret: Secret = process.env.JWT_SECRET!;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as unknown as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
}

// ✅ SIGNUP — Request OTP
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
    expiresAt: dayjs().add(OTP_TTL_MIN, 'minute').toDate(),
  });

  await sendOTPEmail(email, otpValue, 'Sign up');
  return res.json({ message: 'OTP sent to email' });
};

// ✅ SIGNUP — Verify OTP and create account
export const verifySignup = async (req: Request, res: Response) => {
  const { name, email, mobile, password, otp } = req.body;

  const record = await OTP.findOne({ email, purpose: 'signup', used: false }).sort({ createdAt: -1 });
  if (!record) return res.status(400).json({ message: 'No OTP found' });
  if (record.expiresAt < new Date()) {
    record.used = true;
    await record.save();
    return res.status(400).json({ message: 'OTP expired' });
  }

  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== record.otp) return res.status(400).json({ message: 'Invalid OTP' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, mobile, passwordHash });
  record.used = true;
  await record.save();

  const token = createToken({ id: user._id });
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
};

// ✅ LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const token = createToken({ id: user._id });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
};

// ✅ FORGOT PASSWORD — Request OTP
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
    expiresAt: dayjs().add(OTP_TTL_MIN, 'minute').toDate(),
  });

  await sendOTPEmail(email, otpValue, 'Reset password');
  return res.json({ message: 'OTP sent' });
};

// ✅ FORGOT PASSWORD — Verify OTP and reset password
export const verifyForgotPasswordOTP = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  const record = await OTP.findOne({ email, purpose: 'forgot_password', used: false }).sort({ createdAt: -1 });

  if (!record) return res.status(400).json({ message: 'OTP not found' });
  if (record.expiresAt < new Date()) {
    record.used = true;
    await record.save();
    return res.status(400).json({ message: 'OTP expired' });
  }

  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== record.otp) return res.status(400).json({ message: 'Invalid OTP' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await User.updateOne({ email }, { $set: { passwordHash } });

  record.used = true;
  await record.save();
  return res.json({ message: 'Password reset successful' });
};
export const updateDeviceToken = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ message: 'Device token is required' });
    }

    user.deviceToken = deviceToken;
    await user.save();

    res.json({ message: 'Device token updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
