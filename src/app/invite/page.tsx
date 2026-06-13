'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const CDN_BASE = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uvpahylwvauhojylt_lm_tvjl/ljhwZthlaukjlkulzlp/douyin-ec';
const CDN_BASE2 = 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//assets/home';

// Floating 3D items data - using real douyinec.com CDN images
const floatingItems = [
  { src: `${CDN_BASE}/page1/01.jpg`, top: '5%', left: '3%', size: 90, duration: 7, delay: 0, rotate: -8 },
  { src: `${CDN_BASE}/page1/02.jpg`, top: '12%', right: '5%', size: 80, duration: 9, delay: -2, rotate: 12 },
  { src: `${CDN_BASE}/page1/03.jpg`, top: '40%', left: '2%', size: 85, duration: 8, delay: -3, rotate: -5 },
  { src: `${CDN_BASE}/page1/04.jpg`, top: '55%', right: '3%', size: 75, duration: 10, delay: -1, rotate: 8 },
  { src: `${CDN_BASE}/page1/05.jpg`, bottom: '12%', left: '6%', size: 80, duration: 7.5, delay: -4, rotate: -12 },
  { src: `${CDN_BASE2}/page3/01.png`, top: '70%', right: '8%', size: 70, duration: 9, delay: -5, rotate: 6 },
  { src: `${CDN_BASE2}/page3/02.png`, bottom: '5%', right: '20%', size: 65, duration: 8.5, delay: -2.5, rotate: -10 },
  { src: `${CDN_BASE2}/page3/03.png`, top: '25%', left: '12%', size: 60, duration: 11, delay: -6, rotate: 15 },
];

// Bottom card icons
const cardIcons = [
  `${CDN_BASE2}/page3/01.png`,
  `${CDN_BASE2}/page3/02.png`,
  `${CDN_BASE2}/page3/03.png`,
];

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('请输入邀请码');
      setShake(true);
      setTimeout(() => setShake(false), 400);
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
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || '邀请码无效');
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    } catch {
      setError('网络错误，请重试');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(170deg, #FFD6E8 0%, #FFEEF5 25%, #F5E6FF 50%, #E8D5F5 75%, #FFE0EC 100%)',
      }}
    >
      {/* Floating 3D items */}
      {floatingItems.map((item, i) => (
        <div
          key={i}
          className="absolute pointer-events-none hidden md:block"
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            width: item.size,
            height: item.size,
            borderRadius: '16px',
            overflow: 'hidden',
            opacity: 0.5,
            filter: 'blur(1px)',
            transform: `rotate(${item.rotate}deg)`,
            animation: `floatItem${(i % 3) + 1} ${item.duration}s ease-in-out infinite`,
            animationDelay: `${item.delay}s`,
            boxShadow: '0 8px 32px rgba(180,100,200,0.2)',
          }}
        >
          <Image
            src={item.src}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ))}

      {/* Sparkle particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="sparkle"
          style={{
            top: `${10 + i * 14}%`,
            left: `${15 + (i * 17) % 70}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Logo */}
      <div
        className={`absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <Image
          src={`${CDN_BASE2}/header/logo.png`}
          alt="抖音电商"
          width={32}
          height={32}
          className="w-7 h-7 md:w-8 md:h-8"
          unoptimized
        />
        <span className="text-lg md:text-xl font-bold text-gray-800">抖音电商</span>
      </div>

      {/* Main content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div
          className={`w-full max-w-md transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
            欢迎来到抖音电商
          </h1>
          <p className="text-gray-500 text-center mb-8 text-sm md:text-base">
            请输入邀请码以访问平台
          </p>

          {/* Input capsule */}
          <form
            onSubmit={handleSubmit}
            className={`flex items-center bg-white rounded-full overflow-hidden shadow-lg border border-gray-100 transition-all ${shake ? 'invite-shake' : ''}`}
            style={{ height: 52 }}
          >
            <div className="flex-1 flex items-center px-4 gap-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="请输入邀请码"
                className="flex-1 outline-none text-gray-700 text-base placeholder:text-gray-400 bg-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-full px-6 md:px-8 text-white font-medium text-base flex-shrink-0 transition-all duration-200 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #FF6B9D, #FF4D8D)',
              }}
            >
              {loading ? '验证中...' : '确认'}
            </button>
          </form>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm text-center mt-3 animate-pulse">{error}</p>
          )}
        </div>

        {/* Bottom feature cards */}
        <div
          className={`w-full max-w-2xl mt-10 md:mt-14 transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  icon: cardIcons[0],
                  title: '兴趣电商，新增量激发',
                  desc: '实现个性化推荐精准匹配，激发潜在用户兴趣，促成发现式消费，为商家带来新的生意增量',
                },
                {
                  icon: cardIcons[1],
                  title: '全链经营，一站式服务',
                  desc: '为商家提供全链路经营服务，助力商家长效经营生意阵地，有效沉淀用户价值，实现品销合一',
                },
                {
                  icon: cardIcons[2],
                  title: '优价好物，多场景转化',
                  desc: '短视频、直播双擎内容形式，搭载商家自播、达人矩阵、营销活动、头部大V四大经营赛道',
                },
              ].map((card, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 relative mb-3">
                    <Image
                      src={card.icon}
                      alt={card.title}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1.5 whitespace-pre-line">
                    {card.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
