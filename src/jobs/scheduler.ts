// scheduler/taskScheduler.js
import cron from 'cron';
import Task from '../models/Task';
import User from '../models/User';
import { sendPush } from '../services/fcmService';

export const startTaskScheduler = () => {
  const job = new cron.CronJob('*/1 * * * *', async () => {
    console.log('⏰ Checking for due tasks...');

    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // ✅ Find tasks that became due within the last 1 minute window
      const dueTasks = await Task.find({
        dueAt: { $gte: oneMinuteAgo, $lte: now },
        notified: false,
        completed: false,
      }).limit(100);

      if (!dueTasks.length) {
        console.log('✅ No tasks due this minute.');
        return;
      }

      console.log(`📋 Found ${dueTasks.length} task(s) due now.`);

      for (const task of dueTasks) {
        const user = await User.findById(task.user);

        if (user?.deviceToken) {
          try {
            await sendPush(
              user.deviceToken,
              `⏰ Task Due: ${task.title}`,
              task.description || 'Your task is due now!'
            );
            console.log(`🔔 Sent push notification for task: "${task.title}"`);
          } catch (pushError) {
            console.error(`⚠️ Failed to send push for "${task.title}":`, pushError);
          }
        } else {
          console.warn(`⚠️ No device token for user ${user?._id || '(unknown)'}`);
        }

        task.notified = true;
        await task.save();
      }

      console.log(`✅ Scheduler processed ${dueTasks.length} due task(s).`);
    } catch (err) {
      console.error('❌ Scheduler error:', err);
    }
  });

  job.start();
  console.log('🚀 Task scheduler started (runs every minute)');
};
