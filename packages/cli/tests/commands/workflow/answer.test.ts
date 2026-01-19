import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/paths.js', () => ({
  findProjectRoot: vi.fn(() => '/test/project'),
}));

vi.mock('../../../src/lib/output.js', () => ({
  output: vi.fn(),
  getOutputOptions: vi.fn(() => ({ json: false })),
  setOutputOptions: vi.fn(),
}));

vi.mock('../../../src/lib/question-queue.js', () => ({
  getQuestion: vi.fn(),
  answerQuestion: vi.fn(),
  getPendingQuestions: vi.fn(),
}));

// Import after mocking
import {
  getQuestion,
  answerQuestion,
  getPendingQuestions,
} from '../../../src/lib/question-queue.js';

describe('workflow answer command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuestion', () => {
    it('should return question when found', async () => {
      const mockQuestion = {
        id: 'q-123',
        content: 'What framework?',
        options: [{ label: 'React', description: 'React framework' }],
        status: 'pending' as const,
        createdAt: '2026-01-18T00:00:00.000Z',
      };

      vi.mocked(getQuestion).mockResolvedValue(mockQuestion);

      const result = await getQuestion('/test/project', 'q-123');

      expect(result).toEqual(mockQuestion);
    });

    it('should return null when not found', async () => {
      vi.mocked(getQuestion).mockResolvedValue(null);

      const result = await getQuestion('/test/project', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('answerQuestion', () => {
    it('should update question with answer', async () => {
      const mockQuestion = {
        id: 'q-123',
        content: 'What framework?',
        options: [{ label: 'React', description: 'React framework' }],
        status: 'answered' as const,
        createdAt: '2026-01-18T00:00:00.000Z',
        answeredAt: '2026-01-18T00:01:00.000Z',
        answer: 'React',
      };

      vi.mocked(answerQuestion).mockResolvedValue(mockQuestion);

      const result = await answerQuestion('/test/project', 'q-123', 'React');

      expect(result?.status).toBe('answered');
      expect(result?.answer).toBe('React');
    });

    it('should throw when question already answered', async () => {
      vi.mocked(answerQuestion).mockRejectedValue(
        new Error('Question q-123 already answered')
      );

      await expect(
        answerQuestion('/test/project', 'q-123', 'React')
      ).rejects.toThrow('already answered');
    });
  });

  describe('getPendingQuestions', () => {
    it('should return only pending questions', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          content: 'Q1',
          options: [],
          status: 'pending' as const,
          createdAt: '2026-01-18T00:00:00.000Z',
        },
        {
          id: 'q-2',
          content: 'Q2',
          options: [],
          status: 'pending' as const,
          createdAt: '2026-01-18T00:00:00.000Z',
        },
      ];

      vi.mocked(getPendingQuestions).mockResolvedValue(mockQuestions);

      const result = await getPendingQuestions('/test/project');

      expect(result).toHaveLength(2);
      expect(result.every((q) => q.status === 'pending')).toBe(true);
    });

    it('should return empty array when no pending', async () => {
      vi.mocked(getPendingQuestions).mockResolvedValue([]);

      const result = await getPendingQuestions('/test/project');

      expect(result).toHaveLength(0);
    });
  });
});
