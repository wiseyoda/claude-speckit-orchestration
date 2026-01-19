import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import {
  QuestionQueueSchema,
  type Question,
  type QuestionQueue,
} from '@specflow/shared';

/**
 * Default question queue file path
 */
export const QUESTION_QUEUE_PATH = '.specify/questions.json';

/**
 * Get the full path to the question queue file
 */
export function getQueuePath(projectPath: string): string {
  return join(projectPath, QUESTION_QUEUE_PATH);
}

/**
 * Read the question queue from file
 *
 * @param projectPath - Project root directory
 * @returns Question queue or empty queue if file doesn't exist
 */
export async function readQuestionQueue(
  projectPath: string
): Promise<QuestionQueue> {
  const queuePath = getQueuePath(projectPath);

  if (!existsSync(queuePath)) {
    return {
      workflowId: '',
      questions: [],
    };
  }

  try {
    const content = await readFile(queuePath, 'utf-8');
    const data = JSON.parse(content);
    return QuestionQueueSchema.parse(data);
  } catch {
    // Return empty queue on parse error
    return {
      workflowId: '',
      questions: [],
    };
  }
}

/**
 * Write the question queue to file
 *
 * @param projectPath - Project root directory
 * @param queue - Question queue to write
 */
export async function writeQuestionQueue(
  projectPath: string,
  queue: QuestionQueue
): Promise<void> {
  const queuePath = getQueuePath(projectPath);

  // Ensure directory exists
  const dir = dirname(queuePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(queuePath, JSON.stringify(queue, null, 2), 'utf-8');
}

/**
 * Add a question to the queue
 *
 * @param projectPath - Project root directory
 * @param workflowId - Current workflow ID
 * @param question - Question to add (mirrors AskUserQuestion format)
 * @returns The added question with generated fields
 */
export async function addQuestion(
  projectPath: string,
  workflowId: string,
  question: {
    id: string;
    content: string;
    header?: string;
    options: Array<{ label: string; description: string }>;
    multiSelect?: boolean;
  }
): Promise<Question> {
  const queue = await readQuestionQueue(projectPath);

  // Update workflow ID
  queue.workflowId = workflowId;

  // Create full question object
  const fullQuestion: Question = {
    id: question.id,
    content: question.content,
    header: question.header,
    options: question.options,
    multiSelect: question.multiSelect ?? false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  queue.questions.push(fullQuestion);
  await writeQuestionQueue(projectPath, queue);

  return fullQuestion;
}

/**
 * Get a question by ID
 *
 * @param projectPath - Project root directory
 * @param questionId - Question ID to find
 * @returns Question or null if not found
 */
export async function getQuestion(
  projectPath: string,
  questionId: string
): Promise<Question | null> {
  const queue = await readQuestionQueue(projectPath);
  return queue.questions.find((q) => q.id === questionId) || null;
}

/**
 * Answer a question
 *
 * @param projectPath - Project root directory
 * @param questionId - Question ID to answer
 * @param answer - Answer text
 * @returns Updated question or null if not found
 */
export async function answerQuestion(
  projectPath: string,
  questionId: string,
  answer: string
): Promise<Question | null> {
  const queue = await readQuestionQueue(projectPath);
  const question = queue.questions.find((q) => q.id === questionId);

  if (!question) {
    return null;
  }

  if (question.status === 'answered') {
    throw new Error(`Question ${questionId} already answered`);
  }

  question.status = 'answered';
  question.answeredAt = new Date().toISOString();
  question.answer = answer;

  await writeQuestionQueue(projectPath, queue);
  return question;
}

/**
 * Get pending questions
 *
 * @param projectPath - Project root directory
 * @returns Array of pending questions
 */
export async function getPendingQuestions(
  projectPath: string
): Promise<Question[]> {
  const queue = await readQuestionQueue(projectPath);
  return queue.questions.filter((q) => q.status === 'pending');
}

/**
 * Clear the question queue
 *
 * @param projectPath - Project root directory
 */
export async function clearQuestionQueue(
  projectPath: string
): Promise<void> {
  await writeQuestionQueue(projectPath, {
    workflowId: '',
    questions: [],
  });
}
