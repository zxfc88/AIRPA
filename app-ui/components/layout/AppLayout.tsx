/**
 * 全局布局组件 — 4 区域可拖拽面板
 *
 * 结构:
 * ┌──────────┬──────────────────┬──────────┐
 * │ Sidebar  │   <Outlet />     │ ChatPanel│
 * │ 240px    │   中心内容区      │  380px   │
 * ├──────────┴──────────────────┴──────────┤
 * │          LogConsole (200px)            │
 * └────────────────────────────────────────┘
 *
 * 使用 react-resizable-panels 实现可拖拽调整尺寸。
 */
import { Outlet } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel';
import { LogConsole } from './LogConsole';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/stores/useProjectStore';

export function AppLayout() {
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const chatPanelWidth = useLayoutStore((s) => s.chatPanelWidth);
  const logConsoleHeight = useLayoutStore((s) => s.logConsoleHeight);
  const openFiles = useProjectStore((s) => s.openFiles);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <PanelGroup direction="vertical">
        {/* 上半部分: 侧边栏 + 中心区 + 对话面板 */}
        <Panel defaultSize={80} minSize={50}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={sidebarCollapsed ? 5 : 15} minSize={sidebarCollapsed ? 5 : 10} maxSize={20}>
              <Sidebar />
            </Panel>
            <PanelResizeHandle className="w-px" style={{ background: 'var(--border-color)' }} />
            <Panel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col overflow-hidden">
                {openFiles.length > 0 ? <CodeEditor /> : <Outlet />}
              </div>
            </Panel>
            <PanelResizeHandle className="w-px" style={{ background: 'var(--border-color)' }} />
            <Panel defaultSize={Math.round((chatPanelWidth / 1400) * 100)} minSize={15} maxSize={35}>
              <ChatPanel />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-px" style={{ background: 'var(--border-color)' }} />
        {/* 底部: 日志控制台 */}
        <Panel defaultSize={Math.round((logConsoleHeight / 900) * 100)} minSize={5} maxSize={40}>
          <LogConsole />
        </Panel>
      </PanelGroup>
    </div>
  );
}
