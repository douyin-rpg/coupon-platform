"use client";

export default function Footer() {
  return (
    <footer className="bg-[#0A1628] text-[#8C8C8C] mt-auto">
      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* 左侧：Logo + 标语 + 二维码（手机端置顶居中） */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start order-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className="text-white text-lg font-bold">惠抢券</span>
            </div>
            <p className="text-[#8C8C8C] text-sm mb-6 italic">总能发现好优惠！</p>

            {/* 关注或联系我们 - 三个按钮 */}
            <div className="text-center md:text-left w-full">
              <p className="text-[#8C8C8C] text-xs mb-3">关注或联系我们</p>
              <div className="flex gap-4 justify-center md:justify-start">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mb-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8C8C8C" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="3" height="3" />
                      <rect x="18" y="14" width="3" height="3" />
                      <rect x="14" y="18" width="3" height="3" />
                      <rect x="18" y="18" width="3" height="3" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-[#555]">下载APP</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mb-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8C8C8C" strokeWidth="1.5">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      <path d="M8 12a4 4 0 018 0" />
                      <circle cx="12" cy="12" r="1" fill="#8C8C8C" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-[#555]">官方账号</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mb-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8C8C8C" strokeWidth="1.5">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-[#555]">微信公众号</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：链接区域（手机端置后） */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6 order-2">
            {/* 联系我们（人工咨询热线已去掉） */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">联系我们</h4>
              <ul className="space-y-3">
                <li>
                  <span className="text-[#8C8C8C] text-xs">廉洁举报</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href="mailto:lianjie@bytedance.com"
                      className="text-[#C0C0C0] text-sm hover:text-[#1890FF] transition-colors"
                    >
                      lianjie@bytedance.com
                    </a>
                  </div>
                </li>
                <li>
                  <a
                    href="https://bytedance.larkoffice.com/share/base/form/shrcnTMx4X98p1ISCrklZnxvHHf"
                    target="_blank"
                    rel="nofollow"
                    className="text-[#C0C0C0] text-sm hover:text-[#1890FF] transition-colors"
                  >
                    举报入口
                  </a>
                </li>
              </ul>
            </div>

            {/* 关联平台 */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">关联平台</h4>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {[
                  { label: "热招行业", url: "/hot-category" },
                  { label: "基地服务", url: "https://fuwu.jinritemai.com/optimus/60dc30bd05420d0040d2f289" },
                  { label: "开放平台", url: "https://op.jinritemai.com/home" },
                  { label: "服务市场", url: "https://fuwu.jinritemai.com/?from=fxg_home_more" },
                  { label: "全球购", url: "https://b.guantou.com/welcome?source=doudian" },
                  { label: "类目入驻", url: "/category" },
                  { label: "问答列表", url: "/ask" },
                  { label: "拍卖店", url: "https://fxg.jinritemai.com/login/common?next=https%3A%2F%2Ffxg.jinritemai.com%2Fffa%2Fgov%2Fsettle%2Fhome%3Fshop_type%3D14%26vType%3D0" },
                  { label: "字节跳动", url: "https://www.bytedance.com/zh/" },
                  { label: "抖音", url: "https://www.douyin.com/" },
                  { label: "今日头条", url: "https://www.toutiao.com/" },
                  { label: "西瓜视频", url: "https://www.ixigua.com/" },
                  { label: "抖音火山版", url: "https://www.huoshanzhibo.com/" },
                  { label: "巨量引擎", url: "https://www.oceanengine.com/?source=doudian" },
                  { label: "巨量百应", url: "https://buyin.jinritemai.com/" },
                  { label: "抖音电商", url: "https://douyinec.com/" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.url}
                    target={item.url.startsWith("http") ? "_blank" : undefined}
                    rel={item.url.startsWith("http") ? "nofollow" : undefined}
                    className="text-[#8C8C8C] text-xs hover:text-[#C0C0C0] transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* 资质证照 */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">资质证照</h4>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                <a
                  href="https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/20250814-171406.png"
                  target="_blank"
                  rel="nofollow"
                  className="text-[#8C8C8C] text-xs hover:text-[#C0C0C0] transition-colors"
                >
                  营业执照
                </a>
                <a
                  href="https://beian.miit.gov.cn/#/Integrated/index"
                  target="_blank"
                  rel="nofollow"
                  className="text-[#8C8C8C] text-xs hover:text-[#C0C0C0] transition-colors"
                >
                  沪ICP备2021017807号-10
                </a>
                <a
                  href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=31011002005972"
                  target="_blank"
                  className="text-[#8C8C8C] text-xs hover:text-[#C0C0C0] transition-colors inline-flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  沪公网安备 31011002005972号
                </a>
                <a
                  href="https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/footer/434-01-089-上海格物致品网络科技有限公司-增值电信业务经营许可证（ICP、EDI）20241213-20270130.pdf"
                  target="_blank"
                  rel="nofollow"
                  className="text-[#8C8C8C] text-xs hover:text-[#C0C0C0] transition-colors"
                >
                  增值电信业务经营许可证(沪B2-20220149)
                </a>
                <a
                  href="https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/footer/434-07-019-上海格物致品网络科技有限公司-医疗器械网络交易服务第三方平台备案凭证20250103.jpg"
                  target="_blank"
                  rel="nofollow"
                  className="text-[#8C8C8C] text-xs hover:text-[#C0C0C0] transition-colors"
                >
                  (沪)网械平台备字[2022]第00002号
                </a>
                <span className="text-[#8C8C8C] text-xs">
                  沪网药信备字〔2025〕00219号
                </span>
                <span className="text-[#8C8C8C] text-xs">
                  沪网食备0000515号(第三方平台)
                </span>
                <a
                  href="https://lf3-static.bytednsdoc.com/obj/eden-cn/oadvyn-lm/ljhwZthlaukjlkulzlp/merchant-recruitment/pc/footer/(沪)网药平台备字[2023]第00004-007号.png"
                  target="_blank"
                  rel="nofollow"
                  className="text-[#8C8C8C] text-xs hover:text-[#C0C0C0] transition-colors"
                >
                  (沪)网药平台备字[2023]第00004-007号
                </a>
                <span className="text-[#8C8C8C] text-xs">
                  集邮市场开办者备案：沪集邮备006
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部版权条 */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#555] text-xs">
            © 2027 惠抢券 版权所有
          </p>
        </div>
      </div>
    </footer>
  );
}