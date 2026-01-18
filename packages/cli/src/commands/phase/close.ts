import { output } from '../../lib/output.js';
import { readState, writeState, setStateValue } from '../../lib/state.js';
import { readRoadmap, updatePhaseStatus } from '../../lib/roadmap.js';
import { archivePhase } from '../../lib/history.js';
import { scanDeferredItems, addToBacklog, type DeferredSummary } from '../../lib/backlog.js';
import { findProjectRoot } from '../../lib/paths.js';
import { handleError, NotFoundError, ValidationError } from '../../lib/errors.js';
import {
  cleanupPhaseSpecs,
  getSpecsCleanupPreview,
  type SpecCleanupResult,
} from '../../lib/specs.js';

/**
 * Phase close output
 */
export interface PhaseCloseOutput {
  action: 'closed' | 'dry_run';
  phase: {
    number: string;
    name: string;
  };
  archived: boolean;
  specsCleanup: {
    cleaned: boolean;
    filesArchived: number;
    archivePath: string | null;
    skipped: boolean;
  };
  deferredItems: {
    count: number;
    withTarget: number;
    toBacklog: number;
  };
  nextPhase: {
    number: string;
    name: string;
  } | null;
  message: string;
}

interface CloseOptions {
  dryRun?: boolean;
  keepSpecs?: boolean;
}

/**
 * Close the current phase
 */
async function closePhase(options: CloseOptions = {}): Promise<PhaseCloseOutput> {
  const { dryRun = false, keepSpecs = false } = options;
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    throw new NotFoundError('SpecFlow project', 'Not in a SpecFlow project directory');
  }

  // Read current state
  const state = await readState(projectRoot);
  const { phase } = state.orchestration;

  if (!phase.number || !phase.name) {
    throw new ValidationError(
      'No active phase',
      'Use "specflow phase open" to start a phase first',
    );
  }

  if (phase.status === 'complete') {
    throw new ValidationError(
      `Phase ${phase.number} is already complete`,
      'Use "specflow phase open" to start the next phase',
    );
  }

  // Read roadmap to find next phase
  const roadmap = await readRoadmap(projectRoot);
  const nextPhase = roadmap.phases.find(
    p => p.status === 'not_started' && p.number !== phase.number,
  );

  // Scan for deferred items
  const deferred: DeferredSummary = await scanDeferredItems(
    phase.number,
    phase.name,
    projectRoot,
  );

  // Get specs cleanup preview
  const specsPreview = await getSpecsCleanupPreview(phase.number, projectRoot);

  if (dryRun) {
    return {
      action: 'dry_run',
      phase: {
        number: phase.number,
        name: phase.name,
      },
      archived: false,
      specsCleanup: {
        cleaned: false,
        filesArchived: specsPreview.fileCount,
        archivePath: null,
        skipped: keepSpecs,
      },
      deferredItems: {
        count: deferred.count,
        withTarget: deferred.withTarget,
        toBacklog: deferred.toBacklog,
      },
      nextPhase: nextPhase
        ? { number: nextPhase.number, name: nextPhase.name }
        : null,
      message: `Would close Phase ${phase.number}`,
    };
  }

  // 1. Update ROADMAP.md status
  await updatePhaseStatus(phase.number, 'complete', projectRoot);

  // 2. Archive phase to HISTORY.md
  const archiveResult = await archivePhase(
    { number: phase.number, name: phase.name, status: 'complete', hasUserGate: false, line: 0 },
    projectRoot,
  );

  // 3. Handle deferred items - add backlog items
  const backlogItems = deferred.items.filter(
    i => !i.targetPhase || i.targetPhase === 'Backlog',
  );
  if (backlogItems.length > 0) {
    await addToBacklog(backlogItems, phase.number, projectRoot);
  }

  // 4. Clean up specs directory (archive to .specify/archive/, delete from specs/)
  let specsCleanupResult: SpecCleanupResult = {
    cleaned: false,
    specsDir: null,
    archivePath: null,
    filesArchived: 0,
  };
  if (!keepSpecs) {
    specsCleanupResult = await cleanupPhaseSpecs(phase.number, projectRoot);
  }

  // 5. Add to actions.history in state file
  const historyEntry: Record<string, unknown> = {
    type: 'phase_completed',
    phase_number: phase.number,
    phase_name: phase.name,
    branch: phase.branch,
    completed_at: new Date().toISOString(),
    tasks_completed: state.orchestration.progress?.tasks_completed ?? 0,
    tasks_total: state.orchestration.progress?.tasks_total ?? 0,
  };

  // Get existing history or create empty array
  const existingHistory = (state.actions?.history as unknown[]) ?? [];
  const updatedHistory = [...existingHistory, historyEntry];

  // 5. Reset state for next phase
  let newState = state;
  newState = setStateValue(newState, 'actions.history', updatedHistory);
  newState = setStateValue(newState, 'orchestration.phase.number', null);
  newState = setStateValue(newState, 'orchestration.phase.name', null);
  newState = setStateValue(newState, 'orchestration.phase.branch', null);
  newState = setStateValue(newState, 'orchestration.phase.status', 'not_started');
  newState = setStateValue(newState, 'orchestration.step.current', 'design');
  newState = setStateValue(newState, 'orchestration.step.index', 0);
  newState = setStateValue(newState, 'orchestration.step.status', 'not_started');
  newState = setStateValue(newState, 'orchestration.implement', null);
  newState = setStateValue(
    newState,
    'orchestration.next_phase',
    nextPhase ? { number: nextPhase.number, name: nextPhase.name } : null,
  );

  await writeState(newState, projectRoot);

  return {
    action: 'closed',
    phase: {
      number: phase.number,
      name: phase.name,
    },
    archived: archiveResult.archived,
    specsCleanup: {
      cleaned: specsCleanupResult.cleaned,
      filesArchived: specsCleanupResult.filesArchived,
      archivePath: specsCleanupResult.archivePath,
      skipped: keepSpecs,
    },
    deferredItems: {
      count: deferred.count,
      withTarget: deferred.withTarget,
      toBacklog: deferred.toBacklog,
    },
    nextPhase: nextPhase
      ? { number: nextPhase.number, name: nextPhase.name }
      : null,
    message: `Phase ${phase.number} complete`,
  };
}

