/**
 * 工程与文件状态管理
 *
 * 核心概念：
 * - currentProject: 当前侧边栏展示的唯一活跃工程（同时只能有一个）
 * - projects: 本地所有工程列表（供"我的工程"页面展示）
 * - openFiles: Monaco 编辑器打开的文件标签页
 * - switchProject(): 切换工程，自动处理旧工程关闭和新工程加载
 */
import { create } from 'zustand';
import type { ProjectEntry, FileTab } from '@/types';

interface ProjectState {
  workspaceDir: string | null;
  /** 本地所有工程列表 */
  projects: ProjectEntry[];
  /** 当前活跃工程名（侧边栏展示的唯一工程） */
  currentProject: string | null;
  /** Monaco 打开的文件标签页 */
  openFiles: FileTab[];
  activeFileId: string | null;

  setWorkspaceDir: (dir: string) => void;
  setProjects: (projects: ProjectEntry[]) => void;

  /** 打开文件，若已打开则激活标签 */
  openFile: (file: FileTab) => void;
  /** 关闭单个文件标签 */
  closeFile: (fileId: string) => void;
  /** 关闭当前工程所有打开的文件，返回未保存文件列表 */
  closeCurrentProject: () => FileTab[];
  /** 切换到指定工程（关闭当前 + 加载新工程文件），返回是否需要提示保存 */
  switchProject: (projectName: string) => FileTab[];
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  markFileSaved: (fileId: string) => void;
  /** 是否有未保存文件 */
  hasUnsavedFiles: () => boolean;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  workspaceDir: null,
  projects: [],
  currentProject: null,
  openFiles: [],
  activeFileId: null,

  setWorkspaceDir: (dir) => set({ workspaceDir: dir }),
  setProjects: (projects) => set({ projects }),

  openFile: (file) =>
    set((s) => {
      const exists = s.openFiles.find((f) => f.id === file.id);
      if (exists) return { activeFileId: file.id };
      return { openFiles: [...s.openFiles, file], activeFileId: file.id };
    }),

  closeFile: (fileId) =>
    set((s) => {
      const idx = s.openFiles.findIndex((f) => f.id === fileId);
      const newFiles = s.openFiles.filter((f) => f.id !== fileId);
      let newActive = s.activeFileId;
      if (s.activeFileId === fileId) {
        newActive = newFiles.length > 0 ? newFiles[Math.min(idx, newFiles.length - 1)].id : null;
      }
      return { openFiles: newFiles, activeFileId: newActive };
    }),

  /** 关闭当前工程所有文件，返回未保存的文件列表供调用方提示 */
  closeCurrentProject: () => {
    const unsaved = get().openFiles.filter((f) => f.isModified);
    set({ openFiles: [], activeFileId: null, currentProject: null });
    return unsaved;
  },

  /** 切换工程：返回旧工程未保存文件列表，调用方决定是否提示保存 */
  switchProject: (projectName: string) => {
    const state = get();
    // 无变化则跳过
    if (state.currentProject === projectName) return [];
    const unsaved = state.openFiles.filter((f) => f.isModified);

    const project = state.projects.find((p) => p.name === projectName);
    if (!project) {
      set({ openFiles: [], activeFileId: null, currentProject: null });
      return unsaved;
    }

    // 为新工程创建默认文件标签
    const baseDir = state.workspaceDir || './RPA-Projects';
    const projPath = `${baseDir}/${projectName}`;
    const newFiles: FileTab[] = [];
    for (const f of project.files) {
      const isPy = f.endsWith('.py');
      newFiles.push({
        id: `${projectName}/${f}`,
        name: f,
        path: `${projPath}/${f}`,
        language: isPy ? 'python' : 'plaintext',
        content: isPy
          ? `"""RPA Automation — ${projectName}"""\n\ndef main():\n    print("开始执行...")\n    \n\nif __name__ == "__main__":\n    main()\n`
          : '# 依赖列表\nplaywright>=1.40.0\n',
        isModified: false,
      });
    }
    set({ openFiles: newFiles, activeFileId: newFiles[0]?.id || null, currentProject: projectName });
    return unsaved;
  },

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  updateFileContent: (fileId, content) =>
    set((s) => ({
      openFiles: s.openFiles.map((f) => (f.id === fileId ? { ...f, content, isModified: true } : f)),
    })),

  markFileSaved: (fileId) =>
    set((s) => ({
      openFiles: s.openFiles.map((f) => (f.id === fileId ? { ...f, isModified: false } : f)),
    })),

  hasUnsavedFiles: () => get().openFiles.some((f) => f.isModified),
}));
