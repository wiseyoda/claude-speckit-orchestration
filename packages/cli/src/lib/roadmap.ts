import { readFile } from 'node:fs/promises';
import { getRoadmapPath, pathExists, findProjectRoot } from './paths.js';
import { NotFoundError } from './errors.js';

/**
 * Phase status from ROADMAP.md
 */
export type PhaseStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'awaiting_user'
  | 'blocked';

/**
 * Parsed phase from ROADMAP.md
 */
export interface Phase {
  number: string;
  name: string;
  status: PhaseStatus;
  hasUserGate: boolean;
  verificationGate?: string;
  line: number;
}

/**
 * Complete parsed roadmap data
 */
export interface RoadmapData {
  filePath: string;
  projectName?: string;
  schemaVersion?: string;
  phases: Phase[];
  activePhase?: Phase;
  nextPhase?: Phase;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

/**
 * Parse phase status from status cell in table
 * Handles emoji and text formats: ✅, COMPLETE, DONE, 🔄, IN PROGRESS, IN_PROGRESS, etc.
 */
function parsePhaseStatus(statusCell: string): PhaseStatus {
  const lower = statusCell.toLowerCase().replace(/_/g, ' ');

  // Complete states
  if (lower.includes('✅') || lower.includes('complete') || lower.includes('done')) {
    return 'complete';
  }
  // In progress states
  if (lower.includes('🔄') || lower.includes('in progress') || lower.includes('active')) {
    return 'in_progress';
  }
  // Awaiting user states
  if (lower.includes('⏳') || lower.includes('awaiting') || lower.includes('waiting')) {
    return 'awaiting_user';
  }
  // Blocked states
  if (lower.includes('🚫') || lower.includes('blocked')) {
    return 'blocked';
  }
  // Not started states
  if (lower.includes('⬜') || lower.includes('not started') || lower.includes('pending')) {
    return 'not_started';
  }

  return 'not_started';
}

/**
 * Check if phase has USER GATE marker
 */
function hasUserGate(text: string): boolean {
  return text.toUpperCase().includes('USER GATE');
}

/**
 * Parse a table row into phase data
 * Expected format: | Phase | Name | Status | Verification Gate |
 */
function parseTableRow(row: string, lineNumber: number): Phase | null {
  // Remove leading/trailing pipes and split
  const cells = row
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(c => c.trim());

  if (cells.length < 3) return null;

  const [phaseCell, nameCell, statusCell, gateCell] = cells;

  // Extract phase number (e.g., "0010", "1020")
  const phaseMatch = phaseCell.match(/(\d{4})/);
  if (!phaseMatch) return null;

  const number = phaseMatch[1];
  const name = nameCell || '';
  const status = parsePhaseStatus(statusCell || '');
  const hasGate = hasUserGate(gateCell || '') || hasUserGate(statusCell || '');

  return {
    number,
    name,
    status,
    hasUserGate: hasGate,
    verificationGate: gateCell || undefined,
    line: lineNumber,
  };
}

/**
 * Parse ROADMAP.md content
 */
export function parseRoadmapContent(content: string, filePath: string): RoadmapData {
  const lines = content.split('\n');
  const phases: Phase[] = [];

  let projectName: string | undefined;
  let schemaVersion: string | undefined;
  let inTable = false;
  let tableHeaderSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Extract project name from **Project**: line
    const projectMatch = line.match(/^\*\*Project\*\*:\s*(.+)/);
    if (projectMatch) {
      projectName = projectMatch[1].trim();
      continue;
    }

    // Extract schema version
    const schemaMatch = line.match(/^\*\*Schema Version\*\*:\s*(.+)/);
    if (schemaMatch) {
      schemaVersion = schemaMatch[1].trim();
      continue;
    }

    // Detect table start (row with Phase | Name | Status pattern)
    if (line.includes('|') && (line.includes('Phase') || line.includes('Name') || line.includes('Status'))) {
      if (line.includes('Phase') && line.includes('Status')) {
        inTable = true;
        tableHeaderSeen = false;
        continue;
      }
    }

    // Skip table separator row
    if (inTable && line.match(/^\|[-:\s|]+\|$/)) {
      tableHeaderSeen = true;
      continue;
    }

    // Parse table rows after header
    if (inTable && tableHeaderSeen && line.startsWith('|')) {
      const phase = parseTableRow(line, lineNumber);
      if (phase) {
        phases.push(phase);
      }
      continue;
    }

    // End table if we see non-table content
    if (inTable && tableHeaderSeen && !line.startsWith('|') && line.trim() !== '') {
      inTable = false;
      tableHeaderSeen = false;
    }
  }

  // Find active and next phase
  const activePhase = phases.find(p => p.status === 'in_progress');
  const nextPhase = phases.find(p => p.status === 'not_started');

  // Calculate progress
  const total = phases.length;
  const completed = phases.filter(p => p.status === 'complete').length;

  return {
    filePath,
    projectName,
    schemaVersion,
    phases,
    activePhase,
    nextPhase,
    progress: {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
  };
}

/**
 * Read and parse ROADMAP.md for current project
 */
export async function readRoadmap(projectPath?: string): Promise<RoadmapData> {
  const root = projectPath || findProjectRoot();
  if (!root) {
    throw new NotFoundError(
      'SpecFlow project',
      'Ensure you are in a SpecFlow project directory',
    );
  }

  const roadmapPath = getRoadmapPath(root);

  if (!pathExists(roadmapPath)) {
    throw new NotFoundError(
      'ROADMAP.md',
      `No roadmap file found at ${roadmapPath}`,
    );
  }

  const content = await readFile(roadmapPath, 'utf-8');
  return parseRoadmapContent(content, roadmapPath);
}

/**
 * Get phase by number
 */
export function getPhaseByNumber(roadmap: RoadmapData, phaseNumber: string): Phase | null {
  return roadmap.phases.find(p => p.number === phaseNumber) ?? null;
}

/**
 * Get all phases with a given status
 */
export function getPhasesByStatus(roadmap: RoadmapData, status: PhaseStatus): Phase[] {
  return roadmap.phases.filter(p => p.status === status);
}

/**
 * Check if roadmap has any USER GATE phases pending
 */
export function hasPendingUserGates(roadmap: RoadmapData): boolean {
  return roadmap.phases.some(
    p => p.hasUserGate && (p.status === 'in_progress' || p.status === 'awaiting_user'),
  );
}
