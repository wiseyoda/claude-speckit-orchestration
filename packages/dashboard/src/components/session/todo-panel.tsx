'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, ListTodo, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import type { TodoItem } from '@/lib/session-parser';

interface TodoPanelProps {
  /** Current todo items from session */
  todos: TodoItem[];
  /** Optional additional class names */
  className?: string;
}

/**
 * Get status icon for a todo item
 */
function StatusIcon({ status }: { status: TodoItem['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
    case 'in_progress':
      return <CircleDot className="w-3.5 h-3.5 text-warning animate-pulse" />;
    case 'pending':
    default:
      return <Circle className="w-3.5 h-3.5 text-surface-500" />;
  }
}

/**
 * TodoPanel component
 *
 * Collapsible panel displaying Claude's internal todo list.
 * Shows status indicators and updates in real-time.
 */
export function TodoPanel({ todos, className }: TodoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count todos by status
  const completed = todos.filter((t) => t.status === 'completed').length;
  const inProgress = todos.filter((t) => t.status === 'in_progress').length;
  const pending = todos.filter((t) => t.status === 'pending').length;
  const total = todos.length;

  // Calculate progress percentage
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) {
    return null;
  }

  return (
    <div className={cn('mt-4 border-t border-surface-300 bg-surface-100', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-surface-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-surface-500" />
          )}
          <ListTodo className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-zinc-200">Claude's Todos</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-surface-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-surface-500">{progress}%</span>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-1.5 text-[10px]">
            {inProgress > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning font-medium">
                {inProgress} active
              </span>
            )}
            <span className="text-surface-500">
              {completed}/{total}
            </span>
          </div>
        </div>
      </button>

      {/* Todo list */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {todos.map((todo, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors',
                todo.status === 'in_progress' && 'bg-warning/5 border border-warning/20',
                todo.status === 'completed' && 'opacity-60',
                todo.status === 'pending' && 'hover:bg-white/5'
              )}
            >
              <div className="mt-0.5 flex-shrink-0">
                <StatusIcon status={todo.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm leading-relaxed',
                    todo.status === 'completed' && 'line-through text-surface-500',
                    todo.status === 'in_progress' && 'text-zinc-200 font-medium',
                    todo.status === 'pending' && 'text-zinc-400'
                  )}
                >
                  {todo.status === 'in_progress' ? todo.activeForm : todo.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