/**
 * Format human-readable output
 */
function formatHumanReadable(result: PhaseCloseOutput): string {
  const lines: string[] = [];

  if (result.action === 'dry_run') {
    lines.push('DRY RUN - Would perform:');
    lines.push(`  1. Update ROADMAP.md: Phase ${result.phase.number} → Complete`);
    lines.push(`  2. Archive phase to HISTORY.md`);
    lines.push(`  3. Reset orchestration state`);

    let stepNum = 4;
    if (result.deferredItems.count > 0) {
      lines.push(`  ${stepNum}. Handle ${result.deferredItems.count} deferred items:`);
      if (result.deferredItems.withTarget > 0) {
        lines.push(`     - ${result.deferredItems.withTarget} targeted to future phases`);
      }
      if (result.deferredItems.toBacklog > 0) {
        lines.push(`     - ${result.deferredItems.toBacklog} added to BACKLOG.md`);
      }
      stepNum++;
    }

    if (result.specsCleanup.skipped) {
      lines.push(`  ${stepNum}. Skip specs cleanup (--keep-specs)`);
    } else if (result.specsCleanup.filesArchived > 0) {
      lines.push(
        `  ${stepNum}. Archive ${result.specsCleanup.filesArchived} spec files to .specify/archive/`,
      );
    }

    lines.push('');
    lines.push('No changes made.');
    return lines.join('\n');
  }

  lines.push(`Closing phase ${result.phase.number}...`);
  lines.push('✓ Updated ROADMAP.md');
  lines.push('✓ Archived to HISTORY.md');
  lines.push('✓ Reset orchestration state');

  // Specs cleanup status
  if (result.specsCleanup.skipped) {
    lines.push('○ Specs kept (--keep-specs)');
  } else if (result.specsCleanup.cleaned) {
    lines.push(`✓ Archived ${result.specsCleanup.filesArchived} spec files`);
  }

  if (result.deferredItems.count > 0) {
    lines.push('');
    lines.push(`${result.deferredItems.count} deferred items found:`);
    if (result.deferredItems.withTarget > 0) {
      lines.push(`  → ${result.deferredItems.withTarget} targeted to future phases`);
    }
    if (result.deferredItems.toBacklog > 0) {
      lines.push(`  → ${result.deferredItems.toBacklog} added to BACKLOG.md`);
    }
  }

  lines.push('');
  lines.push(`Phase ${result.phase.number} complete.`);

  if (result.nextPhase) {
    lines.push(`Next: Phase ${result.nextPhase.number} (${result.nextPhase.name})`);
  }

  return lines.join('\n');
}

/**
 * Phase close action
 */
export async function closeAction(options: {
  json?: boolean;
  dryRun?: boolean;
  keepSpecs?: boolean;
}): Promise<void> {
  try {
    const result = await closePhase({
      dryRun: options.dryRun,
      keepSpecs: options.keepSpecs,
    });

    if (options.json) {
      output(result);
    } else {
      output(result, formatHumanReadable(result));
    }
  } catch (err) {
    handleError(err);
  }
}
