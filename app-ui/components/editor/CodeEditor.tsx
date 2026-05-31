/**
 * 代码编辑器组件 — Monaco Editor 封装
 *
 * 功能：
 * - Python 语法高亮（Dark+ 主题）
 * - 多文件标签页（打开/切换/关闭，未保存标记）
 * - 顶部工具栏：保存、运行 Main.py、停止运行
 * - 文件内容实时同步到 useProjectStore
 * - 运行操作通过 usePythonRunner hook 桥接 Tauri 或模拟
 * - 空状态：提示从工程树打开文件或通过 AI 生成
 */
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Save, Play, Square, FileCode, X } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { usePythonRunner } from '@/hooks/usePythonRunner';
import { useTauriFS } from '@/hooks/useTauriFS';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/** 配置 Monaco Editor 使用本地打包的 monaco-editor，避免 CDN 加载失败 */
loader.config({ monaco });

export function CodeEditor() {
  const openFiles = useProjectStore((s) => s.openFiles);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const closeFile = useProjectStore((s) => s.closeFile);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);
  const markFileSaved = useProjectStore((s) => s.markFileSaved);
  const workspaceDir = useProjectStore((s) => s.workspaceDir);
  const { runScript, stopScript, isRunning } = usePythonRunner();
  const { writeFile } = useTauriFS();
  const currentFile = openFiles.find((f) => f.id === activeFileId);

  /** 保存当前文件到磁盘（Tauri 模式） */
  const handleSave = () => {
    if (!currentFile) return;
    if (currentFile.path) writeFile(currentFile.path, currentFile.content);
    markFileSaved(currentFile.id);
    toast.success(`${currentFile.name} 已保存`);
  };

  /** 运行当前工程的 Main.py */
  const handleRun = () => {
    if (!currentFile || isRunning) return;
    const projectDir = currentFile.path ? currentFile.path.replace(/[/\\]Main\.py$/, '') : workspaceDir || '.';
    runScript(projectDir, currentFile.path || 'Main.py');
  };

  /** 终止运行 */
  const handleStop = () => { stopScript(); toast.info('已停止运行'); };

  // 空状态 — 无打开文件
  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
        <div className="text-center">
          <FileCode className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-placeholder)' }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>代码编辑工作台</h2>
          <p style={{ color: 'var(--text-secondary)' }}>从左侧工程树打开文件，或通过 AI 对话生成代码</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-code)' }}>
      {/* 顶部工具栏 */}
      <div className="h-12 flex items-center justify-between px-4 border-b"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-medium" style={{ color: 'var(--text-primary)' }}>代码编辑工作台</h2>
        <div className="flex gap-2">
          <button onClick={handleSave}
            className="px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors hover:bg-[var(--bg-card)]"
            style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
            <Save className="w-4 h-4" />保存代码</button>
          <button onClick={handleRun}
            className="px-3 py-1.5 text-white rounded flex items-center gap-2 text-sm transition-colors"
            style={{ background: 'var(--color-success)' }}><Play className="w-4 h-4" />运行{currentFile.name}</button>
          <button onClick={handleStop}
            className={cn('px-3 py-1.5 text-white rounded flex items-center gap-2 text-sm transition-colors', !isRunning && 'opacity-50 cursor-not-allowed')}
            style={{ background: 'var(--color-error)' }}><Square className="w-4 h-4" />停止运行</button>
        </div>
      </div>

      {/* 文件标签页 */}
      <div className="flex items-center border-b" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        {openFiles.map((file) => (
          <button key={file.id} onClick={() => setActiveFile(file.id)}
            className={cn('h-10 px-4 flex items-center gap-2 border-r transition-colors', activeFileId === file.id ? '' : 'hover:bg-[var(--bg-card)]')}
            style={{ background: activeFileId === file.id ? 'var(--bg-code)' : 'var(--bg-sidebar)',
              color: activeFileId === file.id ? 'var(--text-primary)' : 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
            <FileCode className="w-4 h-4" />
            <span className="text-sm">{file.name}</span>
            {file.isModified && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-warning)' }} />}
            {activeFileId === file.id && (
              <X className="w-3 h-3 ml-1 hover:text-[var(--color-error)]" onClick={(e) => { e.stopPropagation(); closeFile(file.id); }} />
            )}
          </button>
        ))}
      </div>

      {/* Monaco 编辑器 */}
      <div className="flex-1">
        <Editor height="100%" language={currentFile.language} value={currentFile.content}
          onChange={(value) => updateFileContent(currentFile.id, value ?? '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: true }, fontSize: 14, lineNumbers: 'on',
            scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, wordWrap: 'on',
            fontFamily: 'var(--font-mono)',
          }}
        />
      </div>
    </div>
  );
}
