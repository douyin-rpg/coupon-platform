'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const CDN = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uvpahylwvauhojylt_lm_tvjl/ljhwZthlaukjlkulzlp/douyin-ec';
const CDN2 = 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media';

const roleCards = [
  {
    name: '境内商家',
    desc: '在抖音开店卖货，带来生意增量',
    icon: `${CDN2}/doudian.7349dac0.png`,
    href: 'https://fxg.jinritemai.com?from=douyinofficial_table&source=dydsgwpcxb',
  },
  {
    name: '即时零售',
    desc: '线上线下联动，即时送达',
    icon: `${CDN2}/kuajing.ca0721db.png`,
    href: 'https://fxg.jinritemai.com/instant-retail?source=oldpcsidebar',
  },
  {
    name: '跨境商家',
    desc: '境外商家在抖音开店卖货',
    icon: `${CDN2}/daren.ae87ee58.png`,
    href: 'https://b.guantou.com?from=douyinofficial_table',
  },
  {
    name: '达人',
    desc: '抖音好物推荐官',
    icon: `${CDN2}/daremcn.b6d7dd6d.png`,
    href: 'https://buyin.douyinec.com/daren?from=douyinofficial_table',
  },
  {
    name: '达人机构',
    desc: 'MCN/招商团长/精选联盟',
    icon: `${CDN2}/fuwushang.7f5973fe.png`,
    href: 'https://buyin.douyinec.com/darenmcn?from=douyinofficial_table',
  },
  {
    name: '服务商',
    desc: '与商家共同构建经营阵地',
    icon: `${CDN2}/doudian.7349dac0.png`,
    href: 'https://partner.jinritemai.com/home?from=douyinofficial_table',
  },
];

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);
  const router = useRouter();

  // Background slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % 5);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/invite/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-screen slideshow background */}
      <div className="absolute inset-0">
        {[1,2,3,4,5].map((num) => (
          <div
            key={num}
            className="absolute inset-0 transition-opacity duration-[1500ms]"
            style={{
              opacity: currentBg % 5 === num - 1 ? 1 : 0,
              backgroundColor: ['#5ac8ff','#acc9f7','#7eb6ff','#b8d4ff','#8ec5ff'][num-1],
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${CDN}/page1/0${num}.jpg)`,
              }}
            />
            {currentBg % 5 === num - 1 && (
              <video
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
                poster={`${CDN}/page1/0${num}.jpg`}
              >
                <source src={`${CDN}/page1/0${num}-a.mp4`} type="video/mp4" />
              </video>
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>

      {/* Top nav - matching douyinec.com */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="抖音电商" width={140} height={40} className="h-7 md:h-9 w-auto" />
          </div>
          <div className="hidden lg:flex items-center gap-6 text-white/70 text-sm">
            <a href="https://www.douyinec.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">首页</a>
            <a href="https://fxg.jinritemai.com?from=douyinofficial_table&source=dydsgwpcxb" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">商家入驻</a>
            <a href="https://buyin.douyinec.com/daren?from=douyinofficial_table" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">达人入驻</a>
            <a href="https://buyin.douyinec.com/darenmcn?from=douyinofficial_table" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">机构入驻</a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://fxg.jinritemai.com?from=douyinofficial_table&source=dydsgwpcxb"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex px-5 py-1.5 rounded-full bg-[#1890FF] text-white text-sm font-medium hover:bg-[#1890FF]/80 transition-colors"
            >
              商家入驻
            </a>
          </div>
        </div>
      </div>

      {/* Hero title */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-12 pb-4 text-center">
        <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-wide"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
          加入抖音电商，激发兴趣 引领增长
        </h1>
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 flex-wrap">
          {['抖音超6亿日活', '全面购物场景', '一站式全链经营'].map((text) => (
            <div key={text} className="flex items-center gap-1.5 text-white/80 text-xs md:text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Invite code input */}
        <div className={`max-w-md mx-auto mb-8 ${error ? 'invite-shake' : ''}`}>
          <form onSubmit={handleSubmit} className="flex items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value); setError(''); }}
                placeholder="请输入邀请码"
                className="w-full h-11 md:h-12 pl-4 pr-2 rounded-l-full bg-white text-gray-800 text-sm md:text-base border-0 outline-none placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-11 md:h-12 px-6 md:px-8 rounded-r-full bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white text-sm md:text-base font-medium transition-colors disabled:opacity-60"
              style={{ boxShadow: '0 4px 15px rgba(254,44,85,0.3)' }}
            >
              {loading ? '验证中...' : '确认'}
            </button>
          </form>
          {error && (
            <p className="text-red-300 text-xs mt-2 text-center">{error}</p>
          )}
        </div>
      </div>

      {/* Role cards - matching douyinec.com page3 */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
        <div className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/8 p-4 md:p-6"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {roleCards.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/8 hover:bg-white/12 rounded-xl p-4 md:p-5 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={40}
                    height={40}
                    className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 group-hover:scale-110 transition-transform"
                    unoptimized
                  />
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium">{item.name}</div>
                    <div className="text-white/40 text-[11px] mt-0.5 line-clamp-2">{item.desc}</div>
                    <div className="flex items-center gap-1 mt-2 text-[#00D4FF] text-[11px] font-medium group-hover:gap-1.5 transition-all">
                      立即入驻
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar - matching douyinec.com quick join */}
      <div className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-20 flex-col items-center bg-[#0D1B3E]/90 backdrop-blur-md rounded-xl py-4 px-3 gap-3 border border-white/8"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div className="flex flex-col items-center gap-1 mb-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span className="text-white text-[10px] whitespace-nowrap">快速加入</span>
        </div>
        {[
          { name: '境内商家', href: 'https://fxg.jinritemai.com?from=douyinofficial_table&source=dydsgwpcxb' },
          { name: '跨境商家', href: 'https://b.guantou.com?from=douyinofficial_table' },
          { name: '即时零售', href: 'https://fxg.jinritemai.com/instant-retail?source=oldpcsidebar' },
          { name: '达人', href: 'https://buyin.douyinec.com/daren?from=douyinofficial_table' },
          { name: '机构', href: 'https://buyin.douyinec.com/darenmcn?from=douyinofficial_table' },
          { name: '服务商', href: 'https://partner.jinritemai.com/home?from=douyinofficial_table' },
          { name: '抖客', href: 'https://buyin.jinritemai.com/mpa/account/douke-login?log_out=1' },
        ].map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white text-[11px] whitespace-nowrap transition-colors"
          >
            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
}
