/**
 * 首次启动引导向导
 *
 * 5 步骤引导新用户完成初始化配置：
 * 1. 欢迎页 — 产品核心工作流介绍
 * 2. Python 环境检测 — 自动检测本地 Python 版本和 Playwright
 * 3. 大模型配置 — API 端点、Key、模型选择
 * 4. 工作目录 — 选择存放 RPA 工程的本地文件夹
 * 5. 准备就绪 — 汇总检测结果，点击进入主界面
 *
 * 仅在首次访问时显示（localStorage 'airpa-wizard-done' 标记）。
 */
import { useState, useEffect } from 'react';
import { Check, AlertCircle, ArrowRight, ArrowLeft, Zap, FolderOpen, Key, Monitor, Terminal } from 'lucide-react';
import { useLLMStore } from '@/stores/useLLMStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from 'sonner';

/** 向导步骤定义 */
const STEPS = [
  { id: 'welcome', title: '欢迎使用 AI RPA 智能体', icon: Zap, description: '通过自然语言对话，AI 自动生成 Python 自动化代码' },
  { id: 'python', title: 'Python 环境检测', icon: Terminal, description: '检测本地 Python 环境，确保自动化脚本可正常运行' },
  { id: 'llm', title: '大模型配置', icon: Key, description: '配置 AI 大模型 API，驱动智能体代码生成' },
  { id: 'workspace', title: '工作目录设置', icon: FolderOpen, description: '选择本地文件夹，存放自动化工程代码' },
  { id: 'done', title: '准备就绪', icon: Monitor, description: '一切就绪，开始你的自动化之旅' },
];

