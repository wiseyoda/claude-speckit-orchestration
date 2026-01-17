import { z } from 'zod';

/**
 * Task status enum
 */
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done']);

/**
 * Schema for a single parsed task from tasks.md
 */
export const TaskSchema = z.object({
  id: z.string().describe('Task ID (e.g., "T001")'),
  description: z.string().describe('Task description text'),
  status: TaskStatusSchema.describe('Current status based on checkbox'),
  phase: z.string().optional().describe('Phase name (e.g., "Setup", "Foundation")'),
  userStory: z.string().optional().describe('User story reference (e.g., "US1")'),
  isParallel: z.boolean().optional().describe('Has [P] parallel marker'),
  filePath: z.string().optional().describe('File path mentioned in task'),
});

/**
 * Schema for tasks data from a project
 */
export const TasksDataSchema = z.object({
  projectId: z.string().describe('Project UUID'),
  tasks: z.array(TaskSchema).describe('Parsed tasks'),
  totalCount: z.number().describe('Total number of tasks'),
  completedCount: z.number().describe('Number of completed tasks'),
  lastUpdated: z.string().describe('ISO 8601 timestamp'),
});

// Type exports
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TasksData = z.infer<typeof TasksDataSchema>;
