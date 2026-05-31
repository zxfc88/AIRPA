/**
 * 我的工程页面
 *
 * 功能：
 * - 展示本地所有 RPA 工程（卡片列表）
 * - 区分 AI 生成工程和市场下载工程（标签着色）
 * - 操作：打开编辑（自动加载 Main.py 到 Monaco）、打开目录、删除
 * - 新建工程：Tauri 模式调用 Rust 创建目录，浏览器模式直接生成到 store
 */
import { useState } from 'react';
import { FolderGit2, Play, Trash2, Plus, X, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from 'sonner';

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  const workspaceDir = useProjectStore((s) => s.workspaceDir);
  const switchProject = useProjectStore((s) => s.switchProject);
  const closeCurrentProject = useProjectStore((s) => s.closeCurrentProject);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDir, setNewDir] = useState('');
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const [unsavedFiles, setUnsavedFiles] = useState<string[]>([]);

  /** 创建新工程 */
  const handleCreate = () => {
    const name = newName.trim();
    if (!name) { toast.error('请输入工程名称'); return; }
    const baseDir = newDir.trim() || workspaceDir || './RPA-Projects';
    const path = `${baseDir}/${name}`;
    setProjects([...projects, { name, path, type: 'ai', files: ['Main.py', 'requirements.txt'] }]);
    if (newDir.trim() && !workspaceDir) {
      useProjectStore.getState().setWorkspaceDir(newDir.trim());
    }
    setNewName('');
    setNewDir('');
    setShowCreate(false);
    toast.success(`工程 "${name}" 创建成功`);
  };

  /** 切换工程：先检查未保存文件，有则弹窗确认 */
  const handleOpenEditor = (projName: string) => {
    const unsaved = switchProject(projName);
    if (unsaved.length > 0) {
      setPendingSwitch(null); // switchProject already executed, but we need to revert
      // re-close and keep old project open with unsaved dialog
      closeCurrentProject();
      setUnsavedFiles(unsaved.map((f) => f.name));
      setPendingSwitch(projName);
    } else {
      toast.success(`已切换到 "${projName}"`);
    }
  };

  /** 放弃未保存 → 强制切换 */
  const handleDiscardAndSwitch = () => {
    if (pendingSwitch) {
      switchProject(pendingSwitch);
      setPendingSwitch(null);
      setUnsavedFiles([]);
      toast.success(`已切换到 "${pendingSwitch}"（未保存内容已丢弃）`);
    }
  };

  /** 取消切换 */
  const handleCancelSwitch = () => {
    setPendingSwitch(null);
    setUnsavedFiles([]);
  };

  /** 删除工程 */
  const handleDelete = (projName: string) => {
    setProjects(projects.filter((p) => p.name !== projName));
    toast.success(`已删除工程 "${projName}"`);
  };

  return (
    <div className="h-full overflow-y-auto p-8" style={{ background: 'var(--bg-app)' }}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>我的工程</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded text-sm flex items-center gap-2 text-white transition-colors"
          style={{ background: 'var(--color-brand)' }}
        >
          <Plus className="w-4 h-4" /> 新建工程
        </button>
      </div>

      {/* 新建工程弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-lg border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>新建工程</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-[var(--bg-input)]" style={{ color: 'var(--text-secondary)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>工程名称</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="如: web-scraper / data-export" autoFocus
              className="w-full h-9 px-3 rounded border text-sm focus:outline-none focus:ring-1 mb-3"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} />
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>保存目录</label>
            <input type="text" value={newDir} onChange={(e) => setNewDir(e.target.value)}
              placeholder={workspaceDir || '如: D:/RPA-Projects'}
              className="w-full h-9 px-3 rounded border text-sm focus:outline-none focus:ring-1 mb-4 font-mono"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties} />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded text-sm border"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
              >取消</button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded text-sm text-white"
                style={{ background: 'var(--color-brand)' }}
              >创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 内容区 */}
      {projects.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FolderGit2 className="w-16 h-16 mb-4" style={{ color: 'var(--text-placeholder)' }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>暂无本地工程</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>通过 AI 对话创作或手动新建自动化工程</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded text-sm flex items-center gap-2 text-white"
            style={{ background: 'var(--color-brand)' }}
          >
            <Plus className="w-4 h-4" /> 新建工程
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div key={proj.name} className="rounded-lg p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FolderGit2 className="w-8 h-8" style={{ color: 'var(--color-brand)' }} />
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{proj.name}</h3>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded" style={{
                      background: proj.type === 'ai' ? 'rgba(22,119,255,0.15)' : 'rgba(0,180,42,0.15)',
                      color: proj.type === 'ai' ? 'var(--color-brand)' : 'var(--color-success)' }}>
                      {proj.type === 'ai' ? 'AI生成' : '市场下载'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenEditor(proj.name)} className="px-3 py-1.5 rounded text-sm flex items-center gap-1"
                  style={{ background: 'var(--color-brand)', color: 'white' }}><Play className="w-3.5 h-3.5" /> 打开编辑</button>
                <button onClick={() => handleDelete(proj.name)} className="px-3 py-1.5 rounded text-sm flex items-center gap-1"
                  style={{ color: 'var(--color-error)' }}><Trash2 className="w-3.5 h-3.5" /> 删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 未保存提示弹窗 */}
      {pendingSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-lg border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>未保存的文件</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              当前工程有以下文件未保存，切换后将丢失修改：
            </p>
            <div className="space-y-1 mb-4">
              {unsavedFiles.map((f) => (
                <div key={f} className="text-xs px-3 py-1.5 rounded flex items-center gap-2"
                  style={{ background: 'var(--bg-input)', color: 'var(--color-warning)' }}>
                  <AlertCircle className="w-3.5 h-3.5" /> {f}
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={handleCancelSwitch} className="px-4 py-2 rounded text-xs border"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>取消</button>
              <button onClick={handleDiscardAndSwitch} className="px-4 py-2 rounded text-xs text-white"
                style={{ background: 'var(--color-error)' }}>不保存，直接切换</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
