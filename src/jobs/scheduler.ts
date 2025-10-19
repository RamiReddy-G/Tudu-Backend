import cron from 'cron';
import Task from '../models/Task';
import dayjs from 'dayjs';
import { sendPush } from '../services/fcmService';
import User from '../models/User';

// runs every minute (can adjust)
export const startTaskScheduler = () => {
  const CronJob = cron.CronJob;
  const job = new CronJob(process.env.TASK_CHECK_CRON || '*/1 * * * *', async () => {
    try {
      const now = new Date();
      // find tasks that are due or past due and not yet notified and not completed
      const dueTasks = await Task.find({ dueAt: { $lte: now }, notified: false, completed: false }).limit(100);
      for (const t of dueTasks) {
        const user = await User.findById(t.user);
        if (user && user.deviceToken) {
          await sendPush(user.deviceToken, 'Task due: ' + t.title, t.description || 'Your task is due now.', { taskId: String(t._id) });
        }
        t.notified = true;
        await t.save();
      }
    } catch (err) {
      console.error('Scheduler error', err);
    }
  }, null, true, 'UTC');

  job.start();
  console.log('Task scheduler started');
};
