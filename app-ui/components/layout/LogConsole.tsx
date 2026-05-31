/**
 * 底部日志控制台
 *
 * 功能：
 * - 实时流式展示 Python 脚本运行日志（stdout/stderr/system）
 * - 日志按类型着色：info(白) / success(绿) / warning(橙) / error(红)
 * - 控制栏：运行/停止按钮、暂停刷新、锁定滚动、导出日志、清空
 * - 自动滚动到底部（可锁定/暂停）
 */
import { useRef, useEffect, useState } from 'react';
import { Trash2, Download, Lock, Unlock, Pause, Play, Square, RotateCw } from 'lucide-react';
import { useLogStore } from '@/stores/useLogStore';
import { toast } from 'sonner';
import type { LogEntry } from '@/types';

/** 日志类型对应颜色 */
const LOG_COLORS: Record<LogEntry['type'], string> = {
  info: 'var(--text-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

export function LogConsole() {
  const entries = useLogStore((s) => s.entries);
  const isRunning = useLogStore((s) => s.isRunning);
  const clearLogs = useLogStore((s) => s.clearLogs);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  /** 自动滚动到底部（暂停/锁定时不滚动） */
  useEffect(() => {
    if (!isPaused && !isLocked) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isPaused, isLocked]);

  /** 运行/停止切换 */
  const handleToggleRun = () => {
    if (isRunning) {
      useLogStore.getState().setRunning(false);
      useLogStore.getState().addEntry({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(),
        type: 'warning', source: 'system', message: '[系统] 已停止运行' });
    } else {
      toast.info('请在编辑器中打开 Main.py 后点击运行按钮');
    }
  };

  return (
    <div className="h-full flex flex-col border-t" style={{ background: 'var(--bg-console)', borderColor: 'var(--border-color)' }}>
      {/* 工具栏 */}
      <div className="h-10 flex items-center justify-between px-4 border-b" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>运行日志</span>
        <div className="flex gap-1">
          <button onClick={handleToggleRun} className="p-1.5 rounded transition-colors hover:bg-[var(--bg-card)]"
            title={isRunning ? '停止运行' : '运行'}>
            {isRunning ? <Square className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
              : <RotateCw className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
          </button>
          <button onClick={() => setIsPaused(!isPaused)} className="p-1.5 rounded transition-colors hover:bg-[var(--bg-card)]"
            title={isPaused ? '继续刷新' : '暂停刷新'}>
            {isPaused ? <Play className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              : <Pause className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
          </button>
          <button onClick={() => setIsLocked(!isLocked)} className="p-1.5 rounded transition-colors hover:bg-[var(--bg-card)]"
            title={isLocked ? '解锁滚动' : '锁定滚动'}>
            {isLocked ? <Lock className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              : <Unlock className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
          </button>
          <button className="p-1.5 rounded transition-colors hover:bg-[var(--bg-card)]" title="导出日志">
            <Download className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
          <button onClick={clearLogs} className="p-1.5 rounded transition-colors hover:bg-[var(--bg-card)]" title="清空日志">
            <Trash2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
      </div>

      {/* 日志内容 */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-placeholder)' }}>
            暂无日志，运行 Python 脚本后查看输出
          </div>
        ) : (
          entries.map((log) => (
            <div key={log.id} className="flex gap-3">
              <span className="flex-shrink-0" style={{ color: 'var(--text-placeholder)' }}>{log.timestamp}</span>
              <span style={{ color: LOG_COLORS[log.type] }}>{log.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
