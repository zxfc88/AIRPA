/**
 * 左侧栏 — 当前项目 + 文件树
 *
 * 功能：
 * - Logo + 主导航菜单
 * - 当前项目文件树（仅显示一个活跃工程）
 * - 底部操作（选择目录加载项目、新建工程）
 * - 折叠切换（240px ↔ 64px）
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Home, MessageSquare, FolderGit2, ShoppingBag, Puzzle,
  Settings, ChevronRight, ChevronDown, FileCode, FileJson,
  FolderOpen, ChevronsLeft, ChevronsRight, Plus,
} from 'lucide-react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/stores/useProjectStore';
import type { PageId } from '@/types';
import { toast } from 'sonner';

/** 根据文件扩展名返回对应图标 */
const fileIcon = (filename: string) => {
  if (filename.endsWith('.py')) return <FileCode className="w-3.5 h-3.5" />;
  if (filename.endsWith('.json')) return <FileJson className="w-3.5 h-3.5" />;
  if (filename.endsWith('.txt')) return <FileCode className="w-3.5 h-3.5" />;
  return <FolderOpen className="w-3.5 h-3.5" />;
};

const navItems: { id: PageId | 'ai-chat'; icon: typeof Home; label: string; path: string }[] = [
  { id: 'home', icon: Home, label: '首页', path: '/' },
  { id: 'ai-chat', icon: MessageSquare, label: 'AI对话创作', path: '/' },
  { id: 'projects', icon: FolderGit2, label: '我的工程', path: '/projects' },
  { id: 'market', icon: ShoppingBag, label: '流程市场', path: '/market' },
  { id: 'skills', icon: Puzzle, label: '技能管理', path: '/skills' },
  { id: 'settings', icon: Settings, label: '环境设置', path: '/settings' },
];

