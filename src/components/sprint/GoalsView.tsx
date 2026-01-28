// src/components/sprints/GoalsView.tsx
import React, { useState } from 'react';
import { useGoalsBySprint, useSprintGoalsSummary } from '../../hooks/api/useGoals';
import {
  Target,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface GoalsViewProps {
  sprintId: string;
  className?: string;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ sprintId, className = '' }) => {
  const { data: goals, isLoading: goalsLoading } = useGoalsBySprint(sprintId);
  const { data: summary, isLoading: summaryLoading } = useSprintGoalsSummary(sprintId);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const isLoading = goalsLoading || summaryLoading;

  const toggleGoalExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No goals state
  if (!goals || goals.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center ${className}`}
      >
        <Target className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Goals Set
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Set goals for this sprint to track team objectives and key results
        </p>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Create Sprint Goal
        </button>
      </div>
    );
  }

  // Get status color and icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'at-risk':
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'in-progress':
      case 'active':
        return <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'at-risk':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'in-progress':
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Sprint Goals Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Goals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {summary.totalGoals}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {summary.completedGoals}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">At Risk</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {summary.atRiskGoals}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(summary.overallProgress)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const isExpanded = expandedGoals.has(goal.id);
          const hasKeyResults = goal.keyResults && goal.keyResults.length > 0;

          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Goal Header */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(goal.status)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {goal.title}
                        </h4>
                        {goal.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                          goal.status
                        )}`}
                      >
                        {goal.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progress
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {Math.round(goal.progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {goal.targetDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {goal.ownerId && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Owner</span>
                        </div>
                      )}
                      {goal.targetValue !== undefined && (
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>
                            {goal.currentValue} / {goal.targetValue} {goal.unit || 'units'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse Button for Key Results */}
                    {hasKeyResults && (
                      <button
                        onClick={() => toggleGoalExpanded(goal.id)}
                        className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        {goal.keyResults.length} Key Result{goal.keyResults.length !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Results - Expandable */}
              {hasKeyResults && isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-6">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Key Results
                  </h5>
                  <div className="space-y-4">
                    {goal.keyResults!.map((kr) => (
                      <div
                        key={kr.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {kr.title}
                            </h6>
                            {kr.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {kr.description}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            Weight: {kr.weight}%
                          </span>
                        </div>

                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {kr.currentValue} / {kr.targetValue} {kr.unit || 'units'}
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {Math.round(kr.progress)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-green-600 dark:bg-green-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(kr.progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            kr.status
                          )}`}
                        >
                          {kr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Tasks */}
              {goal.linkedTasks && goal.linkedTasks.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{goal.linkedTasks.length}</span> linked task
                    {goal.linkedTasks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
