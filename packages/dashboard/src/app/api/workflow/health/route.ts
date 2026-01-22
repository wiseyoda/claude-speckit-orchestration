/**
 * GET /api/workflow/health
 *
 * Get detailed health status for a workflow process.
 * Returns PID info, session file staleness, and health assessment.
 */

import { NextResponse } from 'next/server';
import { join } from 'path';
import { workflowService } from '@/lib/services/workflow-service';
import { readPidFile, isPidAlive } from '@/lib/services/process-spawner';
import {
  checkProcessHealth,
  getHealthStatusMessage,
  STALENESS_THRESHOLD_MS,
} from '@/lib/services/process-health';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');

    if (!id || !projectId) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, projectId' },
        { status: 400 }
      );
    }

    // Get the workflow execution
    const execution = workflowService.get(id, projectId);
    if (!execution) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

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

    // Get health status
    const health = checkProcessHealth(execution, projectPath);

    // Get PID file info
    const workflowDir = join(projectPath, '.specflow', 'workflows', id);
    const pids = readPidFile(workflowDir);

    return NextResponse.json({
      workflowId: id,
      workflowStatus: execution.status,
      health: {
        status: health.healthStatus,
        message: getHealthStatusMessage(health),
        staleness: {
          thresholdMs: STALENESS_THRESHOLD_MS,
          sessionFileAgeMs: health.sessionFileAge,
          isStale: health.isStale,
          lastUpdateAt: health.sessionFileMtime?.toISOString() || null,
        },
        processes: {
          bashPid: health.bashPid,
          bashAlive: health.bashAlive,
          claudePid: health.claudePid,
          claudeAlive: health.claudeAlive,
          legacyPid: execution.pid || null,
          legacyPidAlive: execution.pid ? isPidAlive(execution.pid) : false,
        },
        pidFile: pids ? {
          exists: true,
          bashPid: pids.bashPid,
          claudePid: pids.claudePid,
        } : {
          exists: false,
        },
      },
      sessionId: execution.sessionId || null,
      startedAt: execution.startedAt,
      updatedAt: execution.updatedAt,
    });
  } catch (error) {
    console.error('[/api/workflow/health] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
