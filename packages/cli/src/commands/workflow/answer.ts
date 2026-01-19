import { Command } from 'commander';
import chalk from 'chalk';
import { output } from '../../lib/output.js';
import { findProjectRoot } from '../../lib/paths.js';
import {
  getQuestion,
  answerQuestion,
  getPendingQuestions,
} from '../../lib/question-queue.js';

/**
 * Answer command output for JSON mode
 */
interface AnswerOutput {
  success: boolean;
  questionId: string;
  answer?: string;
  error?: string;
  pendingCount: number;
}

/**
 * Answer command action
 */
export async function answerAction(
  questionId: string,
  answer: string,
  options: { json?: boolean; list?: boolean }
): Promise<void> {
  const projectPath = findProjectRoot() || process.cwd();

  // List pending questions if --list flag
  if (options.list) {
    await listPendingQuestions(projectPath);
    return;
  }

  // Validate inputs
  if (!questionId) {
    const error = 'Question ID is required';
    const result: AnswerOutput = { success: false, questionId: '', error, pendingCount: 0 };
    output(result, chalk.red(`ERROR: ${error}`));
    process.exit(1);
  }

  if (!answer) {
    const error = 'Answer is required';
    const result: AnswerOutput = { success: false, questionId, error, pendingCount: 0 };
    output(result, chalk.red(`ERROR: ${error}`));
    process.exit(1);
  }

  // Get the question
  const question = await getQuestion(projectPath, questionId);

  if (!question) {
    const error = `Question ${questionId} not found`;
    const pending = await getPendingQuestions(projectPath);
    const result: AnswerOutput = {
      success: false,
      questionId,
      error,
      pendingCount: pending.length,
    };
    const humanMsg = pending.length > 0
      ? `${chalk.red(`ERROR: ${error}`)}\nPending questions: ${pending.map((q) => q.id).join(', ')}`
      : chalk.red(`ERROR: ${error}`);
    output(result, humanMsg);
    process.exit(1);
  }

  // Try to answer
  try {
    await answerQuestion(projectPath, questionId, answer);
    const pending = await getPendingQuestions(projectPath);

    const result: AnswerOutput = {
      success: true,
      questionId,
      answer,
      pendingCount: pending.length,
    };
    const humanMsg = [
      chalk.green(`Answered: ${questionId}`),
      `Answer: ${answer}`,
      `Pending questions: ${pending.length}`,
    ].join('\n');
    output(result, humanMsg);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    const pending = await getPendingQuestions(projectPath);

    const result: AnswerOutput = {
      success: false,
      questionId,
      error,
      pendingCount: pending.length,
    };
    output(result, chalk.red(`ERROR: ${error}`));
    process.exit(1);
  }
}

/**
 * List pending questions
 */
async function listPendingQuestions(projectPath: string): Promise<void> {
  const pending = await getPendingQuestions(projectPath);

  const result = {
    questions: pending.map((q) => ({
      id: q.id,
      content: q.content,
      options: q.options,
      createdAt: q.createdAt,
    })),
    count: pending.length,
  };

  const formatHumanReadable = (): string => {
    if (pending.length === 0) {
      return 'No pending questions';
    }

    const lines: string[] = [chalk.blue(`Pending Questions: ${pending.length}`), ''];

    for (const q of pending) {
      lines.push(chalk.yellow(`[${q.id}]`));
      lines.push(`  ${q.content}`);
      lines.push(`  Options:`);
      for (const opt of q.options) {
        lines.push(`    - ${opt.label}: ${opt.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  };

  output(result, formatHumanReadable());
}

/**
 * Create the answer subcommand
 */
export const answerCommand = new Command('answer')
  .description('Answer a queued question from workflow execution')
  .argument('[question-id]', 'ID of the question to answer')
  .argument('[answer]', 'Answer text or option label')
  .option('--json', 'Output as JSON')
  .option('--list', 'List pending questions instead of answering')
  .action(answerAction);
