'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { KeyIcon, CheckIcon, FlashIcon, StarIcon } from '@/components/icons';

const CDN = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uvpahylwvauhojylt_lm_tvjl/ljhwZthlaukjlkulzlp/douyin-ec';

const slides = [
  { bg: '#5ac8ff', img: `${CDN}/page1/01.jpg`, videoA: `${CDN}/page1/01-a.mp4`, videoB: `${CDN}/page1/01-b.mp4` },
  { bg: '#acc9f7', img: `${CDN}/page1/02.jpg`, videoA: `${CDN}/page1/02-a.mp4`, videoB: `${CDN}/page1/02-b.mp4` },
  { bg: '#7eb6ff', img: `${CDN}/page1/03.jpg`, videoA: `${CDN}/page1/03-a.mp4`, videoB: `${CDN}/page1/03-b.mp4` },
  { bg: '#b8d4ff', img: `${CDN}/page1/04.jpg`, videoA: `${CDN}/page1/04-a.mp4`, videoB: `${CDN}/page1/04-b.mp4` },
  { bg: '#8ec5ff', img: `${CDN}/page1/05.jpg`, videoA: `${CDN}/page1/05-a.mp4`, videoB: `${CDN}/page1/05-b.mp4` },
];

const logoUrl = 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//assets/home/header/logo.png';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  // Auto-rotate slides every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('请输入邀请码');
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
        document.cookie = 'invite_verified=true; path=/; max-age=86400';
        router.push('/');
      } else {
        setError(data.error || '邀请码无效');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background slideshow - exact douyinec.com style */}
      <div className="absolute inset-0">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[1500ms]"
            style={{
              opacity: currentSlide === i ? 1 : 0,
              backgroundColor: slide.bg,
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${slide.img})`,
              }}
            />
            {/* Video overlay for animation */}
            {currentSlide === i && (
              <video
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
                poster={slide.img}
              >
                <source src={slide.videoB} type="video/mp4" />
              </video>
            )}
          </div>
        ))}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content overlay - douyinec.com style layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header nav bar - matching douyinec.com */}
        <div className="flex items-center justify-between px-6 md:px-12 py-4">
          <div className="flex items-center gap-3">
            <Image src={logoUrl} alt="抖音电商" width={120} height={36} className="h-7 md:h-9 w-auto" unoptimized />
          </div>
          <div className="flex items-center gap-6 text-white/70 text-sm">
            <span className="text-white font-medium border-b-2 border-white pb-0.5">首页</span>
            <span className="hover:text-white cursor-pointer transition-colors">商家入驻</span>
            <span className="hover:text-white cursor-pointer transition-colors hidden sm:inline">达人入驻</span>
            <span className="hover:text-white cursor-pointer transition-colors hidden md:inline">机构入驻</span>
            <span className="hover:text-white cursor-pointer transition-colors hidden lg:inline">抖音电商知识库</span>
          </div>
          <Link href="/login" className="px-5 py-1.5 rounded-full bg-[#1890FF] text-white text-sm font-medium hover:bg-[#1890FF]/80 transition-colors">
            登录
          </Link>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Main title - matching douyinec.com */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-6 tracking-wide"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            加入抖音电商，激发兴趣 引领增长
          </h1>

          {/* Feature tags - matching douyinec.com */}
          <div className="flex items-center gap-6 mb-10">
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <CheckIcon className="w-4 h-4 text-white" />
              <span>抖音超6亿日活</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <CheckIcon className="w-4 h-4 text-white" />
              <span>全面购物场景</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <CheckIcon className="w-4 h-4 text-white" />
              <span>一站式全链经营</span>
            </div>
          </div>

          {/* Invite code input - capsule style */}
          <div className={`w-full max-w-md ${error ? 'animate-shake' : ''}`}>
            <form onSubmit={handleSubmit} className="flex items-center bg-white rounded-full overflow-hidden shadow-lg shadow-black/10">
              <div className="flex items-center flex-1 pl-5 pr-3">
                <KeyIcon className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  placeholder="请输入邀请码"
                  className="flex-1 py-3.5 text-sm text-gray-800 placeholder-gray-300 bg-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex-shrink-0 px-8 py-3.5 bg-[#FF6B6B] hover:bg-[#FF5252] text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? '验证中...' : '确认'}
              </button>
            </form>
            {error && (
              <p className="text-red-300 text-xs mt-2 text-center">{error}</p>
            )}
          </div>
        </div>

        {/* Bottom entry cards - matching douyinec.com */}
        <div className="pb-8 md:pb-12 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: '境内商家', desc: '在抖音开店卖货', icon: `${CDN}/page3/01.png` },
              { name: '跨境商家', desc: '境外商家入驻', icon: `${CDN}/page3/02.png` },
              { name: '达人', desc: '好物推荐官', icon: `${CDN}/page3/03.png` },
              { name: '达人机构', desc: 'MCN/招商团长', icon: `${CDN}/page3/04.png` },
              { name: '服务商', desc: '共同构建经营', icon: 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media/fuwushang.7f5973fe.png' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center hover:bg-white/15 transition-all cursor-pointer group">
                <Image src={item.icon} alt={item.name} width={48} height={48} className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 group-hover:scale-110 transition-transform" unoptimized />
                <div className="text-white text-sm font-medium">{item.name}</div>
                <div className="text-white/40 text-[11px] mt-0.5 hidden md:block">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side floating sidebar - matching douyinec.com */}
        <div className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 flex-col items-center bg-[#1a2a4a]/80 backdrop-blur-md rounded-2xl py-4 px-3 gap-3 z-20">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
            <StarIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white text-[10px] whitespace-nowrap">快速加入</span>
          <div className="w-6 h-px bg-white/20" />
          {['境内商家', '跨境商家', '达人', '机构', '服务商'].map((name, i) => (
            <span key={i} className="text-white/50 text-[10px] hover:text-white cursor-pointer transition-colors whitespace-nowrap">{name}</span>
          ))}
          <div className="w-6 h-px bg-white/20" />
          <span className="text-white/50 text-[10px] cursor-pointer">调研问卷</span>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
