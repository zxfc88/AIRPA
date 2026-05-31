/**
 * 首页 — 应用默认入口
 *
 * 展示：
 * - 欢迎横幅（渐变蓝色背景）
 * - 快速入口卡片（AI 对话创作 / 流程市场 / 我的工程）
 * - 最近活动列表
 * - 统计数据（本地工程数、运行次数、成功率、市场下载）
 * - 首次访问时弹出 WelcomeWizard 引导向导
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Code, ShoppingBag, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { WelcomeWizard } from '@/components/common/WelcomeWizard';

export function HomePage() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('airpa-wizard-done')) setShowWizard(true);
  }, []);

  /** 向导完成后标记不再显示 */
  const handleWizardComplete = () => {
    localStorage.setItem('airpa-wizard-done', '1');
    setShowWizard(false);
  };

  return (
    <div className="h-full overflow-y-auto p-8" style={{ background: 'var(--bg-app)' }}>
      {showWizard && <WelcomeWizard onComplete={handleWizardComplete} />}

      {/* 欢迎横幅 */}
      <div className="rounded-lg p-8 mb-6 border" style={{ background: 'linear-gradient(135deg, rgba(22,119,255,0.1), rgba(22,119,255,0.05))', borderColor: 'rgba(22,119,255,0.2)' }}>
        <h1 className="text-3xl font-medium mb-3" style={{ color: 'var(--text-primary)' }}>欢迎使用 AI RPA 智能体</h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>通过AI对话快速生成自动化流程，Playwright驱动浏览器RPA，让重复工作自动化</p>
      </div>

      {/* 快速入口 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Zap, color: 'var(--color-brand)', title: 'AI对话创作', desc: '描述你的需求，AI自动生成自动化代码', page: '/' },
          { icon: ShoppingBag, color: 'var(--color-success)', title: '流程市场', desc: '下载现成的自动化流程，开箱即用', page: '/market' },
          { icon: Code, color: 'var(--color-warning)', title: '我的工程', desc: '管理本地RPA工程，编辑代码和配置', page: '/projects' },
        ].map((item) => (
          <div key={item.title} onClick={() => navigate(item.page)} className="rounded-lg p-6 border cursor-pointer transition-colors hover:border-[var(--color-brand)]"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: `${item.color}15` }}>
              <item.icon className="w-6 h-6" style={{ color: item.color }} /></div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 最近活动 */}
      <div className="rounded-lg p-6 mb-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Clock className="w-5 h-5" />最近活动</h2>
        <div className="space-y-3">
          {[{ time: '10分钟前', action: '运行了工程', project: 'demo-project' }, { time: '1小时前', action: 'AI生成了', project: 'web-scraper' }, { time: '今天 14:30', action: '从市场下载', project: '表单自动填写' }]
            .map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--text-placeholder)' }}>{a.time}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{a.action}</span>
                <span style={{ color: 'var(--color-brand)' }}>{a.project}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[{ label: '本地工程', value: '3', trend: '+1' }, { label: '运行次数', value: '28', trend: '+5' }, { label: '成功率', value: '95%', trend: '+2%' }, { label: '市场下载', value: '8', trend: '+3' }]
          .map((stat, i) => (
            <div key={i} className="rounded-lg p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-success)' }}><TrendingUp className="w-3 h-3" />{stat.trend}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
