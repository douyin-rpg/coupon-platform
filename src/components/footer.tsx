"use client";

import { useEffect, useState } from "react";

/**
 * 页脚 - 仿抖音商城官网样式
 * 左侧：Logo 图片
 * 右侧：联系我们 / 关联平台 / 资质证照（三栏链接，来自 footer_links 数据）
 * 底部：版权声明
 */
type FooterLink = { id: string; label: string; url: string };
type FooterGroups = Record<string, FooterLink[]>;

export default function Footer() {
  const [groups, setGroups] = useState<FooterGroups>({});

  useEffect(() => {
    fetch("/api/footer-links")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("加载失败"))))
      .then((d: { footerLinks?: FooterGroups }) => {
        if (d?.footerLinks) setGroups(d.footerLinks);
      })
      .catch(() => {
        /* 静默失败，页脚不展示链接 */
      });
  }, []);

  return (
    <footer className="bg-[#0A1628] text-[#8C8C8C] mt-auto">
      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* 左侧：Logo 图片 */}
          <div className="shrink-0 w-full md:w-72 flex flex-col items-center md:items-start">
            <img
              src="/logo-douyin.png"
              alt="惠抢券 Logo"
              className="w-48 h-auto md:w-56 object-contain"
            />
          </div>

          {/* 右侧：三栏链接 */}
          {Object.keys(groups).length > 0 && (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {Object.entries(groups).map(([section, links]) => (
                <div key={section}>
                  <h4 className="text-white text-sm font-semibold mb-4">{section}</h4>
                  <ul className="space-y-2.5">
                    {links.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          target={link.url.startsWith("http") ? "_blank" : undefined}
                          rel={link.url.startsWith("http") ? "nofollow noopener" : undefined}
                          className="text-[#8C8C8C] text-[13px] hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
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