/**
 * 技能管理页面
 *
 * 功能：
 * - 按分类展示智能体技能（浏览器自动化 / 系统操作 / 办公文件 / 网络 / 命令执行 / 媒体处理）
 * - 每项技能显示名称、描述、开关状态
 * - 刷新技能按钮（后续对接 Rust skill_registry）
 */
import { Puzzle, Power, PowerOff } from 'lucide-react';

/** 技能分类标签映射 */
const CAT_LABELS: Record<string, string> = {
  browser: '浏览器自动化', system: '系统操作', office: '办公文件',
  network: '网络请求', shell: '命令执行', media: '媒体处理',
};

/** 预置技能列表 */
const SKILLS = [
  { name: '浏览器导航', description: '启动浏览器并导航到指定URL', category: 'browser' as const, enabled: true },
  { name: '元素探索', description: '自动探索页面可交互元素并提取属性', category: 'browser' as const, enabled: true },
  { name: '页面交互', description: '执行页面点击、输入、选择等操作', category: 'browser' as const, enabled: true },
  { name: '文件操作', description: '文件移动、复制、删除、重命名', category: 'system' as const, enabled: true },
  { name: '目录遍历', description: '列出目录内容，支持模式匹配', category: 'system' as const, enabled: true },
  { name: 'Excel读取', description: '读取Excel文件内容并解析', category: 'office' as const, enabled: true },
  { name: 'Excel写入', description: '将数据写入Excel文件', category: 'office' as const, enabled: true },
  { name: 'PDF处理', description: '读取和提取PDF文件文本内容', category: 'office' as const, enabled: true },
  { name: 'HTTP请求', description: '发送HTTP请求获取网页数据', category: 'network' as const, enabled: true },
  { name: '命令执行', description: '执行系统命令并返回输出', category: 'shell' as const, enabled: true },
  { name: '依赖安装', description: '自动安装Python依赖包', category: 'shell' as const, enabled: true },
  { name: '截图', description: '对页面或窗口进行截图', category: 'media' as const, enabled: true },
];

export function SkillsPage() {
  return (
    <div className="h-full overflow-y-auto p-8" style={{ background: 'var(--bg-app)' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>技能管理</h1>
        <button className="px-4 py-2 rounded text-sm border transition-colors"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>刷新技能</button>
      </div>
      {Object.entries(CAT_LABELS).map(([catKey, catLabel]) => (
        <div key={catKey} className="mb-6">
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>{catLabel}</h2>
          <div className="grid grid-cols-3 gap-3">
            {SKILLS.filter((s) => s.category === catKey).map((skill) => (
              <div key={skill.name} className="rounded-lg p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Puzzle className="w-4 h-4" style={{ color: 'var(--color-brand)' }} />
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{skill.name}</span>
                  </div>
                  <span style={{ color: skill.enabled ? 'var(--color-success)' : 'var(--text-placeholder)' }}>
                    {skill.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
