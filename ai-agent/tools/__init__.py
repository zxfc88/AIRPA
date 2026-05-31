"""
LangChain Tools — 智能体技能系统

所有技能通过 @tool 装饰器注册为 LangChain Tool，
由 LLM 根据用户需求自主决策调用。

工具分类:
  browser_tools  — 浏览器导航、元素探索、页面交互
  system_tools   — 文件操作、目录遍历、命令执行、依赖安装
"""
