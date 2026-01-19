import { Command } from 'commander';
import { designCommand } from './design.js';
import { answerCommand } from './answer.js';
import { workflowStatusCommand } from './status.js';

/**
 * Workflow command - spawn Claude CLI to execute SpecFlow skills
 *
 * Usage:
 *   specflow workflow design            # Run /flow.design skill
 *   specflow workflow design --phase X  # Run specific design sub-phase
 *   specflow workflow answer <id> <ans> # Answer a queued question
 *   specflow workflow status            # Check running workflow status
 */
export const workflowCommand = new Command('workflow')
  .description('Execute SpecFlow skills via Claude CLI');

// Add subcommands
workflowCommand.addCommand(designCommand);
workflowCommand.addCommand(answerCommand);
workflowCommand.addCommand(workflowStatusCommand);
