import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  passwordHash: { type: String, required: true },
  deviceToken: { type: String }, // FCM token of user's device
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
