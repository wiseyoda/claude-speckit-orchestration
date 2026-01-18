import { Command } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { output } from '../lib/output.js';
import { readTasks, findNextTask, getTaskById, type TasksData } from '../lib/tasks.js';
import { resolveFeatureDir } from '../lib/context.js';
import { findProjectRoot } from '../lib/paths.js';
import { handleError, NotFoundError, ValidationError } from '../lib/errors.js';

/**
 * Mark result output
 */
export interface MarkOutput {
  marked: string[];
  newStatus: 'complete' | 'incomplete' | 'blocked';
  progress: {
    tasksCompleted: number;
    tasksTotal: number;
    percentage: number;
  };
  sectionStatus?: {
    name: string;
    completed: number;
    total: number;
    isComplete: boolean;
  };
  next?: {
    id: string;
    description: string;
    dependenciesMet: boolean;
  };
  stepComplete: boolean;
  nextAction?: string;
  message?: string;
}

/**
 * Parse task ID range (T001..T005) into array
 */
function parseTaskRange(range: string): string[] {
  const match = range.match(/^(T\d{3}[a-z]?)\.\.(T\d{3}[a-z]?)$/);
  if (!match) return [];

  const start = match[1];
  const end = match[2];

  const startNum = parseInt(start.slice(1, 4), 10);
  const endNum = parseInt(end.slice(1, 4), 10);

  if (startNum > endNum) return [];

  const result: string[] = [];
  for (let i = startNum; i <= endNum; i++) {
    result.push(`T${String(i).padStart(3, '0')}`);
  }
  return result;
}

/**
 * Parse task IDs from arguments
 */
function parseTaskIds(args: string[]): string[] {
  const taskIds: string[] = [];

  for (const arg of args) {
    if (arg.includes('..')) {
      // Range: T001..T005
      taskIds.push(...parseTaskRange(arg));
    } else if (arg.match(/^T\d{3}[a-z]?$/)) {
      // Single task: T001
      taskIds.push(arg);
    } else if (arg.match(/^V-\d{3}$/)) {
      // Verification item: V-001
      taskIds.push(arg);
    }
  }

  return [...new Set(taskIds)];
}

/**
 * Update task checkbox in file content
 */
function updateTaskCheckbox(
  content: string,
  taskId: string,
  complete: boolean,
): string {
  const lines = content.split('\n');
  const updated: string[] = [];

  for (const line of lines) {
    // Check if this line contains the task ID
    if (line.includes(taskId)) {
      if (complete) {
        // Mark as complete: [ ] -> [x]
        updated.push(line.replace(/- \[ \]/, '- [x]'));
      } else {
        // Mark as incomplete: [x] -> [ ]
        updated.push(line.replace(/- \[x\]/i, '- [ ]'));
      }
    } else {
      updated.push(line);
    }
  }

  return updated.join('\n');
}

/**
 * Mark tasks complete or incomplete
 */
async function markTasks(
  taskIds: string[],
  options: { incomplete?: boolean; blocked?: string },
): Promise<MarkOutput> {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    throw new NotFoundError('SpecFlow project', 'Not in a SpecFlow project directory');
  }

  const featureDir = await resolveFeatureDir(undefined, projectRoot);
  if (!featureDir) {
    throw new NotFoundError('Feature', 'No active feature found');
  }

  // Read current tasks
  const tasksData = await readTasks(featureDir);

  // Validate all task IDs exist
  const invalidIds: string[] = [];
  for (const taskId of taskIds) {
    if (!getTaskById(tasksData, taskId)) {
      invalidIds.push(taskId);
    }
  }

  if (invalidIds.length > 0) {
    throw new ValidationError(
      `Unknown task IDs: ${invalidIds.join(', ')}`,
      `Valid task IDs are: ${tasksData.tasks.map(t => t.id).join(', ')}`,
    );
  }

  // Read file content
  let content = await readFile(tasksData.filePath, 'utf-8');

  // Update each task
  const complete = !options.incomplete;
  for (const taskId of taskIds) {
    content = updateTaskCheckbox(content, taskId, complete);
  }

  // Write updated content
  await writeFile(tasksData.filePath, content);

  // Re-read tasks to get updated state
  const updatedTasks = await readTasks(featureDir);

  // Find next task
  const nextTask = findNextTask(updatedTasks);

  // Get section status for first marked task
  let sectionStatus: MarkOutput['sectionStatus'];
  const firstTask = getTaskById(updatedTasks, taskIds[0]);
  if (firstTask?.section) {
    const sectionTasks = updatedTasks.tasks.filter(t => t.section === firstTask.section);
    const sectionCompleted = sectionTasks.filter(t => t.status === 'done').length;
    sectionStatus = {
      name: firstTask.section,
      completed: sectionCompleted,
      total: sectionTasks.length,
      isComplete: sectionCompleted === sectionTasks.length,
    };
  }

  // Check if all tasks complete
  const allComplete = updatedTasks.progress.completed === updatedTasks.progress.total;

  const result: MarkOutput = {
    marked: taskIds,
    newStatus: complete ? 'complete' : 'incomplete',
    progress: {
      tasksCompleted: updatedTasks.progress.completed,
      tasksTotal: updatedTasks.progress.total,
      percentage: updatedTasks.progress.percentage,
    },
    sectionStatus,
    stepComplete: allComplete,
  };

  if (nextTask) {
    const depsMet = !nextTask.dependencies || nextTask.dependencies.length === 0 ||
      nextTask.dependencies.every(depId => {
        const dep = updatedTasks.tasks.find(t => t.id === depId);
        return dep?.status === 'done';
      });

    result.next = {
      id: nextTask.id,
      description: nextTask.description,
      dependenciesMet: depsMet,
    };
  }

  if (allComplete) {
    result.nextAction = 'run_verify';
    result.message = 'All tasks complete! Ready for verification.';
  }

  return result;
}

/**
 * Format human-readable mark output
 */
function formatHumanReadable(result: MarkOutput): string {
  const lines = [
    `Marked ${result.marked.join(', ')} as ${result.newStatus}`,
    `Progress: ${result.progress.tasksCompleted}/${result.progress.tasksTotal} (${result.progress.percentage}%)`,
  ];

  if (result.sectionStatus?.isComplete) {
    lines.push(`Section "${result.sectionStatus.name}" complete!`);
  }

  if (result.next) {
    lines.push(`Next: ${result.next.id} ${result.next.description}`);
  }

  if (result.message) {
    lines.push(result.message);
  }

  return lines.join('\n');
}

/**
 * Mark command
 */
export const markCommand = new Command('mark')
  .description('Mark task(s) complete and return updated state')
  .argument('<tasks...>', 'Task ID(s) to mark (T001, T001..T005, V-001)')
  .option('--json', 'Output as JSON')
  .option('--incomplete', 'Mark as incomplete instead of complete')
  .option('--blocked <reason>', 'Mark as blocked with reason')
  .action(async (tasks: string[], options) => {
    try {
      const taskIds = parseTaskIds(tasks);

      if (taskIds.length === 0) {
        throw new ValidationError(
          'No valid task IDs provided',
          'Use format: T001, T001..T005, or V-001',
        );
      }

      const result = await markTasks(taskIds, options);

      if (options.json) {
        output(result);
      } else {
        output(result, formatHumanReadable(result));
      }
    } catch (err) {
      handleError(err);
    }
  });
