import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueAt: { type: Date, required: true }, // exact due datetime in ISO
  notified: { type: Boolean, default: false }, // if notification was already sent
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

TaskSchema.index({ user: 1, dueAt: 1 });

export default mongoose.model('Task', TaskSchema);
