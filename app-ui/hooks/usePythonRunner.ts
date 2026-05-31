/**
 * Python 脚本执行 Hook
 *
 * 封装 Tauri Rust 后端的 Python 子进程调用：
 * - run_python_script: 启动 Python 脚本，监听 'python-log' 事件流式输出日志
 * - stop_python_script: 终止运行中的进程
 *
 * 浏览器模式下（非 Tauri 环境）降级为模拟输出。
 */
import { useCallback } from 'react';
import { useLogStore } from '@/stores/useLogStore';
import { toast } from 'sonner';

// 动态导入 Tauri API，浏览器环境静默失败
let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let tauriListen: ((event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>) | null = null;

/** 初始化 Tauri API 绑定（仅桌面环境可用） */
async function initTauri() {
  if (tauriInvoke) return true;
  try {
    const mod = await import('@tauri-apps/api/core');
    if (typeof mod.invoke !== 'function') return false;
    tauriInvoke = mod.invoke;
    const eventMod = await import('@tauri-apps/api/event');
    if (typeof eventMod.listen !== 'function') return false;
    tauriListen = eventMod.listen;
    return true;
  } catch { return false; }
}

export function usePythonRunner() {
  const addEntry = useLogStore((s) => s.addEntry);
  const setRunning = useLogStore((s) => s.setRunning);
  const isRunning = useLogStore((s) => s.isRunning);

  /** 执行 Python 脚本，流式接收日志 */
  const runScript = useCallback(
    async (projectDir: string, scriptPath: string) => {
      if (isRunning) { toast.error('已有脚本正在运行中'); return; }

      const isTauri = await initTauri();
      setRunning(true, scriptPath);
      addEntry({
        id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(),
        type: 'info', source: 'system', message: `[运行] 开始执行 ${scriptPath}...`,
      });

      if (isTauri && tauriInvoke && tauriListen) {
        try {
          const unlisten = await tauriListen('python-log', (event) => {
            const p = event.payload as { stream: string; content: string; timestamp: number };
            addEntry({
              id: crypto.randomUUID(), timestamp: new Date(p.timestamp).toLocaleTimeString(),
              type: p.stream === 'stderr' ? 'error' : 'info',
              source: p.stream === 'stderr' ? 'stderr' : 'stdout', message: p.content,
            });
          });
          const unlistenDone = await tauriListen('python-done', (event) => {
            const p = event.payload as { exit_code: number; success: boolean };
            setRunning(false);
            addEntry({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(),
              type: p.success ? 'success' : 'error', source: 'system',
              message: `[完成] 进程退出，代码: ${p.exit_code}`,
            });
          });
          await tauriInvoke('run_python_script', { projectDir, scriptPath });
          unlisten(); unlistenDone();
        } catch (e) {
          setRunning(false);
          addEntry({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(),
            type: 'error', source: 'system', message: `[错误] ${e}` });
          toast.error(`运行失败: ${e}`);
        }
      } else {
        // 浏览器模拟模式
        addEntry({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(),
          type: 'info', source: 'stdout', message: '[模拟] 浏览器模式 — 请在 Tauri 桌面应用中运行真实 Python 脚本' });
        setTimeout(() => { setRunning(false);
          addEntry({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(),
            type: 'success', source: 'system', message: '[模拟] 运行完成 (浏览器模式)' }); }, 2000);
      }
    }, [isRunning, addEntry, setRunning]);

  /** 强制终止当前运行 */
  const stopScript = useCallback(async () => {
    setRunning(false);
    addEntry({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(),
      type: 'warning', source: 'system', message: '[系统] 已停止运行' });
    const isTauri = await initTauri();
    if (isTauri && tauriInvoke) {
      try { await tauriInvoke('stop_python_script'); } catch { /* ignore */ }
    }
  }, [setRunning, addEntry]);

  return { runScript, stopScript, isRunning };
}
