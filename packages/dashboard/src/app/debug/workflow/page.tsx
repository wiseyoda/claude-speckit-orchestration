'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface WorkflowQuestion {
  question: string;
  header?: string;
  options?: Array<{ label: string; description: string }>;
  multiSelect?: boolean;
}

interface WorkflowOutput {
  status: 'completed' | 'needs_input' | 'error';
  phase?: string;
  message?: string;
  questions?: WorkflowQuestion[];
  artifacts?: Array<{ path: string; action: string }>;
}

interface WorkflowExecution {
  id: string;
  sessionId?: string;
  projectPath: string;
  skill: string;
  status: 'running' | 'waiting_for_input' | 'completed' | 'failed';
  output?: WorkflowOutput;
  answers: Record<string, string>;
  logs: string[];
  stdout: string;
  stderr: string;
  error?: string;
  startedAt: string;
  updatedAt: string;
  costUsd?: number;
}

const POLL_INTERVAL = 3000; // 3 seconds

export default function WorkflowDebugPage() {
  const [projectPath, setProjectPath] = useState('~/dev/test-app');
  const [skill, setSkill] = useState('/flow.design');
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastPoll, setLastPoll] = useState<string>('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for status
  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/debug/workflow/status?id=${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch status');
      }
      const data = await res.json();
      setExecution(data);
      setLastPoll(new Date().toLocaleTimeString());
      setError(null);

      // Stop polling if terminal state
      if (data.status !== 'running') {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Start polling
  const startPolling = useCallback((id: string) => {
    // Clear any existing polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    // Poll immediately
    pollStatus(id);

    // Then poll every interval
    pollRef.current = setInterval(() => pollStatus(id), POLL_INTERVAL);
  }, [pollStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  // Start workflow
  const handleStart = async () => {
    setError(null);
    setExecution(null);
    setAnswers({});
    setExecutionId(null);

    try {
      const res = await fetch('/api/debug/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, skill }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start');
      }

      const data = await res.json();
      setExecutionId(data.id);
      setExecution(data);
      startPolling(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Submit answers and resume
  const handleSubmitAnswers = async () => {
    if (!executionId) return;
    setError(null);

    try {
      const res = await fetch('/api/debug/workflow/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: executionId, answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resume');
      }

      const data = await res.json();
      setExecution(data);
      setAnswers({}); // Clear for next round
      startPolling(executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Handle answer change for radio/text
  const handleAnswerChange = (questionIndex: number, value: string) => {
    const question = execution?.output?.questions?.[questionIndex];
    const key = question?.header || `q${questionIndex}`;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Handle multi-select change
  const handleMultiSelectChange = (
    questionIndex: number,
    option: string,
    checked: boolean
  ) => {
    const question = execution?.output?.questions?.[questionIndex];
    const key = question?.header || `q${questionIndex}`;
    const current = answers[key] ? answers[key].split(',').filter(Boolean) : [];

    let updated: string[];
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter((o) => o !== option);
    }

    setAnswers((prev) => ({ ...prev, [key]: updated.join(',') }));
  };

  // Check if all questions are answered
  const allQuestionsAnswered = () => {
    if (!execution?.output?.questions) return false;
    return execution.output.questions.every((q, i) => {
      const key = q.header || `q${i}`;
      return answers[key] && answers[key].length > 0;
    });
  };

  const isRunning = execution?.status === 'running';
  const isWaiting = execution?.status === 'waiting_for_input';
  const isComplete = execution?.status === 'completed';
  const isFailed = execution?.status === 'failed';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Workflow Debug</h1>
        <p className="text-gray-400 mb-6">
          Test Claude CLI workflow execution with question/answer loop
        </p>

        {/* Config Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Project Path
              </label>
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white font-mono text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Skill</label>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white font-mono text-sm"
                disabled={isRunning}
              />
            </div>
          </div>
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded font-medium transition-colors"
          >
            {isRunning ? 'Running...' : 'Start Workflow'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Execution Status */}
        {execution && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Execution Status</h2>
              {isRunning && (
                <span className="text-sm text-gray-400">
                  Last poll: {lastPoll}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">ID:</span>{' '}
                <span className="font-mono">{execution.id.slice(0, 8)}...</span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>{' '}
                <span
                  className={`font-semibold ${
                    isComplete
                      ? 'text-green-400'
                      : isFailed
                        ? 'text-red-400'
                        : isWaiting
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                  }`}
                >
                  {execution.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Session:</span>{' '}
                <span className="font-mono">
                  {execution.sessionId?.slice(0, 8) || 'pending'}...
                </span>
              </div>
              <div>
                <span className="text-gray-400">Cost:</span>{' '}
                <span className="text-green-400">
                  ${execution.costUsd?.toFixed(4) || '0.0000'}
                </span>
              </div>
            </div>

            {/* Phase */}
            {execution.output?.phase && (
              <div className="mt-4 inline-block bg-purple-600/30 border border-purple-500 rounded px-3 py-1">
                <span className="text-purple-300 text-sm font-medium">
                  Phase: {execution.output.phase}
                </span>
              </div>
            )}

            {/* Message */}
            {execution.output?.message && (
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                <p className="text-gray-300">{execution.output.message}</p>
              </div>
            )}

            {/* Error */}
            {execution.error && (
              <div className="mt-4 p-4 bg-red-900/30 rounded-lg border border-red-500/50">
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm mt-1">{execution.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Questions Section */}
        {isWaiting && execution?.output?.questions && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Questions ({execution.output.questions.length})
            </h2>

            <div className="space-y-6">
              {execution.output.questions.map((q, i) => (
                <div key={i} className="bg-gray-700/50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {q.header && (
                      <span className="bg-blue-600 text-xs px-2 py-1 rounded font-medium">
                        {q.header}
                      </span>
                    )}
                    {q.multiSelect && (
                      <span className="bg-purple-600 text-xs px-2 py-1 rounded">
                        Multi-select
                      </span>
                    )}
                  </div>

                  <p className="text-lg mb-4">{q.question}</p>

                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-2">
                      {q.options.map((opt, j) => (
                        <label
                          key={j}
                          className="flex items-start gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        >
                          {q.multiSelect ? (
                            <input
                              type="checkbox"
                              checked={(answers[q.header || `q${i}`] || '')
                                .split(',')
                                .includes(opt.label)}
                              onChange={(e) =>
                                handleMultiSelectChange(i, opt.label, e.target.checked)
                              }
                              className="mt-1 w-4 h-4 accent-blue-500"
                            />
                          ) : (
                            <input
                              type="radio"
                              name={`q${i}`}
                              value={opt.label}
                              checked={answers[q.header || `q${i}`] === opt.label}
                              onChange={() => handleAnswerChange(i, opt.label)}
                              className="mt-1 w-4 h-4 accent-blue-500"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{opt.label}</div>
                            <div className="text-sm text-gray-400 mt-0.5">
                              {opt.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={answers[q.header || `q${i}`] || ''}
                      onChange={(e) => handleAnswerChange(i, e.target.value)}
                      className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                      placeholder="Type your answer..."
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmitAnswers}
              disabled={!allQuestionsAnswered()}
              className="mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors w-full"
            >
              {allQuestionsAnswered()
                ? 'Submit Answers & Continue'
                : 'Answer all questions to continue'}
            </button>
          </div>
        )}

        {/* Artifacts */}
        {execution?.output?.artifacts && execution.output.artifacts.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Artifacts Created</h2>
            <ul className="space-y-2">
              {execution.output.artifacts.map((a, i) => (
                <li key={i} className="flex items-center gap-2 font-mono text-sm">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      a.action === 'created'
                        ? 'bg-green-600/30 text-green-400'
                        : 'bg-yellow-600/30 text-yellow-400'
                    }`}
                  >
                    {a.action}
                  </span>
                  <span className="text-gray-300">{a.path}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completed */}
        {isComplete && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-400 mb-2">
              Workflow Completed!
            </h2>
            <p className="text-gray-300">
              Total cost: ${execution?.costUsd?.toFixed(4)}
            </p>
            {Object.keys(execution?.answers || {}).length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Answers provided:</p>
                <pre className="bg-black/50 rounded p-3 text-xs overflow-x-auto">
                  {JSON.stringify(execution?.answers, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        {execution && execution.logs.length > 0 && (
          <details className="bg-gray-800 rounded-lg p-6 mb-6">
            <summary className="cursor-pointer text-lg font-semibold">
              Logs ({execution.logs.length})
            </summary>
            <div className="mt-4 bg-black rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
              {execution.logs.map((log, i) => (
                <div
                  key={i}
                  className={`py-0.5 ${
                    log.includes('[ERROR]') || log.includes('[FAILED]')
                      ? 'text-red-400'
                      : log.includes('[OK]') || log.includes('[COMPLETE]')
                        ? 'text-green-400'
                        : log.includes('[WAITING]')
                          ? 'text-yellow-400'
                          : log.includes('[RESUME]')
                            ? 'text-purple-400'
                            : 'text-gray-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Raw Output */}
        {execution?.stdout && (
          <details className="bg-gray-800 rounded-lg p-6 mb-6">
            <summary className="cursor-pointer text-lg font-semibold">
              Raw Output ({execution.stdout.length} bytes)
            </summary>
            <pre className="mt-4 bg-black rounded-lg p-4 text-xs overflow-x-auto max-h-64">
              {execution.stdout.slice(0, 5000)}
              {execution.stdout.length > 5000 && '\n...(truncated)'}
            </pre>
          </details>
        )}

        {/* All Answers */}
        {Object.keys(execution?.answers || {}).length > 0 && !isComplete && (
          <details className="bg-gray-800 rounded-lg p-6">
            <summary className="cursor-pointer text-lg font-semibold">
              All Answers So Far
            </summary>
            <pre className="mt-4 bg-black rounded-lg p-4 text-xs overflow-x-auto">
              {JSON.stringify(execution?.answers, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
