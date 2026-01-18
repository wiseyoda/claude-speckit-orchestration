import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAutoFixableIssues,
  type HealthCheckResult,
  type HealthIssue,
} from '../../src/lib/health.js';

describe('health.ts', () => {
  describe('getAutoFixableIssues', () => {
    it('should filter auto-fixable issues', () => {
      const result: HealthCheckResult = {
        status: 'warning',
        issues: [
          {
            code: 'STATE_DRIFT',
            severity: 'warning',
            message: 'State drift detected',
            fix: 'Run specflow state set...',
            autoFixable: true,
          },
          {
            code: 'MISSING_ROADMAP',
            severity: 'warning',
            message: 'No ROADMAP.md found',
            fix: 'Create ROADMAP.md',
            autoFixable: false,
          },
          {
            code: 'BRANCH_MISMATCH',
            severity: 'warning',
            message: 'Branch mismatch',
            fix: 'git checkout ...',
            autoFixable: true,
          },
        ],
        summary: { errors: 0, warnings: 3, info: 0 },
      };

      const autoFixable = getAutoFixableIssues(result);
      expect(autoFixable).toHaveLength(2);
      expect(autoFixable.map(i => i.code)).toContain('STATE_DRIFT');
      expect(autoFixable.map(i => i.code)).toContain('BRANCH_MISMATCH');
    });

    it('should return empty array when no auto-fixable issues', () => {
      const result: HealthCheckResult = {
        status: 'warning',
        issues: [
          {
            code: 'MISSING_ROADMAP',
            severity: 'warning',
            message: 'No ROADMAP.md found',
            autoFixable: false,
          },
        ],
        summary: { errors: 0, warnings: 1, info: 0 },
      };

      const autoFixable = getAutoFixableIssues(result);
      expect(autoFixable).toHaveLength(0);
    });

    it('should return empty array when healthy', () => {
      const result: HealthCheckResult = {
        status: 'ready',
        issues: [],
        summary: { errors: 0, warnings: 0, info: 0 },
      };

      const autoFixable = getAutoFixableIssues(result);
      expect(autoFixable).toHaveLength(0);
    });
  });

  describe('HealthIssue structure', () => {
    it('should have required fields', () => {
      const issue: HealthIssue = {
        code: 'TEST_CODE',
        severity: 'error',
        message: 'Test message',
        autoFixable: false,
      };

      expect(issue.code).toBe('TEST_CODE');
      expect(issue.severity).toBe('error');
      expect(issue.message).toBe('Test message');
      expect(issue.autoFixable).toBe(false);
      expect(issue.fix).toBeUndefined();
    });

    it('should support optional fix field', () => {
      const issue: HealthIssue = {
        code: 'TEST_CODE',
        severity: 'warning',
        message: 'Test message',
        fix: 'Run this command',
        autoFixable: true,
      };

      expect(issue.fix).toBe('Run this command');
    });
  });

  describe('HealthCheckResult structure', () => {
    it('should calculate summary from issues', () => {
      const result: HealthCheckResult = {
        status: 'error',
        issues: [
          { code: 'E1', severity: 'error', message: 'Error 1', autoFixable: false },
          { code: 'E2', severity: 'error', message: 'Error 2', autoFixable: false },
          { code: 'W1', severity: 'warning', message: 'Warning 1', autoFixable: true },
          { code: 'I1', severity: 'info', message: 'Info 1', autoFixable: false },
        ],
        summary: { errors: 2, warnings: 1, info: 1 },
      };

      expect(result.summary.errors).toBe(2);
      expect(result.summary.warnings).toBe(1);
      expect(result.summary.info).toBe(1);
    });

    it('should support nextAction field', () => {
      const result: HealthCheckResult = {
        status: 'warning',
        issues: [],
        summary: { errors: 0, warnings: 0, info: 0 },
        nextAction: 'continue_implement',
      };

      expect(result.nextAction).toBe('continue_implement');
    });
  });
});
