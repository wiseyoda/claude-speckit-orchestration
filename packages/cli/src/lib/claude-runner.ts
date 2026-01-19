import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { WorkflowEvent } from '@specflow/shared';
import { assertClaudeCliAvailable } from './claude-validator.js';

// TODO: For real-time progress watching, consider using Claude's sessions index:
// ~/.claude/projects/{project-path}/sessions-index.json
// This file is updated as sessions run and could provide live state updates
// for a dashboard or watcher without parsing JSONL files.

/**
 * Load a skill file content
 *
 * Looks for skills in these locations (in order):
 * 1. ~/.claude/commands/ (installed skills)
 * 2. ./commands/ (local development)
 *
 * @param skill - Skill name like '/flow.design' or 'flow.design'
 * @returns Skill content or null if not found
 */
function loadSkillContent(skill: string): string | null {
  // Normalize skill name
  const skillName = skill.replace(/^\//, '');
  const skillFile = `${skillName}.md`;
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';

  // Try ~/.claude/commands/ first (installed location)
  const installedPath = join(homeDir, '.claude', 'commands', skillFile);
  if (existsSync(installedPath)) {
    return readFileSync(installedPath, 'utf-8');
  }

  // Fall back to local commands directory (for development)
  const localPath = join(process.cwd(), 'commands', skillFile);
  if (existsSync(localPath)) {
    return readFileSync(localPath, 'utf-8');
  }

  return null;
}

/**
 * JSON Schema for workflow structured output
 *
 * The questions format mirrors AskUserQuestion tool input for consistency:
 * - question: The question text
 * - header: Short label for the question
 * - options: Array of {label, description} choices
 * - multiSelect: Whether multiple options can be selected
 */
const WORKFLOW_SCHEMA = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['completed', 'needs_input', 'error'],
      description: 'Current workflow status',
    },
    phase: {
      type: 'string',
      description: 'Current phase (discover, specify, plan, tasks, checklists)',
    },
    message: {
      type: 'string',
      description: 'Status message or summary',
    },
    questions: {
      type: 'array',
      description: 'Questions needing user input (mirrors AskUserQuestion format)',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question text' },
          header: { type: 'string', description: 'Short label (max 12 chars)' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: 'Option display text' },
                description: { type: 'string', description: 'Option explanation' },
              },
              required: ['label', 'description'],
            },
          },
          multiSelect: {
            type: 'boolean',
            description: 'Allow multiple selections',
            default: false,
          },
        },
        required: ['question'],
      },
    },
    artifacts: {
      type: 'array',
      description: 'Files created or modified',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          action: { type: 'string', enum: ['created', 'modified'] },
        },
      },
    },
  },
  required: ['status'],
};

/**
 * Options for spawning Claude CLI
 */
export interface ClaudeRunnerOptions {
  /** Working directory for execution */
  cwd: string;
  /** Skill to invoke (e.g., '/flow.design') */
  skill: string;
  /** Optional phase flag for design command */
  phase?: string;
  /** Additional arguments to pass */
  args?: string[];
  /** Answers to provide for questions (for resuming) */
  answers?: Record<string, string>;
}

/**
 * Question format (mirrors AskUserQuestion tool input)
 */
export interface WorkflowQuestion {
  question: string;
  header?: string;
  options?: Array<{ label: string; description: string }>;
  multiSelect?: boolean;
}

/**
 * Structured output from Claude CLI
 */
export interface WorkflowOutput {
  status: 'completed' | 'needs_input' | 'error';
  phase?: string;
  message?: string;
  questions?: WorkflowQuestion[];
  artifacts?: Array<{
    path: string;
    action: 'created' | 'modified';
  }>;
}

/**
 * Result of Claude CLI execution
 */
export interface ClaudeRunnerResult {
  /** Exit code from process */
  exitCode: number | null;
  /** Whether execution completed successfully */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Structured output from workflow */
  output?: WorkflowOutput;
  /** Session ID for JSONL file access */
  sessionId?: string;
  /** Number of events emitted */
  eventsEmitted: number;
}

/**
 * Callback for workflow events
 */
export type WorkflowEventCallback = (event: WorkflowEvent) => void;

/**
 * Claude CLI result JSON structure
 */
interface ClaudeCliResult {
  type: string;
  subtype: string;
  is_error: boolean;
  session_id: string;
  structured_output?: WorkflowOutput;
  result?: string;
}

/**
 * Claude CLI runner that spawns claude with JSON output and structured schema
 */
export class ClaudeRunner {
  private eventCallback: WorkflowEventCallback;

  constructor(eventCallback: WorkflowEventCallback) {
    this.eventCallback = eventCallback;
  }