export function Sidebar() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const currentProject = useProjectStore((s) => s.currentProject);
  const projects = useProjectStore((s) => s.projects);
  const openFile = useProjectStore((s) => s.openFile);
  const switchProject = useProjectStore((s) => s.switchProject);
  const setProjects = useProjectStore((s) => s.setProjects);
  const workspaceDir = useProjectStore((s) => s.workspaceDir);
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDir, setNewProjectDir] = useState('');

  /** 判断导航项是否激活 */
  const isActive = (item: typeof navItems[0]) =>
    item.id === 'ai-chat' ? location.pathname === '/' : location.pathname === item.path;

  /** 获取当前工程的完整信息 */
  const currentProjectEntry = projects.find((p) => p.name === currentProject);

  /** 点击文件在编辑器中打开 */
  const handleOpenFile = (fileName: string) => {
    if (!currentProjectEntry) return;
    const baseDir = workspaceDir || './RPA-Projects';
    const projPath = `${baseDir}/${currentProject}`;
    const isPy = fileName.endsWith('.py');
    openFile({
      id: `${currentProject}/${fileName}`,
      name: fileName,
      path: `${projPath}/${fileName}`,
      language: isPy ? 'python' : 'plaintext',
      content: isPy
        ? `"""RPA Automation — ${currentProject}"""\n\ndef main():\n    print("开始执行...")\n    \n\nif __name__ == "__main__":\n    main()\n`
        : '# 依赖列表\n',
      isModified: false,
    });
  };

  /** 创建工程 */
  const handleCreateProject = () => {
    const name = newProjectName.trim();
    if (!name) { toast.error('请输入工程名称'); return; }
    const baseDir = newProjectDir.trim() || workspaceDir || './RPA-Projects';
    const path = `${baseDir}/${name}`;
    setProjects([...projects, { name, path, type: 'ai', files: ['Main.py', 'requirements.txt'] }]);
    if (newProjectDir.trim() && !workspaceDir) {
      useProjectStore.getState().setWorkspaceDir(newProjectDir.trim());
    }
    switchProject(name);
    setNewProjectName('');
    setNewProjectDir('');
    setShowNewDialog(false);
    toast.success(`工程 "${name}" 已创建`);
  };

  return (
    <div className="h-full flex flex-col transition-all duration-300 border-r"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {collapsed ? (
          <div className="w-6 h-6 rounded mx-auto" style={{ background: 'linear-gradient(135deg, var(--color-brand), #0066FF)' }} />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(135deg, var(--color-brand), #0066FF)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>AI RPA智能体</span>
          </div>
        )}
      </div>

      {/* 导航 */}
      <div className="py-4">
        {navItems.map((item) => {
          const Icon = item.icon; const active = isActive(item);
          return (
            <button key={item.id} onClick={() => navigate(item.path)}
              className={`w-full h-10 flex items-center gap-3 transition-colors ${collapsed ? 'justify-center px-0' : 'px-4'}`}
              style={{
                color: active ? 'var(--color-brand)' : 'var(--text-secondary)',
                borderColor: active ? 'var(--color-brand)' : 'transparent',
                background: active ? 'rgba(22,119,255,0.1)' : 'transparent',
                borderLeftWidth: active ? 2 : 0,
              }}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* 折叠切换 */}
      <div className="px-2 mb-2">
        <button onClick={toggleSidebar} className="w-full p-1.5 rounded flex justify-center hover:bg-[var(--bg-card)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 当前项目 */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>当前项目</span>
            <button onClick={() => setShowNewDialog(true)} className="p-0.5 rounded hover:bg-[var(--bg-card)]"
              style={{ color: 'var(--text-secondary)' }} title="新建工程">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentProjectEntry ? (
            <div>
              <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-card)] text-sm"
                style={{ color: 'var(--text-primary)' }}>
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <FolderGit2 className="w-4 h-4" />
                <span className="flex-1 text-left truncate">{currentProjectEntry.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: currentProjectEntry.type === 'ai' ? 'rgba(22,119,255,0.2)' : 'rgba(0,180,42,0.2)',
                    color: currentProjectEntry.type === 'ai' ? 'var(--color-brand)' : 'var(--color-success)' }}>
                  {currentProjectEntry.type === 'ai' ? 'AI' : '市场'}
                </span>
              </button>
              {expanded && (
                <div className="ml-6 mt-1">
                  {currentProjectEntry.files.map((file) => (
                    <div key={file} onClick={() => handleOpenFile(file)}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-card)] text-xs cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}>
                      {fileIcon(file)}<span>{file}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs px-2 py-4 text-center" style={{ color: 'var(--text-placeholder)' }}>
              暂无项目，请新建或从「我的工程」打开
            </div>
          )}
        </div>
      )}

      {/* 底部操作 */}
      {!collapsed && (
        <div className="border-t p-3 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={() => setShowNewDialog(true)}
            className="w-full px-3 py-2 text-xs rounded transition-colors text-left hover:bg-[var(--bg-card)] flex items-center gap-2"
            style={{ color: 'var(--color-brand)' }}><Plus className="w-3.5 h-3.5" />新建工程</button>
          <button onClick={() => navigate('/projects')}
            className="w-full px-3 py-2 text-xs rounded transition-colors text-left hover:bg-[var(--bg-card)]"
            style={{ color: 'var(--text-secondary)' }}>浏览所有工程</button>
        </div>
      )}

      {/* 新建工程弹窗 */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-80 rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>新建工程</h3>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>工程名称</label>
            <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
              placeholder="如: web-scraper" autoFocus
              className="w-full h-9 px-3 rounded border text-sm focus:outline-none focus:ring-1 mb-3"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' } as React.CSSProperties} />
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>保存目录</label>
            <input type="text" value={newProjectDir} onChange={(e) => setNewProjectDir(e.target.value)}
              placeholder={workspaceDir || '如: D:/RPA-Projects'}
              className="w-full h-9 px-3 rounded border text-sm focus:outline-none focus:ring-1 mb-3 font-mono"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' } as React.CSSProperties} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewDialog(false)} className="px-4 py-2 rounded text-xs border"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>取消</button>
              <button onClick={handleCreateProject} className="px-4 py-2 rounded text-xs text-white"
                style={{ background: 'var(--color-brand)' }}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
