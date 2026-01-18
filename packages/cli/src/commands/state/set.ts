import { Command } from 'commander';
import { z } from 'zod';
import { readState, writeState, setStateValue, parseValue } from '../../lib/state.js';
import { success } from '../../lib/output.js';
import { handleError, ValidationError } from '../../lib/errors.js';

/**
 * Zod schema for state key validation
 * Keys must be dot-separated alphanumeric identifiers
 */
const stateKeySchema = z
  .string()
  .min(1, 'Key cannot be empty')
  .max(256, 'Key too long (max 256 characters)')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/,
    'Key must be dot-separated identifiers (e.g., orchestration.step.current)',
  );

/**
 * Set a value in state using key=value format
 *
 * Examples:
 *   specflow state set orchestration.step.current=implement
 *   specflow state set orchestration.phase.status=in_progress
 *   specflow state set health.status=ready
 */
export const set = new Command('set')
  .description('Set a value in state')
  .argument('<keyvalue>', 'Key=value pair (e.g., orchestration.step.current=implement)')
  .option('--quiet', 'Suppress output')
  .action(async (keyvalue: string, options: { quiet?: boolean }) => {
    try {
      // Parse key=value
      const eqIndex = keyvalue.indexOf('=');
      if (eqIndex === -1) {
        throw new ValidationError(
          'Invalid format. Expected key=value',
          'Use format: specflow state set orchestration.step.current=implement',
        );
      }

      const key = keyvalue.slice(0, eqIndex);
      const valueStr = keyvalue.slice(eqIndex + 1);

      // Validate key format with Zod
      const keyResult = stateKeySchema.safeParse(key);
      if (!keyResult.success) {
        throw new ValidationError(
          keyResult.error.issues[0]?.message ?? 'Invalid key format',
          'Use format: orchestration.step.current',
        );
      }

      // Parse value (handles JSON, numbers, booleans, strings)
      const value = parseValue(valueStr);

      // Read, update, write
      const state = await readState();
      const updatedState = setStateValue(state, key, value);
      await writeState(updatedState);

      if (!options.quiet) {
        success(`Set ${key} = ${JSON.stringify(value)}`);
      }
    } catch (err) {
      handleError(err);
    }
  });
