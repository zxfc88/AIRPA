/**
 * 文件系统操作 Hook
 *
 * 封装 Tauri Rust 后端的文件操作命令：
 * - list_projects: 扫描工作目录中的所有 RPA 工程
 * - read_file / write_file: 读写文件内容
 * - create_project_dir: 创建标准化工程目录（Main.py + requirements.txt）
 * - get_file_tree: 递归获取目录树结构
 * - detect_python: 检测本地 Python 环境
 *
 * 浏览器模式下返回空/默认值，不报错。
 */
import { useCallback, useState } from 'react';
import type { ProjectEntry, FileNode } from '@/types';
import { toast } from 'sonner';

let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

/** 初始化 Tauri invoke 绑定（仅桌面环境可用） */
async function initTauri() {
  if (tauriInvoke) return true;
  try {
    const mod = await import('@tauri-apps/api/core');
    if (typeof mod.invoke !== 'function') return false;
    tauriInvoke = mod.invoke;
    return true;
  } catch { return false; }
}

export function useTauriFS() {
  const [isLoading, setIsLoading] = useState(false);

  /** 列出工作目录下所有工程 */
  const listProjects = useCallback(async (workspaceDir: string): Promise<ProjectEntry[]> => {
    setIsLoading(true);
    try { const ok = await initTauri(); return ok && tauriInvoke ? (await tauriInvoke('list_projects', { workspaceDir })) as ProjectEntry[] : []; }
    catch (e) { toast.error(`读取工程列表失败: ${e}`); return []; }
    finally { setIsLoading(false); }
  }, []);

  /** 读取文件内容 */
  const readFile = useCallback(async (path: string): Promise<string> => {
    try { const ok = await initTauri(); return ok && tauriInvoke ? (await tauriInvoke('read_file', { path })) as string : ''; }
    catch (e) { toast.error(`读取文件失败: ${e}`); return ''; }
  }, []);

  /** 写入文件内容 */
  const writeFile = useCallback(async (path: string, content: string): Promise<boolean> => {
    try { const ok = await initTauri(); if (ok && tauriInvoke) { await tauriInvoke('write_file', { path, content }); return true; } return false; }
    catch (e) { toast.error(`保存文件失败: ${e}`); return false; }
  }, []);

  /** 创建标准化工程目录（浏览器模式生成虚拟工程） */
  const createProject = useCallback(async (baseDir: string, projectName: string): Promise<string | null> => {
    try {
      const ok = await initTauri();
      if (ok && tauriInvoke) {
        return (await tauriInvoke('create_project_dir', { baseDir, projectName })) as string;
      }
      // 浏览器 fallback: 直接返回路径，由调用方添加到 store
      return `${baseDir}/${projectName}`;
    } catch (e) { toast.error(`创建工程失败: ${e}`); return null; }
  }, []);

  /** 递归获取目录树 */
  const getFileTree = useCallback(async (dirPath: string): Promise<FileNode[]> => {
    try { const ok = await initTauri(); return ok && tauriInvoke ? (await tauriInvoke('get_file_tree', { dirPath, depth: 3 })) as FileNode[] : []; }
    catch { return []; }
  }, []);

  /** 检测本地 Python 环境 */
  const detectPython = useCallback(async () => {
    try { const ok = await initTauri(); return ok && tauriInvoke ? await tauriInvoke('detect_python') : null; }
    catch { return null; }
  }, []);

  return { listProjects, readFile, writeFile, createProject, getFileTree, detectPython, isLoading };
}
