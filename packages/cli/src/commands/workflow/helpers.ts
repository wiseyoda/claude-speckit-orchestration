import type { WorkflowEvent } from '@specflow/shared';
import {
  addQuestion as addQuestionToQueue,
  answerQuestion as answerQuestionInQueue,
  getQuestion as getQuestionFromQueue,
  getPendingQuestions as getPendingQuestionsFromQueue,
} from '../../lib/question-queue.js';

/**
 * Extract question data from a question_queued event
 */
export function extractQuestionData(event: WorkflowEvent): {
  id: string;
  content: string;
  options: Array<{ label: string; description: string }>;
} | null {
  if (event.type !== 'question_queued') {
    return null;
  }

  return {
    id: event.data.id as string,
    content: event.data.content as string,
    options: event.data.options as Array<{
      label: string;
      description: string;
    }>,
  };
}

// Re-export question queue functions for convenience
export const addQuestion = addQuestionToQueue;
export const answerQuestion = answerQuestionInQueue;
export const getQuestion = getQuestionFromQueue;
export const getPendingQuestions = getPendingQuestionsFromQueue;
