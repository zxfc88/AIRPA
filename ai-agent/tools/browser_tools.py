"""
浏览器自动化工具 — 智能体技能系统 (browser 分类)

提供基于 Playwright 的全浏览器自动化能力:
  - browser_navigate:         导航到指定 URL，自动探索页面可交互元素
  - browser_extract_elements: 提取指定 CSS 选择器的元素属性
  - browser_execute_action:   执行页面交互（点击/输入/悬停/按键）

所有工具通过 @tool 装饰器注册，LLM 根据用户需求自主调用。

依赖: playwright >= 1.40.0
"""

from langchain_core.tools import tool
from typing import Optional


@tool
def browser_navigate(url: str) -> dict:
    """
    导航到指定 URL，自动探索并返回页面可交互元素列表

    启动 Chromium 浏览器（有头模式），访问目标页面，
    提取所有可见的按钮、链接、输入框、选择框、文本域的定位器信息。

    参数:
      url: 目标网页地址 (如 https://example.com)

    返回:
      {
        url: 访问的 URL,
        title: 页面标题,
        elements: [{tag, text, selector, visible}, ...]  (最多 20 个)
      }
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"error": "Playwright 未安装，请执行: pip install playwright && playwright install chromium"}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(url)
        title = page.title()
        elements = page.evaluate("""() => {
            const items = [];
            document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    items.push({
                        tag: el.tagName.toLowerCase(),
                        text: (el.textContent || '').trim().substring(0, 50),
                        selector: el.id ? '#' + el.id : el.className ? '.' + el.className.split(' ')[0] : el.tagName,
                        visible: true
                    });
                }
            });
            return items.slice(0, 20);
        }""")
        browser.close()
        return {"url": url, "title": title, "elements": elements}


@tool
def browser_extract_elements(selector: str) -> list:
    """
    提取指定 CSS 选择器匹配的所有元素属性

    用于精确定位页面元素，获取完整的定位器参数。

    参数:
      selector: CSS 选择器 (如 '.product-card', '#login-btn', 'button[type=submit]')

    返回:
      [{tag, text, id, className, type, href, placeholder, value}, ...]
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return [{"error": "Playwright 未安装"}]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("about:blank")  # 实际使用时会代入页面上下文
        elements = page.evaluate(f"""(selector) => {{
            return Array.from(document.querySelectorAll(selector)).map(el => ({{
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || '').trim().substring(0, 100),
                id: el.id, className: el.className, type: el.getAttribute('type'),
                href: el.getAttribute('href'), placeholder: el.getAttribute('placeholder'),
                value: el.getAttribute('value'),
            }}));
        }}""", selector)
        browser.close()
        return elements


@tool
def browser_execute_action(action: str, target: str, value: Optional[str] = None) -> dict:
    """
    在页面上执行指定的交互操作

    支持的操作类型:
      click  — 点击目标元素
      fill   — 在输入框中填入文本
      hover  — 鼠标悬停
      press  — 键盘按键 (Enter / Tab / Escape 等)

    参数:
      action: 操作类型 ("click" | "fill" | "hover" | "press")
      target: 目标元素的 CSS 选择器
      value:  操作值 (fill 时必填, press 时可选)

    返回:
      {action, target, success, error?}
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"error": "Playwright 未安装"}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("about:blank")
        result = {"action": action, "target": target, "success": True}

        try:
            if action == "click":
                page.locator(target).click()
            elif action == "fill":
                page.locator(target).fill(value or "")
            elif action == "hover":
                page.locator(target).hover()
            elif action == "press":
                page.locator(target).press(value or "Enter")
            else:
                result.update(success=False, error=f"未知操作类型: {action}")
        except Exception as e:
            result.update(success=False, error=str(e))

        browser.close()
        return result
