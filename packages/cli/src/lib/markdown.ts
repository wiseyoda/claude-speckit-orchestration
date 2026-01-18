/**
 * Shared markdown parsing utilities
 * @module lib/markdown
 *
 * Common patterns for parsing markdown documents, especially checkboxes.
 */

/**
 * Raw checkbox state as parsed from markdown
 */
export type CheckboxState = 'checked' | 'unchecked' | 'partial' | null;

/**
 * Checkbox marker characters and their states
 */
const CHECKBOX_STATES: Record<string, CheckboxState> = {
  x: 'checked',
  X: 'checked',
  ' ': 'unchecked',
  '~': 'partial',
  '-': 'partial',
  b: 'partial',
  B: 'partial',
};

/**
 * Result of parsing a checkbox line
 */
export interface CheckboxParseResult {
  /** The checkbox state (checked, unchecked, partial) */
  state: CheckboxState;
  /** The raw marker character inside brackets */
  marker: string;
  /** The content after the checkbox */
  content: string;
  /** Original indentation (spaces/tabs before the dash) */
  indent: string;
}

/**
 * Parse a markdown checkbox line
 *
 * Supported formats:
 * - `- [ ] content` → unchecked
 * - `- [x] content` or `- [X] content` → checked
 * - `- [~] content` or `- [-] content` → partial (deferred/skipped)
 * - `- [b] content` or `- [B] content` → partial (blocked)
 *
 * @param line - The line to parse
 * @returns Parse result or null if not a checkbox line
 *
 * @example
 * parseCheckbox('- [ ] Task to do');
 * // { state: 'unchecked', marker: ' ', content: 'Task to do', indent: '' }
 *
 * parseCheckbox('  - [x] Completed task');
 * // { state: 'checked', marker: 'x', content: 'Completed task', indent: '  ' }
 */
export function parseCheckbox(line: string): CheckboxParseResult | null {
  // Match: optional indent, dash, space, bracket, marker, bracket, space, content
  const match = line.match(/^(\s*)-\s*\[([xX ~\-bB])\]\s*(.*)$/);
  if (!match) return null;

  const [, indent, marker, content] = match;
  const state = CHECKBOX_STATES[marker] ?? null;

  return {
    state,
    marker,
    content: content.trim(),
    indent,
  };
}

/**
 * Check if a line is a checkbox line (without full parsing)
 *
 * @param line - The line to check
 * @returns true if the line contains a checkbox
 */
export function isCheckboxLine(line: string): boolean {
  return /^\s*-\s*\[[xX ~\-bB]\]/.test(line);
}

/**
 * Parse a markdown header line
 *
 * @param line - The line to parse
 * @returns Header info or null if not a header
 *
 * @example
 * parseHeader('## Section Name');
 * // { level: 2, text: 'Section Name' }
 */
export function parseHeader(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;

  return {
    level: match[1].length,
    text: match[2].trim(),
  };
}

/**
 * Extract bold text pattern from a line
 *
 * @param line - The line to parse
 * @param pattern - Optional pattern name to match (e.g., 'Purpose', 'Goal')
 * @returns The value after the pattern, or null
 *
 * @example
 * parseBoldPattern('**Purpose**: Something here', 'Purpose');
 * // 'Something here'
 */
export function parseBoldPattern(line: string, pattern?: string): string | null {
  const regex = pattern
    ? new RegExp(`^\\*\\*${pattern}\\*\\*:\\s*(.+)$`)
    : /^\*\*([^*]+)\*\*:\s*(.+)$/;

  const match = line.match(regex);
  if (!match) return null;

  return pattern ? match[1].trim() : match[2].trim();
}

/**
 * Generate a standardized ID from an index
 *
 * @param prefix - ID prefix (e.g., 'T', 'V', 'I')
 * @param index - Numeric index
 * @param digits - Number of digits to pad (default: 3)
 * @returns Formatted ID (e.g., 'T001', 'V042')
 *
 * @example
 * generateId('T', 1); // 'T001'
 * generateId('V', 42); // 'V042'
 */
export function generateId(prefix: string, index: number, digits = 3): string {
  return `${prefix}${String(index).padStart(digits, '0')}`;
}

/**
 * Extract an ID from content using a pattern
 *
 * @param content - The content to search
 * @param pattern - Regex pattern to match (default: /\b[A-Z]\d{3}[a-z]?\b/)
 * @returns First matching ID or null
 *
 * @example
 * extractId('T001 Do something'); // 'T001'
 * extractId('V-042 Check something', /[A-Z]-\d{3}/); // 'V-042'
 */
export function extractId(content: string, pattern?: RegExp): string | null {
  const regex = pattern ?? /\b[A-Z]\d{3}[a-z]?\b/;
  const match = content.match(regex);
  return match ? match[0] : null;
}
