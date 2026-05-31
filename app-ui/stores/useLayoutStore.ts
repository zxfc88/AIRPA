/**
 * 布局状态管理
 *
 * 管理四区域面板尺寸和侧边栏折叠状态，持久化用户偏好。
 * 侧边栏: 240px(展开) / 64px(收起)
 * 对话区: 默认 380px 可拖拽
 * 日志控制台: 默认 200px 可拖拽
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  sidebarCollapsed: boolean;
  chatPanelWidth: number;
  logConsoleHeight: number;
  /** 切换侧边栏展开/收起 */
  toggleSidebar: () => void;
  /** 设置对话面板宽度 */
  setChatPanelWidth: (w: number) => void;
  /** 设置日志控制台高度 */
  setLogConsoleHeight: (h: number) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      chatPanelWidth: 380,
      logConsoleHeight: 200,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setChatPanelWidth: (w) => set({ chatPanelWidth: w }),
      setLogConsoleHeight: (h) => set({ logConsoleHeight: h }),
    }),
    { name: 'airpa-layout' }
  )
);
