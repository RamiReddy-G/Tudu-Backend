import Task from '../models/Task';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

// Create task (enforce 10 tasks limit per user)
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueAt } = req.body;
    const user = req.user;

    // Validate required fields
    if (!title || !dueAt) {
      return res.status(400).json({ message: 'Title and dueAt are required' });
    }

    // Parse dueAt as Date
    const dueDate = new Date(dueAt);
    if (isNaN(dueDate.getTime())) {
      return res.status(400).json({ message: 'Invalid dueAt date format. Use ISO string, e.g., 2025-10-19T18:00:00Z' });
    }

    // Count active tasks
    const count = await Task.countDocuments({ user: user._id });
    if (count >= 10) {
      return res.status(400).json({ message: 'Task limit reached (10 tasks max)' });
    }

    // Create task
    const task = await Task.create({ user: user._id, title, description, dueAt: dueDate });
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List all tasks for the user
export const listTasks = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const tasks = await Task.find({ user: user._id }).sort({ dueAt: 1 });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single task
export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const task = await Task.findOne({ _id: req.params.id, user: user._id });
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const updates: any = { ...req.body };

    // If dueAt is provided, parse and validate it
    if (updates.dueAt) {
      const dueDate = new Date(updates.dueAt);
      if (isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid dueAt date format. Use ISO string, e.g., 2025-10-19T18:00:00Z' });
      }
      updates.dueAt = dueDate;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: user._id },
      updates,
      { new: true }
    );

    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete task
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: user._id });
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
