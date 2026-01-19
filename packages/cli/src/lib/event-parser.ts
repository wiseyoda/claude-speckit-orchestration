import type { WorkflowEvent, WorkflowEventType } from '@specflow/shared';

/**
 * Tool use block from Claude message content
 */
interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Text block from Claude message content
 */
interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * Claude message structure in stream-json
 */
interface ClaudeMessage {
  role: 'assistant' | 'user';
  content: Array<ToolUseBlock | TextBlock>;
}

/**
 * Permission denial from result event
 */
interface PermissionDenial {
  tool_name: string;
  tool_use_id: string;
  tool_input: Record<string, unknown>;
}

/**
 * Parsed Claude CLI event from stream-json output
 */
interface ClaudeEvent {
  type?: string;
  subtype?: string;
  content?: unknown;
  tool_name?: string;
  tool_input?: unknown;
  message?: ClaudeMessage;
  permission_denials?: PermissionDenial[];
}

/**
 * Callback for parsed workflow events
 */
export type EventHandler = (event: WorkflowEvent) => void;

/**
 * Parse NDJSON stream from Claude CLI and emit WorkflowEvents
 */
export class EventParser {
  private buffer = '';
  private handler: EventHandler;
  private currentPhase = 'unknown';
  private eventsEmitted = 0;

  constructor(handler: EventHandler) {
    this.handler = handler;
  }

  /**
   * Process incoming data chunk from Claude stdout
   */
  processChunk(chunk: string): void {
    this.buffer += chunk;

    // Process complete lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        this.parseLine(line);
      }
    }
  }

  /**
   * Flush any remaining buffer content
   */
  flush(): void {
    if (this.buffer.trim()) {
      this.parseLine(this.buffer);
      this.buffer = '';
    }
  }

  /**
   * Get count of events emitted
   */
  getEventsEmitted(): number {
    return this.eventsEmitted;
  }

  /**
   * Parse a single NDJSON line
   */
  private parseLine(line: string): void {
    try {
      const data = JSON.parse(line) as ClaudeEvent;
      const events = this.mapClaudeEvent(data);

      for (const event of events) {
        this.emit(event.type, event.data);
      }
    } catch {
      // Invalid JSON - emit as progress update
      this.emit('progress_update', { raw: line });
    }
  }

  /**
   * Map Claude event to WorkflowEvent(s)
   */
  private mapClaudeEvent(
    data: ClaudeEvent
  ): Array<{ type: WorkflowEventType; data: Record<string, unknown> }> {
    const events: Array<{
      type: WorkflowEventType;
      data: Record<string, unknown>;
    }> = [];

    // Handle assistant messages (contain tool_use blocks)
    if (data.type === 'assistant' && data.message?.content) {
      for (const block of data.message.content) {
        if (block.type === 'tool_use') {
          const toolBlock = block as ToolUseBlock;
          events.push(...this.processToolCall(toolBlock.name, toolBlock.input));
        } else if (block.type === 'text') {
          const textBlock = block as TextBlock;
          events.push(...this.processTextContent(textBlock.text));
        }
      }
    }

    // Handle result events with permission_denials (AskUserQuestion in -p mode)
    if (data.type === 'result' && data.permission_denials) {
      for (const denial of data.permission_denials) {
        // Capture denied AskUserQuestion calls as questions
        if (denial.tool_name === 'AskUserQuestion') {
          events.push(...this.processToolCall(denial.tool_name, denial.tool_input));
        }
      }
    }

    // Legacy format: direct tool_name (kept for compatibility)
    if (data.tool_name) {
      events.push(...this.processToolCall(data.tool_name, data.tool_input as Record<string, unknown>));
    }

    // Detect phase transitions from top-level content
    if (data.content && typeof data.content === 'string') {
      events.push(...this.processTextContent(data.content));
    }

    // If no specific events detected, emit progress update
    if (events.length === 0 && data.type) {
      events.push({
        type: 'progress_update',
        data: { claudeEventType: data.type, subtype: data.subtype },
      });
    }

    return events;
  }

  /**
   * Process a tool call and return events
   */
  private processToolCall(
    toolName: string,
    toolInput: Record<string, unknown> | undefined
  ): Array<{ type: WorkflowEventType; data: Record<string, unknown> }> {
    const events: Array<{
      type: WorkflowEventType;
      data: Record<string, unknown>;
    }> = [];

    events.push({
      type: 'tool_invoked',
      data: {
        tool: toolName,
        input: toolInput,
      },
    });

    // Special handling for AskUserQuestion
    if (toolName === 'AskUserQuestion' && toolInput) {
      const input = toolInput as {
        questions?: Array<{
          question: string;
          header?: string;
          options: Array<{ label: string; description: string }>;
          multiSelect?: boolean;
        }>;
      };

      if (input.questions) {
        for (const q of input.questions) {
          events.push({
            type: 'question_queued',
            data: {
              id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              content: q.question,
              header: q.header,
              options: q.options,
              multiSelect: q.multiSelect ?? false,
            },
          });
        }
      }
    }

    // Detect file writes (artifact creation)
    if (toolName === 'Write' || toolName === 'Edit') {
      const input = toolInput as { file_path?: string } | undefined;
      if (input?.file_path) {
        events.push({
          type: 'artifact_created',
          data: {
            artifact: input.file_path.split('/').pop(),
            path: input.file_path,
          },
        });
      }
    }

    return events;
  }

  /**
   * Process text content for phase transitions
   */
  private processTextContent(
    text: string
  ): Array<{ type: WorkflowEventType; data: Record<string, unknown> }> {
    const events: Array<{
      type: WorkflowEventType;
      data: Record<string, unknown>;
    }> = [];

    const phaseMatch = text.match(
      /(?:Starting|Proceeding to|Beginning)\s+(DISCOVER|SPECIFY|PLAN|TASKS|CHECKLISTS)/i
    );
    if (phaseMatch) {
      const phase = phaseMatch[1].toLowerCase();
      if (phase !== this.currentPhase) {
        // Emit phase_complete for previous phase
        if (this.currentPhase !== 'unknown') {
          events.push({
            type: 'phase_complete',
            data: { phase: this.currentPhase },
          });
        }
        // Emit phase_started for new phase
        this.currentPhase = phase;
        events.push({
          type: 'phase_started',
          data: { phase },
        });
      }
    }

    return events;
  }

  /**
   * Emit a workflow event
   */
  private emit(
    type: WorkflowEventType,
    data: Record<string, unknown>
  ): void {
    const event: WorkflowEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    this.eventsEmitted++;
    // Debug: log emitted events
    if (process.env.DEBUG_SPECFLOW) {
      console.error('[DEBUG] emit:', type);
    }
    this.handler(event);
  }
}

/**
 * Check if an event indicates an AskUserQuestion tool call
 */
export function isQuestionEvent(event: WorkflowEvent): boolean {
  return event.type === 'question_queued';
}

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
