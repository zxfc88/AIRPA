"""
AI RPA 智能体 — Python Sidecar 包

LangChain + LangGraph 智能体核心，由 Tauri Rust 后端作为子进程管理。
通过 stdin/stdout JSON 行协议与前端通信，实现流式对话和代码生成。

目录结构:
  agent.py          — 入口，JSON 行协议通信主循环
  graph.py          — LangGraph StateGraph 工作流定义
  tools/
    browser_tools.py — 浏览器自动化工具（Playwright）
    system_tools.py  — 系统操作工具（文件/命令/包管理）
"""
