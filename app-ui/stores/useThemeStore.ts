/**
 * 主题状态管理
 *
 * 持久化深色/浅色主题选择，通过 data-theme 属性驱动 CSS 变量切换。
 * 默认深色主题，跨会话记忆。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';

interface ThemeState {
  theme: Theme;
  /** 切换深色/浅色主题 */
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'airpa-theme' }
  )
);
