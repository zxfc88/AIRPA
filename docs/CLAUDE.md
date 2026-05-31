# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**AI RPA智能体** — 基于 LangChain + LangGraph 智能体的桌面 RPA 自动化客户端。用户以自然语言描述需求，AI 智能体（LangGraph StateGraph 编排）生成标准化 Python RPA 代码（Main.py + requirements.txt），客户端提供 IDE 级环境用于编辑、运行和管理自动化工程。

## 技术栈

- **前端**: Vite + React 18 + TypeScript（后续集成 Tauri 2 桌面壳层）
- **智能体框架**: LangChain + LangGraph（Python Sidecar）
- **样式**: Tailwind CSS v4 + CSS 变量主题系统
- **状态管理**: Zustand（persist 中间件持久化）
- **路由**: React Router v7
- **代码编辑器**: Monaco Editor（@monaco-editor/react）
- **浏览器自动化**: Playwright（Python）
- **RPA 运行时**: Python 子进程（通过 Tauri sidecar 管理，待实现）

## 当前完成状态（2026/05/31）

### 已完成

- [x] **设计方案文档**: `AI RPA智能体 - 功能设计方案.md` 已更新，含 LangChain + LangGraph 架构
- [x] **项目脚手架**: Vite + React + TS 完整配置，Tailwind CSS v4，所有依赖已安装
- [x] **UI 框架**: 4 区域可拖拽布局（react-resizable-panels），5 页面路由导航
- [x] **主题系统**: CSS 变量 `[data-theme="dark"]` / `[data-theme="light"]` 双主题
- [x] **5 个 zustand stores**: useThemeStore, useLayoutStore, useProjectStore, useChatStore, useLogStore
- [x] **布局组件**: Sidebar（导航+文件树+折叠）、ChatPanel（对话+代码块）、LogConsole（日志+运行控制）
- [x] **编辑器**: CodeEditor（Monaco + 多文件标签页 + 运行/停止/保存）
- [x] **5 个页面**: HomePage, ProjectsPage, MarketPage, SkillsPage, SettingsPage
- [x] **TypeScript 零错误**, `vite build` 构建成功
- [x] **Rust 编译零错误零警告**, `cargo check` 通过
- [x] **Tauri 2 集成**: 11 个 Rust commands（Python运行/文件操作），4 个 plugins
- [x] **Python Sidecar**: LangChain + LangGraph 智能体代码完整（agent.py, graph.py, tools/*）
- [x] **前端 Tauri hooks**: usePythonRunner, useTauriFS
- [x] **Tauri release 构建成功**: `app.exe` @ `src-tauri/target/release/`

### 待实现

1. **Python Sidecar 运行时验证** — 需要安装 Python 依赖（langchain, langgraph, playwright）
2. **AI API 密钥配置** — Settings 页面 LLM 配置功能
3. **集成测试** — `npx tauri dev` 端到端流程验证
4. **收尾打磨** — Loading/Empty/Error 状态、快捷键、虚拟化日志

## 实际目录结构

```
AIRPA/
  app-ui/               # 【前端】React + TypeScript
    components/
      layout/     AppLayout.tsx, Sidebar.tsx, ChatPanel.tsx, LogConsole.tsx
      editor/     CodeEditor.tsx
      common/     WelcomeWizard.tsx
      chat/       （预留）
    pages/        HomePage.tsx, ProjectsPage.tsx, MarketPage.tsx, SkillsPage.tsx, SettingsPage.tsx
    stores/       useThemeStore.ts, useLayoutStore.ts, useProjectStore.ts, useChatStore.ts, useLogStore.ts, useLLMStore.ts
    hooks/        useAgentChat.ts, usePythonRunner.ts, useTauriFS.ts
    styles/       tokens.css, themes.css, globals.css
    types/        index.ts
    lib/          utils.ts (cn helper)
    App.tsx       React Router 路由入口
    main.tsx      ReactDOM 挂载点

  tauri-backend/       # 【后端】Tauri 2 + Rust
    src/
      main.rs         程序入口
      lib.rs          插件注册 + 11 条 Tauri 命令
      python_runner.rs Python 检测/执行/流式日志
      file_ops.rs     文件操作/工程管理/目录树
    tauri.conf.json    Tauri 窗口配置
    capabilities/     权限声明

  ai-agent/            # 【智能体】LangChain + LangGraph (Python)
    agent.py           入口: stdin/stdout JSON 行协议
    graph.py           StateGraph 5 节点工作流
    tools/
      browser_tools.py 浏览器自动化工具
      system_tools.py  系统操作工具

  docs/                # 项目文档
    AI RPA智能体 - 功能设计方案.md  完整产品设计文档
```

## 可用命令

```bash
# 安装依赖
npm install

# 启动前端开发服务器（http://localhost:5173）
npm run dev

# 生产构建
npm run build          # 或 npx vite build

# TypeScript 类型检查
npx tsc --noEmit

# 预览构建产物
npm run preview
```

## 主题系统

所有组件使用 CSS 变量，**禁止硬编码颜色**。变量定义在 `src/styles/` 中：

| 变量 | 深色主题 (dark) | 浅色主题 (light) |
|------|-----------------|------------------|
| `--bg-app` | #151718 | #F5F7FA |
| `--bg-sidebar` | #111314 | #EBF0F5 |
| `--bg-card` | #1E2022 | #FFFFFF |
| `--bg-input` | #1E2022 | #FFFFFF |
| `--border-color` | #2A2C2E | #E5E6EB |
| `--text-primary` | #E5E6EB | #1D2129 |
| `--text-secondary` | #86909C | #4E5969 |
| `--text-placeholder` | #4E5969 | #86909C |
| `--color-brand` | #1677FF | #1677FF |
| `--color-success` | #00B42A | #00B42A |
| `--color-warning` | #FF7D00 | #FF7D00 |
| `--color-error` | #F53F3F | #F53F3F |

用法：`style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}`

## 状态管理约定

- zustand stores 统一放在 `src/stores/`，命名 `use<Name>Store.ts`
- `useThemeStore` 和 `useLayoutStore` 使用 persist 中间件，key 前缀 `airpa-`
- 跨组件共享状态（如日志与工程关联）必须通过 store，不可 prop drilling
- 组件内短暂 UI 状态（如展开/折叠、输入值）使用本地 useState

## 工程标准化约定

- 每个自动化工程 = 独立目录 + `Main.py` 入口 + `requirements.txt`
- AI 生成工程和市场下载工程遵循完全相同的目录结构
- 工程类型通过 `ProjectEntry.type: 'ai' | 'market'` 区分
