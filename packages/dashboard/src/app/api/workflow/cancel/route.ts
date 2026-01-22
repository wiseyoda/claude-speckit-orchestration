import { NextResponse } from 'next/server';
import { workflowService } from '@/lib/services/workflow-service';

/**
 * POST /api/workflow/cancel?id=<execution-id>&sessionId=<session-id>&projectId=<project-id>&status=<status>
 *
 * Cancel or complete a running workflow and terminate its process.
 *
 * Query parameters:
 * - id: string (optional) - Execution UUID
 * - sessionId: string (optional) - Session ID (fallback if execution not found)
 * - projectId: string (optional) - Project ID (required with sessionId)
 * - status: 'cancelled' | 'completed' (optional) - Final status (default: 'cancelled')
 *
 * At least 'id' or both 'sessionId' and 'projectId' must be provided.
 *
 * Response (200):
 * - Updated WorkflowExecution with the specified status
 * - Or { cancelled: true } if updated by session ID
 *
 * Errors:
 * - 400: Missing parameters or workflow not in updatable state
 * - 404: Execution/session not found
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sessionId = searchParams.get('sessionId');
    const projectId = searchParams.get('projectId');
    const statusParam = searchParams.get('status');
    const finalStatus = statusParam === 'completed' ? 'completed' : 'cancelled';

    // Try execution ID first
    if (id) {
      try {
        const execution = workflowService.cancel(id);
        return NextResponse.json({ execution });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        // If execution not found but we have session info, try session-based update
        if (message.includes('not found') && sessionId && projectId) {
          const cancelled = workflowService.cancelBySession(sessionId, projectId, finalStatus);
          if (cancelled) {
            return NextResponse.json({ cancelled: true, sessionId, status: finalStatus });
          }
        }

        // Re-throw to be handled below
        throw error;
      }
    }

    // No execution ID - try session-based update
    if (sessionId && projectId) {
      const cancelled = workflowService.cancelBySession(sessionId, projectId, finalStatus);
      if (cancelled) {
        return NextResponse.json({ cancelled: true, sessionId, status: finalStatus });
      }
      return NextResponse.json(
        { error: `Session not found or not in updatable state: ${sessionId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Missing required parameters: id, or sessionId and projectId' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Execution not found returns 404
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    // Wrong state returns 400
    if (message.includes('Cannot cancel')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
