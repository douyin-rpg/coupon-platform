'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  // Check if invite is required
  const [isRequired, setIsRequired] = useState(true);

  useEffect(() => {
    fetch('/api/invite/verify')
      .then(res => res.json())
      .then(data => {
        if (!data.required) {
          router.replace('/');
        }
        setIsRequired(data.required);
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('请输入邀请码');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/invite/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.replace('/');
      } else {
        setError(data.error || '邀请码无效');
        triggerShake();
      }
    } catch {
      setError('网络错误，请重试');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  if (!isRequired) return null;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #FFD6E0 0%, #FDE2E4 20%, #FFF0F0 40%, #F5F0FF 60%, #EDE4F5 80%, #E8D5F5 100%)',
      }}
    >
      {/* 浮动3D物品 - 照搬老网站设计 */}
      {/* 左上角 - 抖音电商Logo */}
      <div className="absolute top-6 left-8 z-10 flex items-center gap-2 invite-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="w-8 h-8 flex items-center justify-center">
          <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
            <path d="M34.1 10.2C32.3 7.1 29 5 25.2 5h-3.9v26.3c0 2.6-2.1 4.7-4.7 4.7s-4.7-2.1-4.7-4.7 2.1-4.7 4.7-4.7c1 0 1.9.3 2.7.8V18.4c-1.4-.5-2.9-.8-4.5-.8C8.7 17.6 3.6 22.7 3.6 29s5.1 11.4 11.4 11.4S26.4 35.3 26.4 29V18.1c2.9 2 6.4 3.1 10.1 3.1v-7.8c-1.7 0-3.2-.6-4.3-1.6l1.9-1.6z" fill="#1A1A1A"/>
          </svg>
        </div>
        <span className="text-lg font-bold text-gray-800" style={{ letterSpacing: '2px' }}>抖音电商</span>
      </div>

      {/* 浮动3D物品 - 游戏手柄 (左上) */}
      <div className="absolute top-[12%] left-[8%] md:left-[12%] w-16 h-16 md:w-20 md:h-20 opacity-60 pointer-events-none"
        style={{ animation: 'floatItem1 7s ease-in-out infinite' }}>
        <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
          <rect x="8" y="28" width="64" height="32" rx="16" fill="url(#grad1)" />
          <circle cx="28" cy="44" r="6" fill="#FFD26F" />
          <circle cx="52" cy="44" r="6" fill="#4FACFE" />
          <rect x="36" y="36" width="8" height="16" rx="4" fill="#FF9A9E" />
          <defs>
            <linearGradient id="grad1" x1="8" y1="28" x2="72" y2="60">
              <stop offset="0%" stopColor="#FF6B9D" />
              <stop offset="100%" stopColor="#A18CD1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 浮动3D物品 - 滑板 (中上偏左) */}
      <div className="absolute top-[8%] left-[35%] md:left-[32%] w-20 h-8 md:w-28 md:h-10 opacity-50 pointer-events-none"
        style={{ animation: 'floatItem2 9s ease-in-out infinite', animationDelay: '-2s' }}>
        <svg viewBox="0 0 120 40" fill="none" className="w-full h-full">
          <rect x="4" y="14" width="112" height="14" rx="7" fill="url(#grad2)" />
          <circle cx="24" cy="34" r="5" fill="#4FACFE" />
          <circle cx="96" cy="34" r="5" fill="#4FACFE" />
          <defs>
            <linearGradient id="grad2" x1="4" y1="14" x2="116" y2="28">
              <stop offset="0%" stopColor="#C44FE2" />
              <stop offset="100%" stopColor="#FF9A9E" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 浮动3D物品 - 马克笔 (中上) */}
      <div className="absolute top-[15%] right-[30%] md:right-[28%] w-4 h-16 md:w-5 md:h-20 opacity-50 pointer-events-none"
        style={{ animation: 'floatItem3 8s ease-in-out infinite', animationDelay: '-4s', transform: 'rotate(-20deg)' }}>
        <svg viewBox="0 0 24 80" fill="none" className="w-full h-full">
          <rect x="4" y="4" width="16" height="56" rx="3" fill="url(#grad3)" />
          <polygon points="8,60 16,60 12,76" fill="#333" />
          <defs>
            <linearGradient id="grad3" x1="4" y1="4" x2="20" y2="60">
              <stop offset="0%" stopColor="#4FACFE" />
              <stop offset="100%" stopColor="#A18CD1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 浮动3D物品 - 笑脸表情 (中下偏右) */}
      <div className="absolute top-[55%] right-[8%] md:right-[12%] w-14 h-14 md:w-16 md:h-16 opacity-55 pointer-events-none"
        style={{ animation: 'floatItem1 8.5s ease-in-out infinite', animationDelay: '-3s' }}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FFD26F" />
          <circle cx="22" cy="26" r="4" fill="#333" />
          <circle cx="42" cy="26" r="4" fill="#333" />
          <path d="M20 38 Q32 50 44 38" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="24" r="1.5" fill="white" />
          <circle cx="42" cy="24" r="1.5" fill="white" />
        </svg>
      </div>

      {/* 浮动3D物品 - 行李箱 (右上) */}
      <div className="absolute top-[10%] right-[6%] md:right-[10%] w-14 h-18 md:w-18 md:h-22 opacity-55 pointer-events-none"
        style={{ animation: 'floatItem2 7.5s ease-in-out infinite', animationDelay: '-1s' }}>
        <svg viewBox="0 0 64 80" fill="none" className="w-full h-full">
          <rect x="8" y="24" width="48" height="48" rx="6" fill="#FF6B9D" />
          <rect x="12" y="28" width="40" height="20" rx="3" fill="#FF9AB8" />
          <rect x="24" y="8" width="16" height="20" rx="4" fill="#FF6B9D" />
          <rect x="28" y="4" width="8" height="8" rx="2" fill="#FF9AB8" />
          <circle cx="18" cy="76" r="5" fill="#4FACFE" />
          <circle cx="46" cy="76" r="5" fill="#4FACFE" />
        </svg>
      </div>

      {/* 浮动3D物品 - 黄色笔 (右侧中间) */}
      <div className="absolute top-[42%] right-[5%] md:right-[8%] w-3 h-14 md:w-4 md:h-18 opacity-50 pointer-events-none"
        style={{ animation: 'floatItem3 9s ease-in-out infinite', animationDelay: '-5s', transform: 'rotate(15deg)' }}>
        <svg viewBox="0 0 16 72" fill="none" className="w-full h-full">
          <rect x="2" y="2" width="12" height="56" rx="3" fill="#FFD26F" />
          <polygon points="4,58 12,58 8,70" fill="#F0A030" />
          <rect x="2" y="2" width="12" height="10" rx="3" fill="#F0A030" />
        </svg>
      </div>

      {/* 浮动3D物品 - 紫色短靴 (右下) */}
      <div className="absolute bottom-[15%] right-[12%] md:right-[15%] w-14 h-14 md:w-16 md:h-16 opacity-50 pointer-events-none"
        style={{ animation: 'floatItem1 10s ease-in-out infinite', animationDelay: '-6s' }}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M18 8 L18 40 L8 48 L8 56 L56 56 L56 48 L38 40 L38 8 Z" fill="url(#grad4)" />
          <ellipse cx="28" cy="8" rx="12" ry="4" fill="#C44FE2" />
          <defs>
            <linearGradient id="grad4" x1="8" y1="8" x2="56" y2="56">
              <stop offset="0%" stopColor="#C44FE2" />
              <stop offset="100%" stopColor="#A18CD1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 浮动3D物品 - V键 (左下) */}
      <div className="absolute bottom-[20%] left-[8%] md:left-[12%] w-12 h-12 md:w-14 md:h-14 opacity-50 pointer-events-none"
        style={{ animation: 'floatItem2 8s ease-in-out infinite', animationDelay: '-3s' }}>
        <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
          <rect x="4" y="4" width="48" height="48" rx="10" fill="url(#grad5)" />
          <text x="28" y="38" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">V</text>
          <defs>
            <linearGradient id="grad5" x1="4" y1="4" x2="52" y2="52">
              <stop offset="0%" stopColor="#A18CD1" />
              <stop offset="100%" stopColor="#C44FE2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 浮动3D物品 - 粉红小球 (右下角) */}
      <div className="absolute bottom-[8%] right-[6%] w-10 h-10 md:w-12 md:h-12 opacity-40 pointer-events-none"
        style={{ animation: 'floatItem3 6s ease-in-out infinite', animationDelay: '-2s' }}>
        <div className="w-full h-full rounded-full"
          style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF9A9E)', filter: 'blur(1px)' }} />
      </div>

      {/* 闪光粒子 */}
      <div className="sparkle sparkle-1" />
      <div className="sparkle sparkle-2" />
      <div className="sparkle sparkle-3" />
      <div className="sparkle sparkle-4" />
      <div className="sparkle sparkle-5" />
      <div className="sparkle sparkle-6" />

      {/* 主内容区 */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 invite-fade-in">
        {/* 输入框组件 - 胶囊形状：输入框+确认按钮一体 */}
        <div className={`flex items-center bg-white rounded-full shadow-lg border border-gray-100 overflow-hidden ${shake ? 'invite-shake' : ''}`}
          style={{ height: '52px' }}>
          {/* 输入图标 */}
          <div className="pl-5 pr-2 flex items-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          {/* 输入框 */}
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            className="flex-1 h-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-base"
            placeholder="请输入邀请码"
            autoFocus
            disabled={loading}
          />
          {/* 确认按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="h-full px-8 text-white font-semibold text-base transition-all duration-200 disabled:opacity-60 whitespace-nowrap"
            style={{ background: '#FF6B6B', minWidth: '90px' }}
          >
            {loading ? '验证中' : '确认'}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-3 text-center text-sm text-red-500 invite-fade-in">
            {error}
          </div>
        )}

        {/* 价值展示卡片 - 白色大卡片内三等分 */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {/* 左：兴趣电商 */}
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                  {/* 爱心3D图标 - 粉红小球聚合 */}
                  <path d="M32 56 C32 56 8 40 8 24 C8 16 14 10 22 10 C26 10 30 12 32 16 C34 12 38 10 42 10 C50 10 56 16 56 24 C56 40 32 56 32 56Z" fill="url(#heartGrad)" />
                  <circle cx="20" cy="22" r="3" fill="#FFB6C1" opacity="0.8" />
                  <circle cx="28" cy="18" r="2.5" fill="#FF9AB8" opacity="0.7" />
                  <circle cx="36" cy="18" r="2.5" fill="#FF9AB8" opacity="0.7" />
                  <circle cx="44" cy="22" r="3" fill="#FFB6C1" opacity="0.8" />
                  <circle cx="24" cy="30" r="2" fill="#FFB6C1" opacity="0.6" />
                  <circle cx="40" cy="30" r="2" fill="#FFB6C1" opacity="0.6" />
                  <circle cx="32" cy="26" r="2.5" fill="#FF9AB8" opacity="0.7" />
                  <defs>
                    <linearGradient id="heartGrad" x1="8" y1="10" x2="56" y2="56">
                      <stop offset="0%" stopColor="#FF6B9D" />
                      <stop offset="100%" stopColor="#FF9A9E" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-800 mb-2 leading-tight">兴趣电商<br/>新增量激发</h3>
              <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed hidden md:block">实现个性化推荐精准匹配，激发潜在用户兴趣，促成发现式消费，为商家带来新的生意增量</p>
            </div>

            {/* 中：全链经营 */}
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                  {/* 方块堆叠3D图标 */}
                  <rect x="18" y="30" width="28" height="14" rx="3" fill="#4FACFE" opacity="0.7" />
                  <rect x="14" y="22" width="28" height="14" rx="3" fill="#4FACFE" opacity="0.85" />
                  <rect x="10" y="14" width="28" height="14" rx="3" fill="#4FACFE" />
                  <rect x="22" y="38" width="28" height="14" rx="3" fill="#00F2FE" opacity="0.5" />
                  <rect x="26" y="30" width="28" height="14" rx="3" fill="#00F2FE" opacity="0.7" />
                </svg>
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-800 mb-2 leading-tight">全链经营<br/>一站式服务</h3>
              <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed hidden md:block">为商家提供全链路经营服务，助力商家长效经营生意阵地，有效沉淀用户价值，实现品销合一</p>
            </div>

            {/* 右：优价好物 */}
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                  {/* 球体+环形3D图标 */}
                  <circle cx="32" cy="32" r="18" fill="url(#sphereGrad)" />
                  <ellipse cx="32" cy="32" rx="28" ry="10" stroke="#A18CD1" strokeWidth="3" fill="none" opacity="0.6" transform="rotate(-20 32 32)" />
                  <ellipse cx="32" cy="32" rx="28" ry="10" stroke="#C44FE2" strokeWidth="2" fill="none" opacity="0.4" transform="rotate(20 32 32)" />
                  <circle cx="26" cy="26" r="4" fill="white" opacity="0.3" />
                  <defs>
                    <linearGradient id="sphereGrad" x1="14" y1="14" x2="50" y2="50">
                      <stop offset="0%" stopColor="#A18CD1" />
                      <stop offset="100%" stopColor="#C44FE2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-800 mb-2 leading-tight">优价好物<br/>多场景转化</h3>
              <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed hidden md:block">短视频、直播双擎内容形式，搭载商家自播、达人矩阵、营销活动、头部大V四大经营赛道</p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="relative z-10 mt-6 text-center text-xs text-gray-400/60 pb-4">
        © 2024 抖音电商
      </div>
    </div>
  );
}
