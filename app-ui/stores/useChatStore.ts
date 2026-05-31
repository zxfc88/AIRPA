/**
 * AI 对话状态管理
 *
 * 管理对话消息列表、流式生成状态、当前工作流阶段。
 * 支持流式追加内容、代码块提取、工具调用记录。
 */
import { create } from 'zustand';
import type { ChatMessage, CodeBlock } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStage: string | null;
  /** 添加一条完整消息 */
  addMessage: (msg: ChatMessage) => void;
  /** 向末条消息流式追加文本 */
  appendContent: (msgId: string, chunk: string) => void;
  /** 向指定消息追加代码块 */
  addCodeBlock: (msgId: string, codeBlock: CodeBlock) => void;
  /** 设置当前工作流阶段（用于 loading 提示） */
  setStage: (stage: string | null) => void;
  /** 设置流式生成状态 */
  setStreaming: (v: boolean) => void;
  /** 清空所有对话消息 */
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '你好！我是AI RPA智能体，可以帮你生成自动化流程代码。请描述你需要实现的自动化任务，例如"自动登录公司OA系统导出报表"或"批量采集电商平台商品数据"。',
      timestamp: Date.now(),
    },
  ],
  isStreaming: false,
  currentStage: null,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendContent: (msgId, chunk) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId ? { ...m, content: m.content + chunk } : m
      ),
    })),

  addCodeBlock: (msgId, cb) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId
          ? { ...m, codeBlocks: [...(m.codeBlocks || []), cb] }
          : m
      ),
    })),

  setStage: (stage) => set({ currentStage: stage }),
  setStreaming: (v) => set({ isStreaming: v }),

  clearMessages: () =>
    set({ messages: [], isStreaming: false, currentStage: null }),
}));
