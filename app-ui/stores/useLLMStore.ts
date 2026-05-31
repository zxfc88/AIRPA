/**
 * 大模型配置状态管理
 *
 * 持久化 LLM API 连接参数（端点、Key、模型、温度、最大 Token）。
 * 配置被 useAgentChat hook 读取用于浏览器直连 AI API。
 * 通过 persist 中间件自动存入 localStorage。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMConfig } from '@/types';

const DEFAULT_CONFIG: LLMConfig = {
  apiEndpoint: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
};

interface LLMState {
  config: LLMConfig;
  /** 部分更新配置 */
  updateConfig: (patch: Partial<LLMConfig>) => void;
  /** 恢复默认配置 */
  resetConfig: () => void;
}

export const useLLMStore = create<LLMState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      updateConfig: (patch) =>
        set((s) => ({ config: { ...s.config, ...patch } })),
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    { name: 'airpa-llm' }
  )
);
