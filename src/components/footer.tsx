"use client";

/**
 * 页脚 - 仿抖音商城官网样式
 * 左侧：购物袋音符 Logo + 品牌名 + 手写 slogan
 * 右侧：关注或联系我们（下载APP / 官方账号 / 微信公众号）
 * 底部：版权声明
 */
export default function Footer() {
  return (
    <footer className="bg-[#0A1628] text-[#8C8C8C] mt-auto">
      {/* 主内容区 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* 左侧：品牌标识区 */}
          <div className="flex flex-col items-center md:items-start order-1">
            <div className="flex items-center gap-3">
              {/* 购物袋音符 Logo（抖音商城图标风格） */}
              <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
                {/* 购物袋主体（黑色圆角袋） */}
                <path
                  d="M8 13h32l-2.6 27a4.5 4.5 0 0 1-4.5 4H15a4.5 4.5 0 0 1-4.5-4z"
                  fill="#141414"
                />
                {/* 提手 */}
                <path
                  d="M17 13v-2a7 7 0 0 1 14 0v2"
                  fill="none"
                  stroke="#141414"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
                {/* 白色抖音音符 */}
                <path
                  d="M30.4 12.5v13.7a4.6 4.6 0 1 1-4.6-4.6V21.4l-7 1.9v-3.1l11.6-2.9z"
                  fill="#fff"
                />
              </svg>
              <span className="text-white text-[22px] font-bold tracking-wide">惠抢券</span>
            </div>
            {/* 手写 slogan + 手写下划线 */}
            <p
              className="mt-2.5 text-white/85 text-lg leading-none"
              style={{ fontFamily: "'Ma Shan Zheng', cursive" }}
            >
              总能发现好优惠！
            </p>
            <svg className="mt-1" width="130" height="10" viewBox="0 0 130 10" aria-hidden="true">
              <path
                d="M6 7 C 40 3, 85 3, 124 6"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 右侧：关注或联系我们 */}
          <div className="order-2 flex flex-col items-center md:items-start">
            <p className="text-[#8C8C8C] text-sm mb-4">关注或联系我们</p>
            <div className="flex gap-5">
              {/* 下载APP */}
              <div className="text-center">
                <div className="w-[72px] h-[72px] bg-white/[0.08] rounded-2xl flex items-center justify-center">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B0B8C4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <path d="M14 14h3v3h-3z" />
                    <path d="M18 14h3v3h-3z" />
                    <path d="M14 18h3v3h-3z" />
                    <path d="M18 18h3v3h-3z" />
                  </svg>
                </div>
                <p className="mt-2 text-[#9AA3AF] text-xs">下载APP</p>
              </div>
              {/* 官方账号 */}
              <div className="text-center">
                <div className="w-[72px] h-[72px] bg-white/[0.08] rounded-2xl flex items-center justify-center">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B0B8C4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.6" />
                    <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
                  </svg>
                </div>
                <p className="mt-2 text-[#9AA3AF] text-xs">官方账号</p>
              </div>
              {/* 微信公众号 */}
              <div className="text-center">
                <div className="w-[72px] h-[72px] bg-white/[0.08] rounded-2xl flex items-center justify-center">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B0B8C4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </div>
                <p className="mt-2 text-[#9AA3AF] text-xs">微信公众号</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部版权条 */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-[#6B7280] text-xs">© 2027 惠抢券 版权所有</p>
        </div>
      </div>
    </footer>
  );
}