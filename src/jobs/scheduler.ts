// scheduler/taskScheduler.js
import cron from 'cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendPush } from '../services/fcmService.js';

export const startTaskScheduler = () => {
  const job = new cron.CronJob('*/1 * * * *', async () => {
    console.log('⏰ Checking for due tasks...');

    try {
      const now = new Date();

      // Find all tasks due now or past due, not notified, not completed
      const dueTasks = await Task.find({
        dueAt: { $lte: now },
        notified: false,
        completed: false,
      }).limit(100);
      if(!dueTasks){
        console.log("there are no due tasks");

      }else{
        console.log(dueTasks);
      }

      for (const task of dueTasks) {
        const user = await User.findById(task.user);

        if (user?.deviceToken) {
          await sendPush(
            user.deviceToken,
            `Task due: ${task.title}`,
            task.description || 'Your task is due now!'
          );
        }

        task.notified = true;
        await task.save();
      }

      if (dueTasks.length > 0)
        console.log(`🔔 Sent notifications for ${dueTasks.length} tasks`);
    } catch (err) {
      console.error('❌ Scheduler error:', err);
    }
  });

  job.start();
  console.log('🚀 Task scheduler started');
};
