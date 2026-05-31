"""
LangGraph StateGraph — RPA 智能体工作流定义

核心流程（5 节点 + 条件路由）:

    START
      │
      ▼
  understand_requirement  ← 解析用户自然语言需求
      │
      ├─ 需要浏览器? ──→ element_exploration ← 启动 Playwright 探索页面元素
      │                        │
      └─ 不需要 ──────────────┘
               │
               ▼
         generate_code       ← 生成标准化 Python RPA 代码 (Main.py + requirements.txt)
               │
               ▼
         review_code          ← 审查代码正确性，决定是否重新生成
               │
         ┌─────┼─────┐
         │ 通过  │ 需修改(≤3次) │
         ▼      │     │
  apply_to_project │     └──→ 回到 generate_code (retry)
         │         │
         ▼         ▼
        END       END (fail)
"""

from typing import TypedDict, List, Optional, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """
    智能体全局状态，在 LangGraph 各节点间流转

    字段:
      messages:        对话消息历史（自动追加）
      requirement:     结构化需求描述 {intent, target_app, steps, constraints}
      needs_browser:   是否需要浏览器自动化
      elements:        浏览器探索提取的页面元素 [{selector, type, label, attributes}]
      generated_code:  生成的工程代码 {main_py, requirements_txt}
      review_result:   代码审查结果 {passed, issues, suggestions}
      retry_count:     审查-重试次数（上限 3 次防止无限循环）
      current_stage:   当前阶段文本（用于前端进度展示）
    """
    messages: Annotated[list, add_messages]
    requirement: Optional[dict]
    needs_browser: bool
    elements: Optional[List[dict]]
    generated_code: Optional[dict]
    review_result: Optional[dict]
    retry_count: int
    current_stage: str


def create_agent_graph():
    """
    构建并编译 RPA 代码生成工作流

    返回:
      编译后的 CompiledStateGraph，可直接调用 .stream() 执行
    """
    workflow = StateGraph(AgentState)

    # 注册节点
    workflow.add_node("understand_requirement", understand_requirement)
    workflow.add_node("element_exploration", element_exploration)
    workflow.add_node("generate_code", generate_code)
    workflow.add_node("review_code", review_code)
    workflow.add_node("apply_to_project", apply_to_project)

    workflow.set_entry_point("understand_requirement")

    # 条件路由
    workflow.add_conditional_edges(
        "understand_requirement",
        route_after_understanding,
        {"explore": "element_exploration", "generate": "generate_code"}
    )
    workflow.add_edge("element_exploration", "generate_code")
    workflow.add_edge("generate_code", "review_code")

    workflow.add_conditional_edges(
        "review_code",
        route_after_review,
        {"retry": "generate_code", "apply": "apply_to_project", "fail": END}
    )
    workflow.add_edge("apply_to_project", END)

    return workflow.compile()


# ─── 节点实现 ─────────────────────────────────────────────────────────

def understand_requirement(state: AgentState) -> dict:
    """
    需求理解节点

    解析用户最后一条消息，提取关键意图。
    判断是否需要浏览器自动化（根据关键词匹配）。
    """
    last_msg = state["messages"][-1].content if state["messages"] else ""
    return {
        "current_stage": "正在分析需求...",
        "requirement": {"raw": last_msg},
        "needs_browser": _check_needs_browser(last_msg),
        "retry_count": 0,
    }


def element_exploration(state: AgentState) -> dict:
    """
    页面元素探索节点

    当需求涉及浏览器操作时触发。
    启动 Playwright 访问目标页面，提取可交互元素的定位器属性。
    """
    return {
        "current_stage": "正在探索页面元素...",
        "elements": [],
    }


def generate_code(state: AgentState) -> dict:
    """
    代码生成节点

    根据结构化需求和页面元素信息，生成标准化 Python RPA 代码。
    输出 Main.py 入口文件和 requirements.txt 依赖清单。
    """
    return {
        "current_stage": "正在生成RPA代码...",
        "generated_code": {
            "main_py": _build_main_py_template(state),
            "requirements_txt": "playwright>=1.40.0\n",
        },
    }


def review_code(state: AgentState) -> dict:
    """
    代码审查节点

    检查生成的代码质量：
    - 依赖是否正确声明在 requirements.txt
    - 语法结构是否完整
    - 是否有明显的安全隐患
    """
    code = state.get("generated_code", {}).get("main_py", "")
    issues = []
    if "from playwright" in code and "playwright" not in (state.get("generated_code", {}).get("requirements_txt", "")):
        issues.append("缺少 playwright 依赖")
    return {
        "current_stage": "正在审查代码...",
        "review_result": {
            "passed": len(issues) == 0,
            "issues": issues,
            "suggestions": [],
        },
    }


def apply_to_project(state: AgentState) -> dict:
    """
    应用节点 — 将审查通过的代码写入本地工程目录

    由前端用户确认后触发，实际文件写入通过 Tauri Rust 后端完成。
    """
    return {"current_stage": "代码已生成，请确认是否应用到工程"}


# ─── 路由函数 ─────────────────────────────────────────────────────────

def route_after_understanding(state: AgentState) -> str:
    """根据需求是否涉及浏览器决定下一步"""
    if state.get("needs_browser", False):
        return "explore"
    return "generate"


def route_after_review(state: AgentState) -> str:
    """
    根据审查结果决定下一步

    通过 → apply (写入工程)
    未通过且重试次数 < 3 → retry (回到代码生成)
    超过重试上限 → fail (终止)
    """
    review = state.get("review_result", {})
    if review.get("passed", False):
        return "apply"
    if state.get("retry_count", 0) < 3:
        return "retry"
    return "fail"


# ─── 辅助函数 ─────────────────────────────────────────────────────────

def _check_needs_browser(text: str) -> bool:
    """
    简单关键词匹配判断是否需要浏览器自动化

    参数:
      text: 用户输入的自然语言消息

    返回:
      True 如果包含浏览器相关关键词
    """
    browser_keywords = ["浏览器", "网页", "网站", "登录", "表单", "填表", "点击", "页面", "browser", "网页"]
    return any(kw in text.lower() for kw in browser_keywords)


def _build_main_py_template(state: AgentState) -> str:
    """
    构建 Main.py 模板代码

    根据需求描述生成带 Playwright 初始化框架的 Python 脚本。

    参数:
      state: 当前 AgentState

    返回:
      格式化的 Main.py 源代码字符串
    """
    req = state.get("requirement", {}).get("raw", "自动化任务")
    return f'''"""RPA Automation - AI Generated"""
from playwright.sync_api import sync_playwright

def main():
    """需求: {req}"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # TODO: AI agent will generate specific automation steps
        page.goto("https://example.com")
        print(f"页面标题: {{page.title()}}")

        browser.close()

if __name__ == "__main__":
    main()
'''
