/**
 * AI 智能体对话 Hook
 *
 * 核心功能：发送用户消息，调用 LLM API 流式生成 RPA 代码。
 *
 * 工作模式：
 * - 浏览器模式：直连 LLM API（/chat/completions），SSE 流式解析
 * - Tauri 模式（待接入）：通过 Sidecar → LangGraph StateGraph 多步骤工作流
 *
 * 使用 useLLMStore 中的配置（端点、Key、模型、温度等）。
 */
import { useCallback } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useLLMStore } from '@/stores/useLLMStore';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types';

/** 构建 RPA 代码生成的系统提示词 */
function buildSystemPrompt(): string {
  return `你是一个专业的 RPA 自动化工程师助手。你的任务是根据用户的自然语言需求，生成标准化、可直接运行的 Python RPA 代码。

## 输出规范
1. 代码必须包含 Main.py 入口文件（def main(): ... if __name__ == '__main__': main()）
2. 浏览器自动化使用 Playwright (from playwright.sync_api import sync_playwright)
3. 每次生成代码时同时输出对应的 requirements.txt 内容
4. 代码中需要包含充分的注释和错误处理

## 代码结构要求
- 每个自动化工程是一个独立目录，Main.py 为唯一入口
- requirements.txt 列出所有 Python 依赖

## 输出格式
代码块使用以下格式标记文件名：
\`\`\`python:Main.py
<自动化主代码>
\`\`\`

\`\`\`txt:requirements.txt
<依赖列表>
\`\`\`

请在生成代码后简要说明代码的功能和使用方法。`;
}

export function useAgentChat() {
  const addMessage = useChatStore((s) => s.addMessage);
  const appendContent = useChatStore((s) => s.appendContent);
  const addCodeBlock = useChatStore((s) => s.addCodeBlock);
  const setStage = useChatStore((s) => s.setStage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const messages = useChatStore((s) => s.messages);
  const llmConfig = useLLMStore((s) => s.config);

  /** 发送消息到 AI，流式接收回复并解析代码块 */
  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userInput, timestamp: Date.now() };
      addMessage(userMsg);

      const assistantId = crypto.randomUUID();
      addMessage({ id: assistantId, role: 'assistant', content: '', timestamp: Date.now() });

      setStreaming(true);
      setStage('正在分析需求...');

      if (!llmConfig.apiKey) {
        appendContent(assistantId, '⚠️ 请先在 **环境设置** → **大模型配置** 中填写 API Key。\n\n配置完成后即可使用 AI 生成 RPA 代码。');
        setStreaming(false); setStage(null); return;
      }

      try {
        setStage('正在生成RPA代码...');
        const systemMsg = { role: 'system', content: buildSystemPrompt() };
        const history = messages.filter((m) => m.role !== 'assistant' || m.content).slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch(`${llmConfig.apiEndpoint}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${llmConfig.apiKey}` },
          body: JSON.stringify({ model: llmConfig.model, messages: [systemMsg, ...history, { role: 'user', content: userInput }],
            temperature: llmConfig.temperature, max_tokens: llmConfig.maxTokens, stream: true }),
        });

        if (!response.ok) { const et = await response.text(); throw new Error(`${response.status}: ${et.slice(0, 200)}`); }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let full = ''; let buf = '';
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim(); if (d === '[DONE]') continue;
            try { const delta = JSON.parse(d).choices?.[0]?.delta?.content; if (delta) { full += delta; appendContent(assistantId, delta); } } catch { /* skip */ }
          }
        }

        setStage('正在分析代码块...');
        // 解析带文件名的代码块
        for (const m of full.matchAll(/```(python|txt):([^\n]+)\n([\s\S]*?)```/g)) {
          addCodeBlock(assistantId, { language: m[1], code: m[3].trim(), filename: m[2] });
        }
        // 解析标准代码块（无文件名）
        const existing = useChatStore.getState().messages.find((m) => m.id === assistantId)?.codeBlocks || [];
        for (const m of full.matchAll(/```(python|txt)\n([\s\S]*?)```/g)) {
          const [lang, code] = [m[1], m[2].trim()];
          if (!existing.some((b) => b.code === code)) {
            addCodeBlock(assistantId, { language: lang, code, filename: lang === 'python' ? 'Main.py' : 'requirements.txt' });
          }
        }
        setStage(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        appendContent(assistantId, `\n\n❌ **错误**: ${msg}\n\n请检查 API 端点和 Key 是否正确。`);
        setStage(null);
        toast.error(`AI 请求失败: ${msg.slice(0, 60)}`);
      } finally { setStreaming(false); }
    },
    [addMessage, appendContent, addCodeBlock, setStage, setStreaming, messages, llmConfig]
  );

  return { sendMessage };
}
