/**
 * Process Spawner - Detached CLI process management
 *
 * Spawns Claude CLI processes in a detached mode so they survive
 * dashboard disconnects/restarts. Tracks PIDs persistently for
 * process health monitoring.
 */

import { spawn, execSync, type ChildProcess } from 'child_process';
import { writeFileSync, existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

export interface SpawnOptions {
  /** Working directory for the process */
  cwd: string;
  /** Directory to store workflow artifacts (script, output, pid) */
  workflowDir: string;
  /** Script content to execute */
  scriptContent: string;
  /** Environment variables to pass */
  env: Record<string, string>;
  /** Timeout in milliseconds (for tracking, not enforced on detached process) */
  timeoutMs?: number;
}

export interface SpawnResult {
  /** The bash shell PID (parent of claude process) */
  bashPid: number;
  /** The actual claude CLI PID (if detectable) */
  claudePid: number | null;
  /** Path to the output file */
  outputFile: string;
  /** Path to the PID file */
  pidFile: string;
}

/**
 * Find the actual claude process PID given a bash shell PID
 * Claude runs as a child of the bash shell script
 */
export function findClaudePid(bashPid: number): number | null {
  try {
    // Use pgrep to find child processes of the bash shell
    const output = execSync(`pgrep -P ${bashPid}`, {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    if (output) {
      const pids = output.split('\n').map(p => parseInt(p.trim(), 10));
      // Return the first valid child PID (should be claude)
      const validPid = pids.find(p => !isNaN(p) && p > 0);
      return validPid || null;
    }
    return null;
  } catch {
    // pgrep returns non-zero if no processes found
    return null;
  }
}

/**
 * Check if a PID is still alive
 */
export function isPidAlive(pid: number): boolean {
  try {
    // kill with signal 0 just checks if process exists
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the stored PID from a workflow's pid file
 */
export function readPidFile(workflowDir: string): { bashPid?: number; claudePid?: number } | null {
  const pidFile = join(workflowDir, 'process.pid');
  if (!existsSync(pidFile)) {
    return null;
  }
  try {
    const content = readFileSync(pidFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Write PIDs to the workflow's pid file
 */
export function writePidFile(
  workflowDir: string,
  pids: { bashPid: number; claudePid?: number | null }
): void {
  const pidFile = join(workflowDir, 'process.pid');
  writeFileSync(pidFile, JSON.stringify(pids, null, 2));
}

/**
 * Clean up the pid file when process completes
 */
export function cleanupPidFile(workflowDir: string): void {
  const pidFile = join(workflowDir, 'process.pid');
  try {
    if (existsSync(pidFile)) {
      unlinkSync(pidFile);
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Spawn a detached Claude CLI process
 *
 * The process runs independently of Node.js, surviving dashboard restarts.
 * Use pollForCompletion() to check when the process finishes.
 */
export function spawnDetachedClaude(options: SpawnOptions): SpawnResult {
  const { cwd, workflowDir, scriptContent, env } = options;

  const scriptFile = join(workflowDir, 'run-workflow.sh');
  const outputFile = join(workflowDir, 'workflow-output.json');
  const pidFile = join(workflowDir, 'process.pid');

  // Write the script file
  writeFileSync(scriptFile, scriptContent, { mode: 0o755 });

  // Spawn detached process
  const child = spawn('/bin/bash', [scriptFile], {
    cwd,
    env: { ...process.env, ...env },
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'], // Fully detach from stdio
  });

  // Allow Node.js to exit independently
  child.unref();

  const bashPid = child.pid!;

  // Write initial PID file with just bash PID
  writePidFile(workflowDir, { bashPid });

  // Try to find claude PID after a brief delay (async)
  let claudePid: number | null = null;
  setTimeout(() => {
    claudePid = findClaudePid(bashPid);
    if (claudePid) {
      writePidFile(workflowDir, { bashPid, claudePid });
    }
  }, 1000);

  return {
    bashPid,
    claudePid,
    outputFile,
    pidFile,
  };
}

/**
 * Poll for process completion by checking output file
 *
 * Returns when:
 * - Output file exists and has content
 * - Process PIDs are dead
 * - Timeout reached
 */
export async function pollForCompletion(
  workflowDir: string,
  timeoutMs: number = 4 * 60 * 60 * 1000, // 4 hours default
  pollIntervalMs: number = 2000
): Promise<{ completed: boolean; output: string | null; timedOut: boolean }> {
  const outputFile = join(workflowDir, 'workflow-output.json');
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        resolve({ completed: false, output: null, timedOut: true });
        return;
      }

      // Check if output file exists and has content
      if (existsSync(outputFile)) {
        try {
          const content = readFileSync(outputFile, 'utf-8');
          if (content.trim().length > 0) {
            // Output file has content - process completed
            clearInterval(checkInterval);
            cleanupPidFile(workflowDir);
            resolve({ completed: true, output: content, timedOut: false });
            return;
          }
        } catch {
          // File exists but can't be read yet, keep polling
        }
      }

      // Check if process is still alive
      const pids = readPidFile(workflowDir);
      if (pids) {
        const bashAlive = pids.bashPid ? isPidAlive(pids.bashPid) : false;
        const claudeAlive = pids.claudePid ? isPidAlive(pids.claudePid) : false;

        // If both PIDs are dead and no output, process failed
        if (!bashAlive && !claudeAlive) {
          // Give a brief moment for output file to be written
          setTimeout(() => {
            if (existsSync(outputFile)) {
              try {
                const content = readFileSync(outputFile, 'utf-8');
                clearInterval(checkInterval);
                cleanupPidFile(workflowDir);
                resolve({ completed: true, output: content, timedOut: false });
                return;
              } catch {
                // Fall through
              }
            }
            clearInterval(checkInterval);
            cleanupPidFile(workflowDir);
            resolve({ completed: true, output: null, timedOut: false });
          }, 500);
        }
      }
    }, pollIntervalMs);
  });
}

/**
 * Kill a process by PID
 * Tries SIGTERM first, then SIGKILL after grace period
 */
export function killProcess(pid: number, force: boolean = false): boolean {
  try {
    if (force) {
      process.kill(pid, 'SIGKILL');
    } else {
      process.kill(pid, 'SIGTERM');
      // Schedule SIGKILL after grace period
      setTimeout(() => {
        try {
          if (isPidAlive(pid)) {
            process.kill(pid, 'SIGKILL');
          }
        } catch {
          // Already dead
        }
      }, 5000);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Find all running claude processes on the system
 *
 * WARNING: This matches ANY process with "claude" in the command name,
 * which includes legitimate user-started Claude Code sessions. Do NOT
 * use this for automatic cleanup - only for reporting/diagnostics.
 */
export function findAllClaudeProcesses(): Array<{ pid: number; startTime: Date }> {
  try {
    // Use ps to find claude processes with start time
    const output = execSync(
      'ps -eo pid,lstart,comm | grep -E "^\\s*[0-9]+.*claude" | grep -v grep',
      { encoding: 'utf-8', timeout: 5000 }
    );

    const processes: Array<{ pid: number; startTime: Date }> = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
      // Parse: "  1234 Mon Jan 20 10:30:00 2026 claude"
      const match = line.match(/^\s*(\d+)\s+(.+?)\s+claude$/);
      if (match) {
        const pid = parseInt(match[1], 10);
        const startTime = new Date(match[2]);
        if (!isNaN(pid) && !isNaN(startTime.getTime())) {
          processes.push({ pid, startTime });
        }
      }
    }

    return processes;
  } catch {
    // No claude processes or command failed
    return [];
  }
}
