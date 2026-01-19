import { execSync } from 'child_process';

/**
 * Result of Claude CLI validation
 */
export interface ClaudeValidationResult {
  available: boolean;
  path?: string;
  error?: string;
}

/**
 * Validate that Claude CLI is installed and accessible
 *
 * @returns Validation result with availability status
 */
export function validateClaudeCli(): ClaudeValidationResult {
  try {
    // Try to find claude in PATH
    const path = execSync('which claude', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!path) {
      return {
        available: false,
        error: 'Claude CLI not found in PATH',
      };
    }

    return {
      available: true,
      path,
    };
  } catch {
    return {
      available: false,
      error:
        'Claude CLI not found. Install from https://claude.ai/code',
    };
  }
}

/**
 * Assert that Claude CLI is available, throwing if not
 *
 * @throws Error if Claude CLI is not available
 */
export function assertClaudeCliAvailable(): string {
  const result = validateClaudeCli();

  if (!result.available) {
    throw new Error(result.error);
  }

  return result.path!;
}
