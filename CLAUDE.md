# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**AI RPA智能体** — 基于 LangChain + LangGraph 的桌面 RPA 自动化客户端。Tauri 2 + React + TypeScript + Rust + Python。

核心闭环：自然语言对话 → AI 生成 Python RPA 代码 → 一键应用到当前工程 → 编辑器预览/编辑 → 运行 → 实时日志。

## 目录结构

```
AIRPA/
  app-ui/            # React 前端 (Tailwind v4 + Zustand + Monaco Editor + react-resizable-panels)
  tauri-backend/     # Tauri 2 Rust 后端 (Python执行/文件操作/进程管理)
  ai-agent/          # LangChain + LangGraph Python 智能体 (StateGraph 5节点工作流)
  docs/              # 设计方案文档
  CLAUDE.md          # 本文件 (项目根目录，Claude Code 自动读取)
```

## 可用命令

```bash
npm install           # 安装前端依赖
npm run dev           # 启动开发服务器 (http://localhost:5173)
npx tsc --noEmit      # TypeScript 类型检查
npx vite build        # 前端生产构建
cd tauri-backend && cargo check   # Rust 编译检查
cd tauri-backend && cargo build --release  # Rust release 构建
npx tauri dev --config tauri-backend/tauri.conf.json  # 启动 Tauri 桌面应用
python ai-agent/agent.py  # 启动 Python 智能体 (stdin/stdout JSON协议)
```

## 前端架构 (app-ui/)

### 组件树
```
App.tsx (React Router + 主题)
  AppLayout.tsx (4区域可拖拽: react-resizable-panels)
    Sidebar          # 左: 导航 + 当前项目文件树
    <Outlet>         # 中: 页面路由 或 CodeEditor (有打开文件时)
    ChatPanel        # 右: AI对话 + 代码块
    LogConsole       # 底: 运行日志
```

### 路由
| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 欢迎页 + 快速入口 + 首次引导 |
| `/projects` | ProjectsPage | 所有本地工程 + 切换当前项目 |
| `/market` | MarketPage | 流程市场 (Demo数据) |
| `/skills` | SkillsPage | 技能管理 |
| `/settings` | SettingsPage | 环境/LLM配置/工作目录 |

### 状态管理 (6个 Zustand stores)
| Store | 持久化 | 核心字段 |
|-------|:--:|------|
| useThemeStore | ✅ | theme (dark/light) |
| useLayoutStore | ✅ | sidebarCollapsed, chatPanelWidth, logConsoleHeight |
| useLLMStore | ✅ | apiEndpoint, apiKey, model, temperature, maxTokens |
| useProjectStore | | currentProject, projects[], openFiles[], activeFileId |
| useChatStore | | messages[], isStreaming, currentStage |
| useLogStore | | entries[], isRunning |

### 核心交互
- **当前项目**: 侧边栏只展示一个活跃工程；"我的工程"页点编辑切换项目
- **切换工程**: 有未保存文件时弹窗提示 [取消] [不保存，直接切换]
- **AI对话**: 代码块点"应用到工程"自动归属到 currentProject
- **主题**: CSS变量驱动，`[data-theme="dark"]` / `[data-theme="light"]`
- **编辑器**: Monaco 本地加载 (loader.config({monaco}))，非CDN

## Rust 后端 (tauri-backend/)

### 11条 Tauri 命令
- **Python**: detect_python, run_python_script, stop_python_script, is_python_running
- **文件**: read_file, write_file, list_projects, create_project_dir, get_file_tree, delete_file, file_exists

### 4个插件
shell, dialog, fs, store, process (均已注册)

## Python 智能体 (ai-agent/)

- **agent.py**: entry, stdin/stdout JSON行协议通信
- **graph.py**: LangGraph StateGraph (需求理解→元素探索→代码生成→审查→应用)
- **tools/**: browser_tools (3个), system_tools (4个)

## 主题系统

所有组件使用CSS变量，**禁止硬编码颜色**。

| 变量 | 深色 | 浅色 |
|------|------|------|
| --bg-app | #151718 | #F5F7FA |
| --bg-sidebar | #111314 | #EBF0F5 |
| --bg-card | #1E2022 | #FFFFFF |
| --text-primary | #E5E6EB | #1D2129 |
| --color-brand | #1677FF | #1677FF |

## 工程约定

- 每个自动化工程 = 独立目录 + `Main.py` + `requirements.txt`
- AI生成和市场下载统一结构
- 跨组件状态必须通过 store，禁止 prop drilling
