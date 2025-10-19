import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import { connectDB } from './config/db';
import { startTaskScheduler } from './jobs/scheduler';

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 4000;

(async () => {
  await connectDB(process.env.MONGO_URI!);
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  startTaskScheduler();
})();
