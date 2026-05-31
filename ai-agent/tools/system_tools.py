"""
系统操作工具 — 智能体技能系统 (system / shell 分类)

提供本地系统级别的操作能力:
  - file_operation:   文件/目录的复制、移动、删除、重命名
  - directory_list:   列出目录内容，支持 glob 模式匹配
  - shell_execute:    执行任意系统命令（60 秒超时）
  - pip_install:      安装 Python 依赖包（120 秒超时）

所有工具通过 @tool 装饰器注册，LLM 根据用户需求自主调用。
"""

import os
import shutil
import subprocess
import glob as glob_module
from langchain_core.tools import tool


@tool
def file_operation(op: str, source: str, dest: str = "") -> dict:
    """
    执行文件/目录操作

    支持的操作:
      copy   — 复制文件或目录（目录递归复制）
      move   — 移动/重命名
      delete — 删除文件或目录（目录递归删除，不可逆！）
      rename — 重命名（等价于 move）

    参数:
      op:     操作类型 ("copy" | "move" | "delete" | "rename")
      source: 源路径（绝对路径）
      dest:   目标路径（copy/move/rename 必需）

    返回:
      {success, operation, source, dest?, error?}
    """
    try:
        if op == "copy":
            if os.path.isdir(source):
                shutil.copytree(source, dest)
            else:
                shutil.copy2(source, dest)
            return {"success": True, "operation": op, "source": source, "dest": dest}

        elif op == "move":
            shutil.move(source, dest)
            return {"success": True, "operation": op, "source": source, "dest": dest}

        elif op == "delete":
            if os.path.isdir(source):
                shutil.rmtree(source)
            else:
                os.remove(source)
            return {"success": True, "operation": op, "source": source}

        elif op == "rename":
            shutil.move(source, dest)
            return {"success": True, "operation": op, "source": source, "dest": dest}

        return {"success": False, "error": f"未知操作类型: {op}"}
    except Exception as e:
        return {"success": False, "error": str(e), "operation": op}


@tool
def directory_list(path: str, pattern: str = "*") -> list:
    """
    列出指定目录的内容，支持 glob 模式过滤

    参数:
      path:    目录绝对路径
      pattern: glob 匹配模式 (默认 "*" 全部, 如 "*.py" 只列出 Python 文件)

    返回:
      [{name, is_dir, size, path}, ...]
    """
    try:
        full_pattern = os.path.join(path, pattern)
        items = glob_module.glob(full_pattern)
        result = []
        for item in items:
            name = os.path.basename(item)
            is_dir = os.path.isdir(item)
            size = os.path.getsize(item) if not is_dir else 0
            result.append({"name": name, "is_dir": is_dir, "size": size, "path": item})
        return result
    except Exception as e:
        return [{"error": str(e)}]


@tool
def shell_execute(command: str, cwd: str = "") -> dict:
    """
    执行系统命令并返回 stdout/stderr

    60 秒超时保护，防止命令卡死。

    参数:
      command: 要执行的命令 (支持管道和重定向)
      cwd:     工作目录 (可选，默认当前目录)

    返回:
      {success, exit_code, stdout, stderr, error?}
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd or None,
            capture_output=True,
            text=True,
            timeout=60,
        )
        return {
            "success": result.returncode == 0,
            "exit_code": result.returncode,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "命令执行超时 (60 秒)"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@tool
def pip_install(package: str) -> dict:
    """
    使用 pip 安装 Python 依赖包

    120 秒超时，适配大型包（如 playwright 的浏览器内核下载）。

    参数:
      package: 包名及版本约束 (如 "pandas>=2.0" 或 "playwright")

    返回:
      {success, stdout, stderr, error?}
    """
    try:
        result = subprocess.run(
            ["pip", "install", package],
            capture_output=True,
            text=True,
            timeout=120,
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
