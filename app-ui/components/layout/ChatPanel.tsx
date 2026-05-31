/**
 * AI 对话面板 — 右侧固定区域
 *
 * 功能：
 * - 对话消息流式展示（用户/AI 气泡区分）
 * - AI 回复中嵌入代码块（语法高亮 + 复制 + 应用到工程）
 * - 多行输入框（Enter 发送，Shift+Enter 换行）
 * - 清空对话/历史记录
 * - 流式生成时的阶段提示
 * - 关联工程选择器，确定 AI 生成代码归属
 */
import { useState } from 'react';
import { Send, Trash2, History, Copy, Check, FolderGit2 } from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAgentChat } from '@/hooks/useAgentChat';
import { toast } from 'sonner';
import type { CodeBlock } from '@/types';

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const currentStage = useChatStore((s) => s.currentStage);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const openFile = useProjectStore((s) => s.openFile);
  const currentProject = useProjectStore((s) => s.currentProject);
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  const workspaceDir = useProjectStore((s) => s.workspaceDir);
  const { sendMessage } = useAgentChat();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  /** 发送消息到 AI 智能体 */
  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  /** 将代码块应用到当前项目 */
  const handleApplyToProject = (cb: CodeBlock) => {
    if (!cb.filename) return;
    if (!currentProject) {
      toast.error('请先在左侧「当前项目」中新建或选择一个工程');
      return;
    }
    const baseDir = workspaceDir || './RPA-Projects';
    const projectPath = `${baseDir}/${currentProject}`;

    // 工程不存在列表则自动添加
    if (!projects.find((p) => p.name === currentProject)) {
      setProjects([...projects, { name: currentProject, path: projectPath, type: 'ai', files: [cb.filename] }]);
    }

    openFile({
      id: `${currentProject}/${cb.filename}`,
      name: cb.filename,
      path: `${projectPath}/${cb.filename}`,
      language: cb.language === 'python' ? 'python' : 'plaintext',
      content: cb.code,
      isModified: false,
    });
    toast.success(`已应用到当前项目 "${currentProject}"`);
  };

  /** 复制代码到剪贴板 */
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('代码已复制');
  };

  // 折叠状态 — 仅显示展开按钮
  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center pt-4 border-l"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', width: 40 }}>
        <button onClick={() => setCollapsed(false)} className="p-1.5 rounded hover:bg-[var(--bg-card)]"
          style={{ color: 'var(--text-secondary)' }} title="展开对话">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
      {/* 标题栏 */}
      <div className="flex flex-col border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="h-12 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setCollapsed(true)} className="p-1 rounded hover:bg-[var(--bg-card)]"
              style={{ color: 'var(--text-secondary)' }} title="收起对话">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>AI RPA智能体</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 rounded hover:bg-[var(--bg-card)]" title="历史记录">
              <History className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
            <button onClick={clearMessages} className="p-1.5 rounded hover:bg-[var(--bg-card)]" title="清空对话">
              <Trash2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></button>
          </div>
        </div>
        {/* 当前项目指示 */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5" style={{ color: currentProject ? 'var(--color-brand)' : 'var(--text-placeholder)' }} />
          <span className="text-xs" style={{ color: currentProject ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>
            {currentProject ? `当前项目: ${currentProject}` : '未打开项目 — 请从左侧新建或从「我的工程」打开'}
          </span>
        </div>
      </div>

      {/* 对话消息区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : ''}>
            <div className="max-w-[92%] rounded-lg p-3"
              style={{ background: msg.role === 'user' ? 'var(--color-brand)' : 'var(--bg-card)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)' }}>
              {msg.stage && <div className="text-xs mb-2 font-medium" style={{ color: 'var(--color-brand)' }}>{msg.stage}</div>}
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.codeBlocks?.map((cb, i) => (
                <div key={i} className="mt-3 rounded-lg overflow-hidden" style={{ background: '#0D0E0F' }}>
                  <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cb.filename || `code.${cb.language}`}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopy(cb.code, `${msg.id}-${i}`)}
                        className="flex items-center gap-1 text-xs hover:text-[var(--text-primary)] transition-colors"
                        style={{ color: 'var(--text-secondary)' }}>
                        {copiedId === `${msg.id}-${i}` ? <><Check className="w-3 h-3" />已复制</> : <><Copy className="w-3 h-3" />复制</>}
                      </button>
                      <button onClick={() => handleApplyToProject(cb)}
                        className="text-xs font-medium transition-colors" style={{ color: 'var(--color-brand)' }}>应用到工程</button>
                    </div>
                  </div>
                  <pre className="p-3 text-xs font-mono overflow-x-auto" style={{ color: 'var(--text-primary)' }}>
                    <code>{cb.code}</code></pre>
                </div>
              ))}
            </div>
          </div>
        ))}
        {isStreaming && currentStage && (
          <div className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>{currentStage}...</div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t p-4" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="描述你需要的自动化任务..."
            className="flex-1 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties}
            rows={3} />
          <button onClick={handleSend} disabled={!input.trim() || isStreaming}
            className="px-4 text-white rounded transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-brand)' }}><Send className="w-4 h-4" /></button>
        </div>
        <div className="mt-2 text-xs" style={{ color: 'var(--text-placeholder)' }}>Shift + Enter 换行，Enter 发送</div>
      </div>
    </div>
  );
}
