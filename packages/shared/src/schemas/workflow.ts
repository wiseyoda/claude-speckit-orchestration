import { z } from 'zod';

/**
 * Workflow event types emitted during skill execution
 */
export const WorkflowEventTypeSchema = z.enum([
  'phase_started',
  'phase_complete',
  'artifact_created',
  'tool_invoked',
  'progress_update',
  'question_queued',
  'error',
  'complete',
]);

export type WorkflowEventType = z.infer<typeof WorkflowEventTypeSchema>;

/**
 * Base workflow event structure
 */
export const WorkflowEventSchema = z.object({
  type: WorkflowEventTypeSchema,
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
});

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;

/**
 * Question option presented to user
 */
export const QuestionOptionSchema = z.object({
  label: z.string(),
  description: z.string(),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

/**
 * Question status
 */
export const QuestionStatusSchema = z.enum(['pending', 'answered']);

export type QuestionStatus = z.infer<typeof QuestionStatusSchema>;

/**
 * A queued question from AskUserQuestion tool call
 * Format mirrors Claude's AskUserQuestion tool input
 */
export const QuestionSchema = z.object({
  id: z.string(),
  content: z.string().describe('The question text'),
  header: z.string().optional().describe('Short label (max 12 chars)'),
  options: z.array(QuestionOptionSchema),
  multiSelect: z.boolean().optional().default(false),
  status: QuestionStatusSchema,
  createdAt: z.string().datetime(),
  answeredAt: z.string().datetime().optional(),
  answer: z.string().optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

/**
 * Question queue file structure
 */
export const QuestionQueueSchema = z.object({
  workflowId: z.string(),
  questions: z.array(QuestionSchema),
});

export type QuestionQueue = z.infer<typeof QuestionQueueSchema>;

/**
 * Workflow execution status
 */
export const WorkflowStatusSchema = z.enum([
  'idle',
  'running',
  'waiting_for_answer',
  'completed',
  'failed',
]);

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

/**
 * Workflow execution state for status command
 */
export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  skill: z.string(),
  status: WorkflowStatusSchema,
  currentPhase: z.string().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  eventsEmitted: z.number(),
  artifactsCreated: z.array(z.string()),
  pendingQuestions: z.number(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
