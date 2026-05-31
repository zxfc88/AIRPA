/**
 * 流程市场页面
 *
 * 功能：
 * - 搜索框 + 分类筛选 + 排序（最多下载/最新/最高评分）
 * - 网格卡片展示流程（封面/名称/分类/描述/下载量/版本）
 * - 下载按钮（当前为 DEMO 数据，后续对接云端市场 API）
 * - 每个流程卡片展示缩略图、简介和下载次数
 */
import { useState } from 'react';
import { Search, Download, Calendar } from 'lucide-react';

/** Demo 流程数据（后续替换为云端 API） */
const DEMO_FLOWS = [
  { id: '1', name: '自动化数据采集', description: '批量采集电商平台商品信息，支持多页翻页，自动导出Excel', category: '数据处理', downloads: 1234, version: 'v1.2.0', thumbnail: '📊' },
  { id: '2', name: '邮件自动发送', description: '批量发送邮件，支持模板变量替换，附件自动添加', category: '办公自动化', downloads: 856, version: 'v2.0.1', thumbnail: '📧' },
  { id: '3', name: '网站监控告警', description: '定时监控网站可用性，异常时自动发送通知', category: '系统运维', downloads: 642, version: 'v1.5.3', thumbnail: '🔔' },
  { id: '4', name: '表单自动填写', description: '自动填写网页表单，支持多种输入类型，验证码识别', category: '浏览器流程', downloads: 1521, version: 'v3.1.0', thumbnail: '📝' },
  { id: '5', name: 'PDF批量处理', description: '批量提取PDF文本，支持OCR识别，自动分类存储', category: '文件处理', downloads: 978, version: 'v1.8.2', thumbnail: '📄' },
  { id: '6', name: '社交媒体发布', description: '一键发布内容到多个社交平台，支持定时发布', category: '营销自动化', downloads: 1103, version: 'v2.3.0', thumbnail: '📱' },
];

const CATEGORIES = ['全部', '办公自动化', '数据处理', '系统运维', '浏览器流程', '文件处理'];

export function MarketPage() {
  const [activeCat, setActiveCat] = useState('全部');
  const [search, setSearch] = useState('');

  /** 按分类和搜索词过滤 */
  const filtered = DEMO_FLOWS.filter((f) =>
    (activeCat === '全部' || f.category === activeCat) &&
    (search === '' || f.name.includes(search) || f.description.includes(search))
  );

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-app)' }}>
      {/* 搜索栏 */}
      <div className="p-6 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-2xl font-medium mb-4" style={{ color: 'var(--text-primary)' }}>流程市场</h1>
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-placeholder)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索流程名称、描述..."
              className="w-full h-10 pl-10 pr-4 rounded border focus:outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
          </div>
          <select className="h-10 px-4 rounded border focus:outline-none" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
            <option>最多下载</option><option>最新发布</option><option>最高评分</option></select>
        </div>
        <div className="flex gap-2">{CATEGORIES.map((cat) =>
          <button key={cat} onClick={() => setActiveCat(cat)} className="px-4 py-1.5 rounded text-sm transition-colors"
            style={{ background: cat === activeCat ? 'var(--color-brand)' : 'var(--bg-input)', color: cat === activeCat ? 'white' : 'var(--text-secondary)' }}>{cat}</button>
        )}</div>
      </div>

      {/* 流程卡片网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((flow) => (
            <div key={flow.id} className="rounded-lg p-5 border transition-colors hover:border-[var(--color-brand)]"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(22,119,255,0.2), rgba(22,119,255,0.05))' }}>{flow.thumbnail}</div>
                <div className="flex-1"><h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{flow.name}</h3>
                  <span className="inline-block px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(22,119,255,0.1)', color: 'var(--color-brand)' }}>{flow.category}</span></div>
              </div>
              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{flow.description}</p>
              <div className="flex items-center justify-between text-xs mb-4" style={{ color: 'var(--text-placeholder)' }}>
                <span className="flex items-center gap-1"><Download className="w-3 h-3" />{flow.downloads}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{flow.version}</span></div>
              <button className="w-full h-9 text-white rounded transition-colors flex items-center justify-center gap-2"
                style={{ background: 'var(--color-brand)' }}><Download className="w-4 h-4" /> 下载流程</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