  /**
   * Start Claude CLI execution
   *
   * @param options - Runner options
   * @returns Promise that resolves when execution completes
   */
  async run(options: ClaudeRunnerOptions): Promise<ClaudeRunnerResult> {
    // Validate Claude CLI is available
    assertClaudeCliAvailable();

    // Build prompt
    const prompt = this.buildPrompt(options);

    // Build args with new approach
    const args = [
      '-p',
      '--output-format', 'json',
      '--dangerously-skip-permissions',
      '--disallowedTools', 'AskUserQuestion',
      '--json-schema', JSON.stringify(WORKFLOW_SCHEMA),
      prompt,
      ...(options.args || []),
    ];

    // Emit start event
    this.eventCallback({
      type: 'phase_started',
      timestamp: new Date().toISOString(),
      data: { phase: 'workflow', skill: options.skill },
    });

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let eventsEmitted = 1; // Started with phase_started

      const proc = spawn('claude', args, {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NO_COLOR: '1',
          FORCE_COLOR: '0',
        },
      });

      // Collect stdout
      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr (for error reporting)
      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process exit
      proc.on('close', (code) => {
        let result: ClaudeRunnerResult = {
          exitCode: code,
          success: code === 0,
          eventsEmitted,
        };

        // Parse the JSON result
        try {
          const parsed = JSON.parse(stdout) as ClaudeCliResult;
          result.sessionId = parsed.session_id;

          if (parsed.structured_output) {
            result.output = parsed.structured_output;

            // Emit events based on structured output
            if (parsed.structured_output.phase) {
              this.eventCallback({
                type: 'phase_started',
                timestamp: new Date().toISOString(),
                data: { phase: parsed.structured_output.phase },
              });
              eventsEmitted++;
            }

            // Emit question events
            if (parsed.structured_output.questions) {
              for (let i = 0; i < parsed.structured_output.questions.length; i++) {
                const q = parsed.structured_output.questions[i];
                // Generate ID from header or index
                const id = q.header
                  ? q.header.toLowerCase().replace(/\s+/g, '_')
                  : `q${i + 1}`;
                this.eventCallback({
                  type: 'question_queued',
                  timestamp: new Date().toISOString(),
                  data: {
                    id,
                    content: q.question,
                    header: q.header,
                    options: q.options || [],
                    multiSelect: q.multiSelect || false,
                  },
                });
                eventsEmitted++;
              }
            }

            // Emit artifact events
            if (parsed.structured_output.artifacts) {
              for (const a of parsed.structured_output.artifacts) {
                this.eventCallback({
                  type: 'artifact_created',
                  timestamp: new Date().toISOString(),
                  data: {
                    path: a.path,
                    artifact: a.path.split('/').pop(),
                    action: a.action,
                  },
                });
                eventsEmitted++;
              }
            }
          }

          // Check for errors in result
          if (parsed.is_error) {
            result.success = false;
            result.error = parsed.result || 'Unknown error';
          }
        } catch (parseError) {
          // If we can't parse JSON, it's an error
          result.success = false;
          result.error = `Failed to parse Claude output: ${stdout.slice(0, 200)}`;

          if (stderr) {
            result.error += `\nStderr: ${stderr.slice(0, 200)}`;
          }
        }

        // Emit complete event
        this.eventCallback({
          type: 'complete',
          timestamp: new Date().toISOString(),
          data: {
            exitCode: code,
            success: result.success,
            status: result.output?.status,
            eventsEmitted,
          },
        });
        eventsEmitted++;
        result.eventsEmitted = eventsEmitted;

        resolve(result);
      });

      // Handle process error
      proc.on('error', (error) => {
        this.eventCallback({
          type: 'error',
          timestamp: new Date().toISOString(),
          data: { message: error.message, source: 'process' },
        });

        resolve({
          exitCode: null,
          success: false,
          error: error.message,
          eventsEmitted: eventsEmitted + 1,
        });
      });
    });
  }

  /**
   * Build the prompt for Claude CLI
   */
  private buildPrompt(options: ClaudeRunnerOptions): string {
    // Load skill content
    const skillContent = loadSkillContent(options.skill);

    if (!skillContent) {
      return `Error: Could not find skill file for ${options.skill}`;
    }

    // Build prompt with embedded skill
    let prompt = `# CLI Mode Instructions

You are running in non-interactive CLI mode. IMPORTANT:
1. You CANNOT use AskUserQuestion tool - it is disabled
2. When you need user input, output questions in the JSON structured_output
3. Set status to "needs_input" and include a questions array
4. Use the SAME format as AskUserQuestion tool input:
   - question: The question text
   - header: Short label (max 12 chars)
   - options: Array of {label, description} choices
   - multiSelect: true if multiple selections allowed

# Skill Instructions

Execute the following skill:

`;

    // Add phase argument if provided
    if (options.phase) {
      prompt += `Arguments: --${options.phase}\n\n`;
    }

    // Add skill content
    prompt += skillContent;

    // Add answers if resuming
    if (options.answers && Object.keys(options.answers).length > 0) {
      prompt += `\n\n# Previous User Answers\n\nThe user has already answered these questions:\n${JSON.stringify(options.answers, null, 2)}\n\nContinue from where you left off using these answers.`;
    }

    return prompt;
  }
}

/**
 * Create a new Claude runner instance
 */
export function createClaudeRunner(
  eventCallback: WorkflowEventCallback
): ClaudeRunner {
  return new ClaudeRunner(eventCallback);
}
