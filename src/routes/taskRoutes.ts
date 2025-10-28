import express from 'express';
import {
  createTask, listTasks, getTask, updateTask, deleteTask
} from '../controllers/taskController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.use(requireAuth);
router.post('/', createTask);
router.get('/', listTasks);
router.delete('/', deleteAllTasks)
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
