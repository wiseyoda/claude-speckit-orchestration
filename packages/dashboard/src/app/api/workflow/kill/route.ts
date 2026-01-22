/**
 * POST /api/workflow/kill
 *
 * Kill a stuck or orphaned workflow process.
 * This is a manual action - the dashboard does NOT auto-kill processes.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { workflowService } from '@/lib/services/workflow-service';
import { killProcess, isPidAlive, readPidFile, cleanupPidFile } from '@/lib/services/process-spawner';
import { join } from 'path';

const KillRequestSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().min(1),
  force: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, projectId, force } = KillRequestSchema.parse(body);

    // Get the workflow execution
    const execution = workflowService.get(id, projectId);
    if (!execution) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Only allow killing active workflows
    if (!['running', 'waiting_for_input', 'detached', 'stale'].includes(execution.status)) {
      return NextResponse.json(
        { error: `Cannot kill workflow in ${execution.status} state` },
        { status: 400 }
      );
    }

    const killed: number[] = [];
    const failed: number[] = [];

    // Get project path from registry
    const homeDir = process.env.HOME || '';
    const registryPath = join(homeDir, '.specflow', 'registry.json');
    let projectPath: string | null = null;

    try {
      const { readFileSync } = await import('fs');
      const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
      projectPath = registry.projects?.[projectId]?.path || null;
    } catch {
      // Registry not found or invalid
    }

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project not found in registry' },
        { status: 404 }
      );
    }

    // Try to kill via PID file first (safest - these are definitely our processes)
    const workflowDir = join(projectPath, '.specflow', 'workflows', id);
    const pids = readPidFile(workflowDir);

    if (pids) {
      // Kill claude PID first (child), then bash PID (parent)
      if (pids.claudePid && isPidAlive(pids.claudePid)) {
        if (killProcess(pids.claudePid, force)) {
          killed.push(pids.claudePid);
        } else {
          failed.push(pids.claudePid);
        }
      }

      if (pids.bashPid && isPidAlive(pids.bashPid)) {
        if (killProcess(pids.bashPid, force)) {
          killed.push(pids.bashPid);
        } else {
          failed.push(pids.bashPid);
        }
      }

      // Clean up PID file
      cleanupPidFile(workflowDir);
    }

    // Also try legacy execution.pid
    if (execution.pid && isPidAlive(execution.pid) && !killed.includes(execution.pid)) {
      if (killProcess(execution.pid, force)) {
        killed.push(execution.pid);
      } else {
        failed.push(execution.pid);
      }
    }

    // Update workflow status via cancel (which handles state update)
    try {
      workflowService.cancel(id);
    } catch {
      // May fail if already cancelled, that's OK
    }

    return NextResponse.json({
      success: true,
      killed,
      failed,
      message: killed.length > 0
        ? `Killed ${killed.length} process(es)`
        : 'No processes to kill (may have already terminated)',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[/api/workflow/kill] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
