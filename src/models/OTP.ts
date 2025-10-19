import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true }, // store hashed OTP
  purpose: { type: String, enum: ['signup', 'forgot_password'], default: 'signup' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('OTP', OTPSchema);
