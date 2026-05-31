/**
 * 环境设置页面
 *
 * 配置区域：
 * 1. 外观设置 — 深色/浅色主题切换
 * 2. 大模型配置 — API 端点、Key（密码输入）、模型选择、Temperature 滑块、Max Tokens、测试连接
 * 3. Python 环境 — 显示 Python 版本/路径/状态
 * 4. Playwright 环境 — 显示版本/浏览器内核/重新安装按钮
 * 5. 常用依赖包 — pandas/openpyxl/requests/beautifulsoup4 安装状态
 * 6. 工作目录 — 显示当前路径/选择目录按钮
 */
import { useState } from 'react';
import { Check, AlertCircle, RefreshCw, Sun, Moon, FolderOpen, Eye, EyeOff, Zap, FlaskConical } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLLMStore } from '@/stores/useLLMStore';
import { toast } from 'sonner';

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const llmConfig = useLLMStore((s) => s.config);
  const updateLLM = useLLMStore((s) => s.updateConfig);
  const resetLLM = useLLMStore((s) => s.resetConfig);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  /** 测试 API 连接，成功后拉取可用模型列表 */
  const handleTestConnection = async () => {
    if (!llmConfig.apiKey) { toast.error('请先填写 API Key'); return; }
    setTesting(true);
    try {
      const res = await fetch(`${llmConfig.apiEndpoint}/models`, { headers: { 'Authorization': `Bearer ${llmConfig.apiKey}`, 'Content-Type': 'application/json' } });
      if (res.ok) toast.success('连接成功！API 服务正常');
      else { const body = await res.text(); toast.error(`连接失败: ${res.status} — ${body.slice(0, 100)}`); }
    } catch { toast.error('网络错误: 无法连接到 API 端点'); }
    finally { setTesting(false); }
  };

  return (
    <div className="h-full overflow-y-auto p-8" style={{ background: 'var(--bg-app)' }}>
      <h1 className="text-2xl font-medium mb-6" style={{ color: 'var(--text-primary)' }}>环境设置</h1>

      {/* 1. 外观设置 */}
      <div className="rounded-lg p-6 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>外观设置</h2>
        <div className="flex items-center justify-between">
          <div><p className="font-medium" style={{ color: 'var(--text-primary)' }}>主题切换</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>当前: {theme === 'dark' ? '深色主题' : '浅色主题'}</p></div>
          <button onClick={toggleTheme} className="px-4 py-2 rounded flex items-center gap-2 transition-colors"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}{theme === 'dark' ? '切换到浅色' : '切换到深色'}</button>
        </div>
      </div>

      {/* 2. 大模型配置 */}
      <div className="rounded-lg p-6 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Zap className="w-5 h-5" style={{ color: 'var(--color-brand)' }} /><h2 className="font-medium" style={{ color: 'var(--text-primary)' }}>大模型配置</h2></div>
          <button onClick={resetLLM} className="text-xs px-3 py-1 rounded transition-colors hover:bg-[var(--bg-input)]" style={{ color: 'var(--text-secondary)' }}>恢复默认</button></div>
        <div className="space-y-4 text-sm">
          <div><label className="block mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>API 端点地址</label>
            <input type="text" value={llmConfig.apiEndpoint} onChange={(e) => updateLLM({ apiEndpoint: e.target.value })} placeholder="https://api.openai.com/v1"
              className="w-full h-9 px-3 rounded border font-mono text-sm focus:outline-none focus:ring-1"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} /></div>
          <div><label className="block mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>API Key</label>
            <div className="flex gap-2"><div className="flex-1 relative">
              <input type={showKey ? 'text' : 'password'} value={llmConfig.apiKey} onChange={(e) => updateLLM({ apiKey: e.target.value })} placeholder="sk-..."
                className="w-full h-9 pl-3 pr-10 rounded border font-mono text-sm focus:outline-none focus:ring-1"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-card)]" style={{ color: 'var(--text-secondary)' }}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
              <button onClick={handleTestConnection} disabled={testing} className="px-4 h-9 text-white rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                style={{ background: 'var(--color-brand)' }}><FlaskConical className="w-4 h-4" />{testing ? '测试中...' : '测试连接'}</button></div></div>
          <div><label className="block mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>模型名称</label>
            <input type="text" value={llmConfig.model} onChange={(e) => updateLLM({ model: e.target.value })} placeholder="例如: gpt-4o / deepseek-v3 / claude-3-sonnet"
              className="w-full h-9 px-3 rounded border font-mono text-sm focus:outline-none focus:ring-1"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>温度 (Temperature): {llmConfig.temperature}</label>
              <input type="range" min="0" max="2" step="0.1" value={llmConfig.temperature} onChange={(e) => updateLLM({ temperature: parseFloat(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--color-brand)' }} />
              <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-placeholder)' }}><span>0 (精确)</span><span>1 (平衡)</span><span>2 (创造)</span></div></div>
            <div><label className="block mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>最大 Token 数: {llmConfig.maxTokens}</label>
              <input type="number" min={256} max={131072} step={256} value={llmConfig.maxTokens} onChange={(e) => updateLLM({ maxTokens: parseInt(e.target.value) || 4096 })}
                className="w-full h-9 px-3 rounded border font-mono text-sm focus:outline-none focus:ring-1"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} /></div>
          </div>
        </div>
      </div>

      {/* 3. Python 环境 */}
      <div className="rounded-lg p-6 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4"><h2 className="font-medium" style={{ color: 'var(--text-primary)' }}>Python 环境</h2>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-success)' }}><Check className="w-4 h-4" /> 已安装</div></div>
        <div className="space-y-3 text-sm">{['Python 版本', '安装路径'].map((k, i) =>
          <div key={k} className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>{k}</span>
            <span style={{ color: 'var(--text-primary)' }}>{i === 0 ? '3.11.5' : '/usr/local/bin/python3'}</span></div>)}</div>
      </div>

      {/* 4. Playwright 环境 */}
      <div className="rounded-lg p-6 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4"><h2 className="font-medium" style={{ color: 'var(--text-primary)' }}>Playwright 环境</h2>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-success)' }}><Check className="w-4 h-4" /> 已安装</div></div>
        <div className="space-y-3 text-sm">{['版本', '浏览器内核'].map((k, i) =>
          <div key={k} className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>{k}</span>
            <span style={{ color: 'var(--text-primary)' }}>{i === 0 ? '1.40.0' : 'Chromium, Firefox, WebKit'}</span></div>)}</div>
        <button className="mt-4 px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          onClick={() => toast.info('请在终端执行: playwright install chromium')}><RefreshCw className="w-4 h-4" /> 重新安装浏览器</button>
      </div>

      {/* 5. 依赖包 */}
      <div className="rounded-lg p-6 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>常用依赖包</h2>
        {[{ name: 'pandas', version: '2.1.3', s: 'installed' }, { name: 'openpyxl', version: '3.1.2', s: 'installed' }, { name: 'requests', version: '2.31.0', s: 'installed' }, { name: 'beautifulsoup4', version: '未安装', s: 'missing' }]
          .map((pkg) => (
            <div key={pkg.name} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">{pkg.s === 'installed' ? <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> : <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />}
                <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{pkg.name}</span></div>
              <div className="flex items-center gap-3"><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{pkg.version}</span>
                {pkg.s === 'missing' && <button className="px-3 py-1 text-white rounded text-xs" style={{ background: 'var(--color-brand)' }} onClick={() => toast.info('请在终端执行: pip install beautifulsoup4')}>安装</button>}</div>
            </div>
          ))}
      </div>

      {/* 6. 工作目录 */}
      <div className="rounded-lg p-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>工作目录</h2>
        <div className="flex gap-2"><input type="text" defaultValue="/Users/username/RPA-Projects" readOnly className="flex-1 h-9 px-3 rounded border font-mono text-sm focus:outline-none"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
          <button className="px-4 h-9 rounded text-sm transition-colors" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            onClick={() => toast.info('桌面版支持原生文件夹选择器')}><FolderOpen className="w-4 h-4 inline mr-1" />选择目录</button></div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-placeholder)' }}>所有RPA工程将保存在此目录下</p>
      </div>
    </div>
  );
}
