'use client';

import React from 'react';

interface CouponCardImageProps {
  price: number;
  name: string;
  className?: string;
}

export default function CouponCardImage({ price, name, className = '' }: CouponCardImageProps) {
  const formatPrice = (p: number) => {
    if (p >= 100000000) return `${(p / 100000000).toFixed(0)}00万`;
    if (p >= 10000) return `${(p / 10000).toFixed(0)}万`;
    return p.toLocaleString();
  };

  const displayPrice = price >= 10000 ? `${price / 10000}万` : price.toLocaleString();

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #eef1f7 100%)' }}>

      {/* Top brand area */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
        {/* 抖音 Logo mark */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M16.6 5.82C15.56 4.94 14.2 4.4 12.72 4.4H12.04V10.16C11.68 9.96 11.26 9.84 10.82 9.84C9.36 9.84 8.18 11.02 8.18 12.48C8.18 13.94 9.36 15.12 10.82 15.12C12.28 15.12 13.46 13.94 13.46 12.48V7.86H14.36C15.32 7.86 16.18 8.26 16.82 8.88V5.82H16.6Z" fill="#1A1A1A"/>
        </svg>
        <span className="text-[10px] font-bold text-gray-800 tracking-tight">抖音电商</span>
      </div>

      {/* Center value area */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full rounded-lg p-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1890FF 0%, #0A6FD9 50%, #0050B3 100%)',
            boxShadow: '0 2px 12px rgba(24,144,255,0.25)',
          }}>
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 4px)',
            }} />
          <div className="relative text-center">
            <div className="text-white/40 text-[8px] font-medium tracking-[3px] mb-0.5">VOUCHER</div>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-white/70 text-sm font-bold">¥</span>
              <span className="text-white font-black text-2xl md:text-3xl tabular-nums tracking-tight"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                {displayPrice}
              </span>
            </div>
            <div className="text-white/50 text-[7px] mt-1">有效期：永久有效</div>
          </div>
        </div>
      </div>

      {/* Bottom info area */}
      <div className="px-4 pt-2 pb-3"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.03) 100%)' }}>
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] text-gray-500">面额</span>
          <span className="text-xs font-bold text-gray-800">¥{price.toLocaleString()}</span>
        </div>
        <div className="text-[8px] text-gray-400 mt-0.5 truncate">{name}</div>
      </div>

      {/* Decorative circles (voucher cutout effect) */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
        style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #eef1f7 100%)' }} />
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
        style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #eef1f7 100%)' }} />
    </div>
  );
}