export function WelcomeWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [pythonStatus, setPythonStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [pythonInfo, setPythonInfo] = useState({ version: '', path: '', hasPlaywright: false });
  const llmConfig = useLLMStore((s) => s.config);
  const updateLLM = useLLMStore((s) => s.updateConfig);
  const workspaceDir = useProjectStore((s) => s.workspaceDir);
  const setWorkspaceDir = useProjectStore((s) => s.setWorkspaceDir);
  const [tempApiKey, setTempApiKey] = useState(llmConfig.apiKey);
  const [tempEndpoint, setTempEndpoint] = useState(llmConfig.apiEndpoint);
  const [tempModel, setTempModel] = useState(llmConfig.model);
  const [showKey, setShowKey] = useState(false);

  /** 进入 Python 检测步骤时自动执行 */
  useEffect(() => { if (step === 1) detectPython(); }, [step]);

  /** 检测本地 Python 环境（Tauri 模式调用 Rust 命令，浏览器模式暂不可用） */
  const detectPython = async () => {
    setPythonStatus('checking');
    try {
      const mod = await import('@tauri-apps/api/core').catch(() => null);
      if (mod) {
        const info = await mod.invoke('detect_python') as Record<string, unknown>;
        setPythonInfo({ version: (info.version as string) || '', path: (info.python_path as string) || '', hasPlaywright: (info.has_playwright as boolean) || false });
        setPythonStatus((info.python_path as string) ? 'ok' : 'error'); return;
      }
    } catch { /* 浏览器降级 */ }
    setPythonInfo({ version: '请安装 Python 3.8+', path: '未检测到', hasPlaywright: false });
    setPythonStatus('error');
  };

  /** 完成向导，保存配置 */
  const handleComplete = () => {
    updateLLM({ apiKey: tempApiKey, apiEndpoint: tempEndpoint, model: tempModel });
    onComplete();
    toast.success('初始化完成！开始使用 AI RPA 智能体');
  };

  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-[520px] rounded-xl border shadow-2xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {/* 步骤进度条 */}
        <div className="px-6 pt-6">
          <div className="flex gap-1 mb-6">{STEPS.map((_, i) => <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i <= step ? 'var(--color-brand)' : 'var(--border-color)' }} />)}</div>
        </div>
        <div className="px-6 pb-2">
          <CurrentIcon className="w-10 h-10 mb-3" style={{ color: 'var(--color-brand)' }} />
          <h2 className="text-xl font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{STEPS[step].title}</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{STEPS[step].description}</p>
        </div>

        <div className="px-6 pb-6" style={{ minHeight: 200 }}>
          {step === 0 && (
            <div className="space-y-3">
              {['💬 在右侧对话区用自然语言描述你的自动化需求', '🤖 AI 智能体自动生成 Python RPA 代码', '✏️ 在代码编辑器中预览和微调生成的代码', '▶️ 一键运行，底部控制台实时查看执行日志']
                .map((item, i) => <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}><span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item}</span></div>)}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border" style={{ background: pythonStatus === 'ok' ? 'rgba(0,180,42,0.1)' : 'var(--bg-input)', borderColor: pythonStatus === 'ok' ? 'var(--color-success)' : 'var(--border-color)' }}>
                {pythonStatus === 'checking' ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" /> :
                  pythonStatus === 'ok' ? <Check className="w-5 h-5" style={{ color: 'var(--color-success)' }} /> :
                    <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />}
                <div className="text-sm"><p style={{ color: 'var(--text-primary)' }}>Python {pythonInfo.version}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>路径: {pythonInfo.path}</p>
                  {pythonStatus === 'error' && <p className="mt-1" style={{ color: 'var(--color-warning)' }}>请先安装 Python 3.8+：<a href="https://python.org" target="_blank" style={{ color: 'var(--color-brand)' }}>python.org</a></p>}
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>API 端点</label>
                <input type="text" value={tempEndpoint} onChange={(e) => setTempEndpoint(e.target.value)} className="w-full h-9 px-3 rounded border text-sm focus:outline-none focus:ring-1"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} /></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>API Key</label>
                <div className="flex gap-2"><div className="flex-1 relative">
                  <input type={showKey ? 'text' : 'password'} value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} placeholder="sk-..." className="w-full h-9 pl-3 pr-10 rounded border text-sm focus:outline-none focus:ring-1 font-mono"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-secondary)' }}>{showKey ? '隐藏' : '显示'}</button></div></div></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>模型</label>
                <select value={tempModel} onChange={(e) => setTempModel(e.target.value)} className="w-full h-9 px-3 rounded border text-sm focus:outline-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                  <option value="gpt-4o">GPT-4o (OpenAI)</option><option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="claude-3-sonnet">Claude 3.5 Sonnet</option><option value="deepseek-v3">DeepSeek V3</option><option value="qwen-max">Qwen Max</option></select></div>
              <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>后续可在「环境设置」中修改。不填 Key 可先跳过，体验界面功能。</p>
            </div>
          )}
          {step === 3 && (
            <div><div className="flex items-center justify-between p-4 rounded-lg border mb-3" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3"><FolderOpen className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} /><div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{workspaceDir || '未选择'}</p>
                <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>所有 RPA 工程将保存在此目录</p></div></div>
              <button onClick={() => { const dir = prompt('请输入工作目录路径:'); if (dir) setWorkspaceDir(dir); }}
                className="px-3 py-1.5 rounded text-sm transition-colors" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>选择目录</button></div>
              <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>桌面版支持原生文件夹选择器。</p></div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2" style={{ color: pythonStatus === 'ok' ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                {pythonStatus === 'ok' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm">{pythonStatus === 'ok' ? 'Python 环境已就绪' : 'Python 环境：待安装（可稍后处理）'}</span></div>
              <div className="flex items-center gap-2" style={{ color: tempApiKey ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                {tempApiKey ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm">{tempApiKey ? '大模型已配置' : '大模型：待配置（可在设置中填写 API Key）'}</span></div>
              <div className="flex items-center gap-2" style={{ color: workspaceDir ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                {workspaceDir ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm">{workspaceDir ? `工作目录: ${workspaceDir}` : '工作目录：待设置'}</span></div>
            </div>
          )}
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between px-6 py-4 rounded-b-xl border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-sidebar)' }}>
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="px-4 py-2 rounded text-sm flex items-center gap-1 disabled:opacity-30 transition-colors" style={{ color: 'var(--text-secondary)' }}><ArrowLeft className="w-4 h-4" /> 上一步</button>
          <span className="text-xs" style={{ color: 'var(--text-placeholder)' }}>{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded text-sm flex items-center gap-1 text-white transition-colors" style={{ background: 'var(--color-brand)' }}>下一步 <ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={handleComplete} className="px-4 py-2 rounded text-sm flex items-center gap-1 text-white transition-colors" style={{ background: 'var(--color-success)' }}>开始使用 <Check className="w-4 h-4" /></button>
          )}
        </div>
      </div>
    </div>
  );
}
