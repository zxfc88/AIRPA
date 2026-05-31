/**
 * AI RPA智能体 — 全局类型定义
 *
 * 定义聊天消息、工程结构、日志条目、技能定义、
 * LLM 配置、文件节点、布局状态等所有核心数据类型。
 */

// ── Chat ──

/** 聊天消息 — 用户或 AI 发送的单条对话 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** AI 生成的代码块列表（可选） */
  codeBlocks?: CodeBlock[];
  /** 工具调用记录（可选，LangGraph Sidecar 模式） */
  toolCalls?: ToolCallRecord[];
  /** 当前工作流阶段标识 */
  stage?: string;
  timestamp: number;
}

/** 代码块 — AI 回复中提取的单段代码 */
export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

/** 工具调用记录 — LangGraph 智能体执行时的工具调用日志 */
export interface ToolCallRecord {
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'done' | 'error';
}

// ── Project ──

/** 工程条目 — 一个本地 RPA 自动化工程 */
export interface ProjectEntry {
  name: string;
  path: string;
  type: 'ai' | 'market';  // AI 生成 或 市场下载
  files: string[];
}

/** 编辑器文件标签页 */
export interface FileTab {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isModified: boolean;  // 是否有未保存修改
}

// ── Log ──

/** 日志条目 — 底部控制台的单行日志 */
export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source: 'stdout' | 'stderr' | 'system';
  message: string;
}

// ── Skill ──

/** 技能定义 — 智能体可调用的单条技能 */
export interface SkillDefinition {
  name: string;
  description: string;
  category: 'browser' | 'system' | 'office' | 'network' | 'shell' | 'media';
  parameters: SkillParameter[];
  isEnabled: boolean;
}

/** 技能参数定义 */
export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

// ── Environment ──

/** Python 环境检测结果 */
export interface PythonEnvInfo {
  pythonPath: string | null;
  version: string | null;
  hasPip: boolean;
  hasPlaywright: boolean;
  playwrightVersion: string | null;
  issues: string[];
}

// ── File System ──

/** 文件树节点 — 递归目录结构 */
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

// ── LLM Config ──

/** 大模型配置 — 持久化保存的 LLM API 参数 */
export interface LLMConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// ── Layout ──

/** 主题类型 */
export type Theme = 'dark' | 'light';

/** 页面标识 */
export type PageId = 'home' | 'projects' | 'market' | 'skills' | 'settings';
