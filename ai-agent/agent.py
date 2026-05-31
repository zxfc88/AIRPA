"""
LangChain + LangGraph 智能体入口 — stdin/stdout JSON 行协议

与 Tauri Rust 后端通过 JSON 行协议通信:

  请求格式 (stdin):
    {"id": "req_001", "type": "chat",    "payload": {"message": "用户消息"}}
    {"id": "req_002", "type": "ping",    "payload": {}}
    {"id": "req_003", "type": "shutdown","payload": {}}

  响应格式 (stdout):
    {"id": "req_001", "type": "ready",   "event": "status", "data": {"status": "ready"}}
    {"id": "req_001", "type": "stream",  "event": "stage", "data": "正在分析需求..."}
    {"id": "req_001", "type": "stream",  "event": "code_block", "data": {...}}
    {"id": "req_001", "type": "done",    "data": {"status": "completed"}}
    {"id": "req_001", "type": "pong",    "event": "status", "data": {"status": "ok"}}

工作流:
  1. 启动时 emit ready 信号
  2. 收到 chat 消息 → 调用 LangGraph StateGraph 流式执行
  3. 每个节点输出通过 emit() 转为 JSON 行发送
  4. 收到 shutdown 时优雅退出
"""

import sys
import json
import asyncio
from graph import create_agent_graph, AgentState


async def process_message(msg_id: str, message: str):
    """
    处理单条对话消息

    创建 LangGraph StateGraph 实例，以用户消息作为初始状态，
    流式执行所有节点，将每个节点的中间结果实时输出。

    参数:
      msg_id: 请求 ID（用于关联请求-响应）
      message: 用户输入的自然语言消息
    """
    graph = create_agent_graph()

    initial_state: AgentState = {
        "messages": [{"role": "user", "content": message}],
        "requirement": None,
        "needs_browser": False,
        "elements": None,
        "generated_code": None,
        "review_result": None,
        "retry_count": 0,
        "current_stage": "开始处理...",
    }

    try:
        # 流式遍历 LangGraph 各节点输出
        for event in graph.stream(initial_state):
            for node_name, node_output in event.items():
                stage = node_output.get("current_stage", "")
                emit("stream", msg_id, "stage", stage)

                # 代码生成节点的 Main.py 内容实时推送
                if node_name == "generate_code":
                    code = node_output.get("generated_code", {}).get("main_py", "")
                    if code:
                        emit("stream", msg_id, "code_block", {
                            "language": "python",
                            "code": code,
                            "filename": "Main.py",
                        })

        emit("done", msg_id, "status", {"status": "completed"})
    except Exception as e:
        emit("done", msg_id, "error", {"status": "error", "message": str(e)})


def emit(event_type: str, msg_id: str, event: str, data):
    """
    向 stdout 写入一行 JSON

    参数:
      event_type: 事件类型 ("ready" | "stream" | "done" | "pong")
      msg_id: 关联的请求 ID
      event: 事件名称 ("stage" | "code_block" | "status" | "error")
      data: 事件携带的数据
    """
    line = json.dumps({
        "id": msg_id,
        "type": event_type,
        "event": event,
        "data": data,
    }, ensure_ascii=False)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


async def main():
    """
    主循环 — 读取 stdin 的 JSON 行，分发处理

    支持的消息类型:
      chat     — 对话消息，启动 LangGraph 流式生成
      ping     — 心跳检测
      shutdown — 优雅退出
    """
    emit("ready", "", "status", {"status": "ready"})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue

        msg_id = msg.get("id", "")
        msg_type = msg.get("type", "")

        if msg_type == "chat":
            payload = msg.get("payload", {})
            message = payload.get("message", "")
            await process_message(msg_id, message)

        elif msg_type == "ping":
            emit("pong", msg_id, "status", {"status": "ok"})

        elif msg_type == "shutdown":
            emit("done", msg_id, "status", {"status": "shutting_down"})
            break


if __name__ == "__main__":
    asyncio.run(main())
