/**
 * 运行日志状态管理
 *
 * 管理底部控制台的日志条目，追踪当前运行状态（运行中/已停止）。
 * 日志按来源（stdout/stderr/system）和类型（info/success/warning/error）分类着色。
 */
import { create } from 'zustand';
import type { LogEntry } from '@/types';

interface LogState {
  entries: LogEntry[];
  isRunning: boolean;
  currentProjectId: string | null;
  /** 添加单条日志 */
  addEntry: (entry: LogEntry) => void;
  /** 批量添加日志 */
  addEntries: (entries: LogEntry[]) => void;
  /** 清空所有日志 */
  clearLogs: () => void;
  /** 设置运行状态，可关联当前运行的工程 */
  setRunning: (running: boolean, projectId?: string | null) => void;
}

export const useLogStore = create<LogState>()((set) => ({
  entries: [
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      source: 'system',
      message: '[系统] AI RPA智能体 已启动',
    },
  ],
  isRunning: false,
  currentProjectId: null,

  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  addEntries: (entries) => set((s) => ({ entries: [...s.entries, ...entries] })),
  clearLogs: () => set({ entries: [] }),

  setRunning: (running, projectId) =>
    set({ isRunning: running, currentProjectId: projectId ?? null }),
}));
